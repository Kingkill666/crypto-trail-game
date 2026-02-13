/**
 * Seed script: Pull all players from the CryptoTrailPayment contract
 * via Blockscout API and populate the Redis leaderboard.
 *
 * Since we don't have on-chain game results (NFT contract not deployed yet),
 * we create entries based on payment transactions (each = 1 game played).
 * Scores default to 0 — they'll be updated when players play again.
 *
 * Usage: node scripts/seed-leaderboard.mjs
 */

import { Redis } from "@upstash/redis";

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const PAYMENT_CONTRACT = "0xCAe612D6FCa42B6C7E9aC1eC45047C4b38BC9B0B";

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
  console.error("Missing KV_REST_API_URL or KV_REST_API_TOKEN in environment");
  process.exit(1);
}

const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });

// ── Fetch all payment txs from Blockscout ──
async function fetchAllPlayers() {
  const players = new Map();
  let nextParams = null;
  let page = 1;

  while (true) {
    let url = `https://base.blockscout.com/api/v2/addresses/${PAYMENT_CONTRACT}/transactions?filter=to`;
    if (nextParams) {
      const params = new URLSearchParams(nextParams);
      url += `&${params.toString()}`;
    }

    console.log(`Fetching page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Blockscout API error:", res.status);
      break;
    }

    const data = await res.json();
    if (!data.items || data.items.length === 0) break;

    for (const tx of data.items) {
      if (tx.status !== "ok") continue;
      const addr = tx.from?.hash?.toLowerCase();
      if (!addr) continue;

      if (!players.has(addr)) {
        players.set(addr, { count: 0, firstPlay: null, lastPlay: null, wallet: tx.from.hash });
      }
      const p = players.get(addr);
      p.count++;
      const ts = new Date(tx.timestamp).getTime();
      if (!p.firstPlay || ts < p.firstPlay) p.firstPlay = ts;
      if (!p.lastPlay || ts > p.lastPlay) p.lastPlay = ts;
    }

    if (!data.next_page_params) break;
    nextParams = data.next_page_params;
    page++;
  }

  return players;
}

// ── Resolve Farcaster profiles via Neynar ──
async function resolveFarcasterProfiles(wallets) {
  if (!NEYNAR_API_KEY) {
    console.log("No NEYNAR_API_KEY — skipping Farcaster profile resolution");
    return new Map();
  }

  const profiles = new Map();
  // Neynar supports bulk lookup — up to 350 addresses per request
  const batchSize = 50;
  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize);
    const addresses = batch.join(",");
    try {
      const res = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addresses}`,
        {
          headers: {
            "x-api-key": NEYNAR_API_KEY,
            accept: "application/json",
          },
        }
      );
      if (!res.ok) {
        console.log(`Neynar batch ${i / batchSize + 1} failed:`, res.status);
        continue;
      }
      const data = await res.json();
      // Response: { "0xaddr": [{ fid, username, display_name, pfp_url }] }
      for (const [addr, users] of Object.entries(data)) {
        if (users && users.length > 0) {
          const u = users[0];
          profiles.set(addr.toLowerCase(), {
            fid: String(u.fid),
            username: u.username || "",
            displayName: u.display_name || u.username || "",
            pfp: u.pfp_url || "",
          });
        }
      }
    } catch (e) {
      console.log(`Neynar batch ${i / batchSize + 1} error:`, e.message);
    }
  }

  return profiles;
}

// ── Main ──
async function main() {
  console.log("=== Crypto Trail Leaderboard Seed ===\n");

  // 1. Fetch all players from Blockscout
  console.log("1. Fetching players from payment contract...");
  const players = await fetchAllPlayers();
  console.log(`   Found ${players.size} unique players\n`);

  if (players.size === 0) {
    console.log("No players found. Exiting.");
    return;
  }

  // 2. Resolve Farcaster profiles
  const wallets = Array.from(players.keys());
  console.log("2. Resolving Farcaster profiles...");
  const profiles = await resolveFarcasterProfiles(wallets);
  console.log(`   Resolved ${profiles.size} Farcaster profiles\n`);

  // 3. Seed Redis
  console.log("3. Seeding Redis leaderboard...");
  let seeded = 0;

  for (const [addr, info] of players) {
    const fc = profiles.get(addr);
    const pk = `player:${addr}`;

    // Check if player already exists in Redis
    const existing = await redis.hgetall(pk);
    if (existing && existing.games_played) {
      console.log(`   SKIP ${addr} — already in Redis (${existing.games_played} games)`);
      continue;
    }

    // Create player stats hash
    const stats = {
      games_played: info.count,
      best_score: 0, // No score data from payment contract
      best_tier: "dead", // Default tier
      best_survived: "false",
      last_played: info.lastPlay || Date.now(),
      wallet: info.wallet, // Checksummed
    };

    if (fc) {
      stats.fc_fid = fc.fid;
      stats.fc_username = fc.username;
      stats.fc_display_name = fc.displayName;
      stats.fc_pfp = fc.pfp;
      stats.fc_resolved_at = Date.now();
    }

    const pipe = redis.pipeline();
    pipe.hset(pk, stats);
    // Add to leaderboard sorted set (score = 0 for now)
    pipe.zadd("leaderboard:top", { score: 0, member: addr });
    // Add a placeholder game entry
    pipe.lpush(`player:${addr}:games`, JSON.stringify({
      score: 0,
      tier: "dead",
      survived: false,
      days: 0,
      miles: 0,
      survivors: 0,
      class: "unknown",
      timestamp: info.lastPlay || Date.now(),
    }));
    await pipe.exec();

    const name = fc ? `${fc.displayName} (@${fc.username})` : addr.slice(0, 10) + "...";
    console.log(`   SEEDED ${name} — ${info.count} game(s)`);
    seeded++;
  }

  console.log(`\n=== Done! Seeded ${seeded} new players ===`);

  // 4. Verify
  console.log("\nVerifying leaderboard...");
  const top = await redis.zrange("leaderboard:top", 0, 49, { rev: true, withScores: true });
  console.log(`Leaderboard has ${top.length / 2} entries`);
  for (let i = 0; i < top.length; i += 2) {
    const wallet = String(top[i]);
    const score = Number(top[i + 1]);
    const stats = await redis.hgetall(`player:${wallet}`);
    const name = stats?.fc_display_name || stats?.fc_username || wallet.slice(0, 10) + "...";
    console.log(`  #${i / 2 + 1} ${name} — Score: ${score}, Games: ${stats?.games_played || 0}`);
  }
}

main().catch(console.error);
