import { Redis } from "@upstash/redis";

// ── TYPES ──

export interface PlayerStats {
  [key: string]: unknown;
  games_played: number;
  best_score: number;
  best_tier: string;
  best_survived: boolean;
  last_played: number;
  wallet: string;
  fc_fid?: string;
  fc_username?: string;
  fc_display_name?: string;
  fc_pfp?: string;
  fc_resolved_at?: number;
}

export interface GameEntry {
  score: number;
  tier: string;
  survived: boolean;
  days: number;
  miles: number;
  survivors: number;
  class: string;
  timestamp: number;
}

export interface LeaderboardRow {
  rank: number;
  wallet: string;
  best_score: number;
  best_tier: string;
  games_played: number;
  fc_fid?: string;
  fc_username?: string;
  fc_display_name?: string;
  fc_pfp?: string;
}

// ── REDIS CLIENT ──

function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN");
  }
  return new Redis({ url, token });
}

// ── CONSTANTS ──

const LEADERBOARD_KEY = "leaderboard:top";
const PLAYER_PREFIX = "player:";
const GAMES_SUFFIX = ":games";
const MAX_GAME_HISTORY = 50;
const NEYNAR_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const TIER_RANK: Record<string, number> = {
  dead: 0,
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

// ── HELPERS ──

function playerKey(address: string): string {
  return `${PLAYER_PREFIX}${address.toLowerCase()}`;
}

function gamesKey(address: string): string {
  return `${PLAYER_PREFIX}${address.toLowerCase()}${GAMES_SUFFIX}`;
}

export function getTierFromScore(score: number, survived: boolean): string {
  if (!survived) return "dead";
  if (score >= 6000) return "legendary";
  if (score >= 4000) return "epic";
  if (score >= 2000) return "rare";
  return "common";
}

// ── OPERATIONS ──

export async function submitGameResult(
  wallet: string,
  game: GameEntry
): Promise<PlayerStats> {
  const redis = getRedis();
  const addr = wallet.toLowerCase();
  const pk = playerKey(addr);
  const gk = gamesKey(addr);

  const existing = await redis.hgetall<PlayerStats>(pk);

  const gamesPlayed = (existing?.games_played ?? 0) + 1;
  const existingBestScore = existing?.best_score ?? 0;
  const existingBestTierRank = TIER_RANK[existing?.best_tier ?? "dead"] ?? 0;
  const newTierRank = TIER_RANK[game.tier] ?? 0;

  const newBestTier =
    newTierRank > existingBestTierRank
      ? game.tier
      : newTierRank === existingBestTierRank && game.score > existingBestScore
        ? game.tier
        : existing?.best_tier ?? game.tier;

  const newBestScore = Math.max(existingBestScore, game.score);

  const updates: Record<string, string | number | boolean> = {
    games_played: gamesPlayed,
    best_score: newBestScore,
    best_tier: newBestTier,
    best_survived: newBestScore === game.score ? game.survived : (existing?.best_survived ?? game.survived),
    last_played: game.timestamp,
    wallet,
  };
  // Preserve existing Farcaster data
  if (existing?.fc_fid) updates.fc_fid = existing.fc_fid;
  if (existing?.fc_username) updates.fc_username = existing.fc_username;
  if (existing?.fc_display_name) updates.fc_display_name = existing.fc_display_name;
  if (existing?.fc_pfp) updates.fc_pfp = existing.fc_pfp;
  if (existing?.fc_resolved_at) updates.fc_resolved_at = existing.fc_resolved_at;

  // Pipeline: update hash, sorted set, and game history atomically
  const pipe = redis.pipeline();
  pipe.hset(pk, updates);
  pipe.zadd(LEADERBOARD_KEY, { score: newBestScore, member: addr });
  pipe.lpush(gk, JSON.stringify(game));
  pipe.ltrim(gk, 0, MAX_GAME_HISTORY - 1);
  await pipe.exec();

  return {
    games_played: gamesPlayed,
    best_score: newBestScore,
    best_tier: newBestTier,
    best_survived: game.survived,
    last_played: game.timestamp,
    wallet,
  };
}

export async function getLeaderboard(limit: number = 50): Promise<LeaderboardRow[]> {
  const redis = getRedis();

  const results = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  if (!results || results.length === 0) return [];

  // Parse into pairs: [member, score, member, score, ...]
  const rows: LeaderboardRow[] = [];
  for (let i = 0; i < results.length; i += 2) {
    const wallet = String(results[i]);
    const best_score = Number(results[i + 1]);
    rows.push({
      rank: Math.floor(i / 2) + 1,
      wallet,
      best_score,
      best_tier: "common",
      games_played: 0,
    });
  }

  // Batch-fetch player stats
  const pipe = redis.pipeline();
  for (const row of rows) {
    pipe.hgetall(playerKey(row.wallet));
  }
  const statsResults = await pipe.exec<(PlayerStats | null)[]>();

  for (let i = 0; i < rows.length; i++) {
    const stats = statsResults[i];
    if (stats) {
      rows[i].best_tier = stats.best_tier || "common";
      rows[i].games_played = stats.games_played || 0;
      rows[i].fc_fid = stats.fc_fid;
      rows[i].fc_username = stats.fc_username;
      rows[i].fc_display_name = stats.fc_display_name;
      rows[i].fc_pfp = stats.fc_pfp;
    }
  }

  return rows;
}

export async function getPlayerProfile(address: string): Promise<{
  stats: PlayerStats | null;
  games: GameEntry[];
  rank: number | null;
} | null> {
  const redis = getRedis();
  const addr = address.toLowerCase();
  const pk = playerKey(addr);
  const gk = gamesKey(addr);

  const [stats, gamesRaw, rank] = await Promise.all([
    redis.hgetall<PlayerStats>(pk),
    redis.lrange<string>(gk, 0, MAX_GAME_HISTORY - 1),
    redis.zrevrank(LEADERBOARD_KEY, addr),
  ]);

  if (!stats || !stats.wallet) return null;

  const games: GameEntry[] = (gamesRaw || []).map((g) =>
    typeof g === "string" ? JSON.parse(g) : g
  );

  return {
    stats,
    games,
    rank: rank !== null && rank !== undefined ? rank + 1 : null,
  };
}

export async function updateFarcasterProfile(
  address: string,
  profile: { fid: string; username: string; displayName: string; pfp: string }
): Promise<void> {
  const redis = getRedis();
  const pk = playerKey(address.toLowerCase());
  await redis.hset(pk, {
    fc_fid: profile.fid,
    fc_username: profile.username,
    fc_display_name: profile.displayName,
    fc_pfp: profile.pfp,
    fc_resolved_at: Date.now(),
  });
}

export function needsFarcasterRefresh(stats: PlayerStats | null): boolean {
  if (!stats) return true;
  if (!stats.fc_resolved_at) return true;
  return Date.now() - stats.fc_resolved_at > NEYNAR_CACHE_TTL_MS;
}

// ── FREE PLAY OPERATIONS ──

const FREE_PLAY_PREFIX = "freeplay:";

function freePlayKey(address: string): string {
  return `${FREE_PLAY_PREFIX}${address.toLowerCase()}`;
}

export async function grantFreePlay(
  address: string,
  reason: string,
  grantedBy: string
): Promise<{ granted: boolean; plays: number }> {
  const redis = getRedis();
  const key = freePlayKey(address);
  const existing = await redis.get<number>(key);
  const newCount = (existing ?? 0) + 1;
  await redis.set(key, newCount);
  // Log the grant for audit
  const logKey = `${FREE_PLAY_PREFIX}log:${address.toLowerCase()}`;
  await redis.lpush(logKey, JSON.stringify({
    action: "grant",
    reason,
    grantedBy,
    timestamp: Date.now(),
  }));
  return { granted: true, plays: newCount };
}

export async function checkFreePlay(address: string): Promise<number> {
  const redis = getRedis();
  const key = freePlayKey(address);
  const count = await redis.get<number>(key);
  return count ?? 0;
}

export async function consumeFreePlay(address: string): Promise<boolean> {
  const redis = getRedis();
  const key = freePlayKey(address);
  const count = await redis.get<number>(key);
  if (!count || count <= 0) return false;
  const newCount = count - 1;
  if (newCount <= 0) {
    await redis.del(key);
  } else {
    await redis.set(key, newCount);
  }
  // Log the consumption
  const logKey = `${FREE_PLAY_PREFIX}log:${address.toLowerCase()}`;
  await redis.lpush(logKey, JSON.stringify({
    action: "consume",
    timestamp: Date.now(),
  }));
  return true;
}

// ── NFT IMAGE STORAGE ──
// Store NFT images + metadata in KV so they persist (Vercel /tmp is ephemeral)

const NFT_IMAGE_PREFIX = "nft:img:";
const NFT_META_PREFIX = "nft:meta:";

export interface NftMetadata {
  name: string;
  description: string;
  image: string; // URL to the image endpoint
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

/**
 * Store an NFT image (base64 PNG data, without the data: prefix) in KV.
 */
export async function storeNftImage(
  hash: string,
  base64Data: string,
  metadata: Omit<NftMetadata, "image">,
  origin: string
): Promise<{ imageUrl: string; metadataUrl: string }> {
  const redis = getRedis();

  const imageUrl = `${origin}/api/nft-image/${hash}/image`;
  const metadataUrl = `${origin}/api/nft-image/${hash}`;

  const fullMetadata: NftMetadata = {
    ...metadata,
    image: imageUrl,
  };

  // Store both image data and metadata in Redis
  const pipe = redis.pipeline();
  pipe.set(`${NFT_IMAGE_PREFIX}${hash}`, base64Data);
  pipe.set(`${NFT_META_PREFIX}${hash}`, JSON.stringify(fullMetadata));
  await pipe.exec();

  return { imageUrl, metadataUrl };
}

/**
 * Retrieve raw base64 PNG data for an NFT image.
 */
export async function getNftImage(hash: string): Promise<string | null> {
  const redis = getRedis();
  return redis.get<string>(`${NFT_IMAGE_PREFIX}${hash}`);
}

/**
 * Retrieve ERC-721 metadata JSON for an NFT.
 */
export async function getNftMetadata(hash: string): Promise<NftMetadata | null> {
  const redis = getRedis();
  const raw = await redis.get<string>(`${NFT_META_PREFIX}${hash}`);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw as unknown as NftMetadata;
  } catch {
    return null;
  }
}
