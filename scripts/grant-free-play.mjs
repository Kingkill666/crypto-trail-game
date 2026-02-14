/**
 * Admin script: Grant free play(s) to a player wallet.
 * Used to compensate players who paid but couldn't play due to errors.
 *
 * Usage:
 *   node scripts/grant-free-play.mjs <wallet> [reason] [count]
 *
 * Examples:
 *   node scripts/grant-free-play.mjs 0x5F52fAEAbBA7D1CcAA578cd1aa9F8Ba0bAA2a8cA "failed transaction"
 *   node scripts/grant-free-play.mjs 0x5F52fAEAbBA7D1CcAA578cd1aa9F8Ba0bAA2a8cA "double charge" 2
 *
 * Requires env vars: KV_REST_API_URL, KV_REST_API_TOKEN
 */

import { Redis } from "@upstash/redis";

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
  console.error("Missing KV_REST_API_URL or KV_REST_API_TOKEN in environment");
  process.exit(1);
}

const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });

const wallet = process.argv[2];
const reason = process.argv[3] || "Admin override — failed transaction";
const count = parseInt(process.argv[4] || "1", 10);

if (!wallet || !wallet.startsWith("0x")) {
  console.error("Usage: node scripts/grant-free-play.mjs <wallet> [reason] [count]");
  console.error("  wallet: 0x... address");
  console.error("  reason: why the free play is being granted (default: 'Admin override — failed transaction')");
  console.error("  count:  number of free plays to grant (default: 1)");
  process.exit(1);
}

async function main() {
  const addr = wallet.toLowerCase();
  const key = `freeplay:${addr}`;
  const logKey = `freeplay:log:${addr}`;

  // Check current state
  const existing = await redis.get(key);
  console.log(`\n=== Grant Free Play ===`);
  console.log(`Wallet:  ${wallet}`);
  console.log(`Current: ${existing ?? 0} free play(s)`);
  console.log(`Adding:  ${count}`);
  console.log(`Reason:  ${reason}`);

  // Grant the free plays
  const newCount = (existing ?? 0) + count;
  await redis.set(key, newCount);

  // Log for audit
  for (let i = 0; i < count; i++) {
    await redis.lpush(logKey, JSON.stringify({
      action: "grant",
      reason,
      grantedBy: "admin-script",
      timestamp: Date.now(),
    }));
  }

  console.log(`\nDone! ${wallet} now has ${newCount} free play(s)`);

  // Show player info if they exist
  const playerData = await redis.hgetall(`player:${addr}`);
  if (playerData && playerData.wallet) {
    const name = playerData.fc_display_name || playerData.fc_username || addr.slice(0, 10) + "...";
    console.log(`\nPlayer info:`);
    console.log(`  Name:         ${name}`);
    console.log(`  Games played: ${playerData.games_played ?? 0}`);
    console.log(`  Best score:   ${playerData.best_score ?? 0}`);
    console.log(`  Best tier:    ${playerData.best_tier ?? "none"}`);
    if (playerData.fc_fid) console.log(`  Farcaster FID: ${playerData.fc_fid}`);
  } else {
    console.log(`\nNote: This wallet has no existing player record (new player).`);
  }
}

main().catch(console.error);
