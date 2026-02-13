#!/usr/bin/env node
/**
 * One-time script to call setMaxMintsPerWallet(0) on the deployed CryptoTrailNFT
 * contract, removing the per-wallet mint limit.
 *
 * Usage: node scripts/remove-mint-limit.mjs
 */

import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
  })
);

const NFT_CONTRACT = env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
const PRIVATE_KEY = env.OWNER_PRIVATE_KEY;

if (!NFT_CONTRACT || !PRIVATE_KEY) {
  console.error("Missing NEXT_PUBLIC_NFT_CONTRACT_ADDRESS or OWNER_PRIVATE_KEY in .env.local");
  process.exit(1);
}

const abi = parseAbi([
  "function setMaxMintsPerWallet(uint256 newMax) external",
  "function maxMintsPerWallet() view returns (uint256)",
]);

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

const walletClient = createWalletClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
  account,
});

async function main() {
  console.log(`NFT Contract: ${NFT_CONTRACT}`);
  console.log(`Owner wallet: ${account.address}\n`);

  // Check current limit
  const currentMax = await publicClient.readContract({
    address: NFT_CONTRACT,
    abi,
    functionName: "maxMintsPerWallet",
  });
  console.log(`Current maxMintsPerWallet: ${currentMax}`);

  if (currentMax >= 999999n) {
    console.log("Already effectively unlimited. Nothing to do.");
    return;
  }

  // Set to a very high number (effectively unlimited)
  // The deployed contract doesn't have 0=unlimited logic, so we use a large value
  const UNLIMITED = 999999999n;
  console.log(`Setting maxMintsPerWallet to ${UNLIMITED} (effectively unlimited)...`);
  const hash = await walletClient.writeContract({
    address: NFT_CONTRACT,
    abi,
    functionName: "setMaxMintsPerWallet",
    args: [UNLIMITED],
  });

  console.log(`  Tx submitted: ${hash}`);
  console.log("  Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ✓ Confirmed in block ${receipt.blockNumber}`);
  console.log(`  https://basescan.org/tx/${hash}`);

  // Verify
  const newMax = await publicClient.readContract({
    address: NFT_CONTRACT,
    abi,
    functionName: "maxMintsPerWallet",
  });
  console.log(`\nNew maxMintsPerWallet: ${newMax} (0 = unlimited)`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
