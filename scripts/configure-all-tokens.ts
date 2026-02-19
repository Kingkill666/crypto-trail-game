/**
 * Configure All Sponsored Tokens in New Rewards Contract
 * Maps each event title to its token address
 */

import { ethers } from "ethers";

const BASE_RPC = "https://mainnet.base.org";
const NEW_REWARDS_CONTRACT = "0xBd727931C785FaDcCd2aF6a4Ea70d12C90341B12";

const TOKEN_CONFIGS = [
  {
    eventTitle: "BETR POKER CHAMPION",
    tokenAddress: "0x051024B653E8ec69E72693F776c41C2A9401FB07",
    symbol: "BETR",
  },
  {
    eventTitle: "BRND MINI APP WINNER",
    tokenAddress: "0x41Ed0311640A5e489A90940b1c33433501a21B07",
    symbol: "BRND",
  },
  {
    eventTitle: "DAU CO-SPONSOR",
    tokenAddress: "0xe3A7766d0361f50a3Dd038C967479673B75f8B34",
    symbol: "DAU",
  },
  {
    eventTitle: "JESSE POLLAK APED IN",
    tokenAddress: "0x50F88fe97f72CD3E75b9Eb4f747F59BcEBA80d59",
    symbol: "JESSE",
  },
  {
    eventTitle: "FARCASTER MINI APP",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
  },
  {
    eventTitle: "PIZZA PARTY FOR VETS",
    tokenAddress: "0xa821f2ee19F4f62e404C934D43eB6E5763fbdb07",
    symbol: "PIZZA",
  },
  {
    eventTitle: "QR ONCHAIN ATTENTION",
    tokenAddress: "0x2b5050F01d64FBb3e4Ac44dc07f0732BFb5ecadF",
    symbol: "QR",
  },
];

const REWARDS_ABI = [
  "function configureToken(string eventTitle, address token) external",
  "function eventTokens(string) view returns (address)",
  "function owner() view returns (address)",
];

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚙️  CONFIGURE SPONSORED TOKENS IN NEW REWARDS CONTRACT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
  if (!OWNER_PRIVATE_KEY) {
    console.error("❌ OWNER_PRIVATE_KEY not set in .env.local");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

  console.log("Wallet:", wallet.address);
  console.log("Rewards Contract:", NEW_REWARDS_CONTRACT);
  console.log();

  const contract = new ethers.Contract(NEW_REWARDS_CONTRACT, REWARDS_ABI, wallet);

  // Verify ownership
  try {
    const owner = await contract.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error("❌ You are not the owner!");
      console.error(`   Owner: ${owner}`);
      console.error(`   You:   ${wallet.address}`);
      process.exit(1);
    }
    console.log("✅ Ownership verified\n");
  } catch (err) {
    console.error("❌ Could not verify ownership");
    process.exit(1);
  }

  console.log(`📝 Configuring ${TOKEN_CONFIGS.length} sponsored tokens...\n`);

  for (const config of TOKEN_CONFIGS) {
    try {
      // Check if already configured
      const currentToken = await contract.eventTokens(config.eventTitle);

      if (currentToken.toLowerCase() === config.tokenAddress.toLowerCase()) {
        console.log(`✅ ${config.symbol.padEnd(10)} "${config.eventTitle}" - Already configured`);
        continue;
      }

      console.log(`⏳ ${config.symbol.padEnd(10)} "${config.eventTitle}" - Configuring...`);

      const tx = await contract.configureToken(config.eventTitle, config.tokenAddress);
      console.log(`   Transaction: ${tx.hash}`);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log(`✅ ${config.symbol.padEnd(10)} "${config.eventTitle}" - Configured!\n`);
      } else {
        console.log(`❌ ${config.symbol.padEnd(10)} "${config.eventTitle}" - Failed\n`);
      }
    } catch (err: any) {
      console.error(`❌ ${config.symbol.padEnd(10)} Error: ${err.message?.slice(0, 80)}\n`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Token configuration complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📋 Next Step: Fund the contract with tokens");
  console.log("   Option 1: Send tokens from your wallet");
  console.log("   Option 2: Use old contract (if withdraw function exists)\n");
}

main().catch((error) => {
  console.error("\n❌ Error:");
  console.error(error.message || error);
  process.exitCode = 1;
});
