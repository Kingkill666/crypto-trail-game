import { Redis } from "@upstash/redis";

// ── TYPES ──

export interface SignedReward {
  nonce: string;
  token: string;
  amount: string;
  signature: string;
  eventTitle: string;
  displayAmount: string;
  symbol: string;
  signedAt: number;
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

const SESSION_PREFIX = "rewards:session:";
const EVENTS_SUFFIX = ":events";
const SIGNED_PREFIX = "rewards:signed:";
const PENDING_PREFIX = "rewards:pending:";
const SESSION_TTL = 7200; // 2 hours

// ── HELPERS ──

function sessionKey(wallet: string, sessionId: string): string {
  return `${SESSION_PREFIX}${wallet.toLowerCase()}:${sessionId}`;
}

function eventsKey(wallet: string, sessionId: string): string {
  return `${SESSION_PREFIX}${wallet.toLowerCase()}:${sessionId}${EVENTS_SUFFIX}`;
}

function signedKey(wallet: string, sessionId: string, eventTitle: string): string {
  return `${SIGNED_PREFIX}${wallet.toLowerCase()}:${sessionId}:${eventTitle}`;
}

function pendingKey(wallet: string, sessionId: string): string {
  return `${PENDING_PREFIX}${wallet.toLowerCase()}:${sessionId}`;
}

// ── SESSION MANAGEMENT ──

export async function createGameSession(
  wallet: string,
  sessionId: string
): Promise<void> {
  const redis = getRedis();
  const key = sessionKey(wallet, sessionId);
  const pipe = redis.pipeline();
  pipe.hset(key, {
    wallet: wallet.toLowerCase(),
    sessionId,
    startedAt: Date.now(),
  });
  pipe.expire(key, SESSION_TTL);
  await pipe.exec();
}

export async function recordSessionEvent(
  wallet: string,
  sessionId: string,
  eventTitle: string
): Promise<void> {
  const redis = getRedis();
  const key = eventsKey(wallet, sessionId);
  const pipe = redis.pipeline();
  pipe.lpush(key, eventTitle);
  pipe.expire(key, SESSION_TTL);
  await pipe.exec();
}

export async function validateGameSession(
  wallet: string,
  sessionId: string,
  eventTitle: string
): Promise<boolean> {
  const redis = getRedis();
  const key = sessionKey(wallet, sessionId);
  const session = await redis.hgetall(key);
  if (!session || !session.wallet) return false;

  const key2 = eventsKey(wallet, sessionId);
  const events = await redis.lrange<string>(key2, 0, -1);
  return events?.includes(eventTitle) ?? false;
}

// ── SIGNED REWARD TRACKING ──

export async function hasRewardBeenSigned(
  wallet: string,
  sessionId: string,
  eventTitle: string
): Promise<boolean> {
  const redis = getRedis();
  const key = signedKey(wallet, sessionId, eventTitle);
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function markRewardSigned(
  wallet: string,
  sessionId: string,
  eventTitle: string,
  data: Omit<SignedReward, "eventTitle" | "signedAt">
): Promise<void> {
  const redis = getRedis();
  const key = signedKey(wallet, sessionId, eventTitle);
  const pKey = pendingKey(wallet, sessionId);
  const reward: SignedReward = {
    ...data,
    eventTitle,
    signedAt: Date.now(),
  };
  const pipe = redis.pipeline();
  pipe.set(key, JSON.stringify(reward));
  pipe.expire(key, SESSION_TTL);
  pipe.lpush(pKey, JSON.stringify(reward));
  pipe.expire(pKey, SESSION_TTL);
  await pipe.exec();
}

export async function getPendingRewards(
  wallet: string,
  sessionId: string
): Promise<SignedReward[]> {
  const redis = getRedis();
  const key = pendingKey(wallet, sessionId);
  const raw = await redis.lrange<string>(key, 0, -1);
  if (!raw || raw.length === 0) return [];
  return raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r) as SignedReward);
}
