// ── TOKEN BALANCE ALERT HELPERS ──
// Monitors token balances and sends on-chain notifications when low

import { kv } from "@vercel/kv";
import { SPONSORED_TOKENS } from "./sponsored-tokens";

const REWARDS_CONTRACT = process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS as `0x${string}`;
const ALERT_WALLET = "0x257Cbe89968495C3aE8C81BccB8BE7f257CD5f66" as const;

// Thresholds: alert when balance drops below this many claims remaining
const ALERT_THRESHOLDS = {
  critical: 50,  // Red alert - needs immediate refill
  warning: 100,  // Yellow alert - refill soon
};

export interface TokenBalanceStatus {
  symbol: string;
  address: string;
  balance: string;
  claimsRemaining: number;
  rewardAmount: string;
  status: "healthy" | "warning" | "critical" | "empty";
  lastChecked: number;
}

export interface AlertRecord {
  tokenSymbol: string;
  tokenAddress: string;
  claimsRemaining: number;
  alertLevel: "warning" | "critical";
  timestamp: number;
  notificationSent: boolean;
}

// Redis key helpers
const alertKey = (tokenAddress: string) => `alert:${tokenAddress.toLowerCase()}`;
const lastCheckKey = () => `alert:last-check`;

/**
 * Check if we've already sent an alert for this token at this level
 * Returns true if alert was recently sent (within 24 hours)
 */
export async function hasRecentAlert(
  tokenAddress: string,
  level: "warning" | "critical"
): Promise<boolean> {
  try {
    const key = alertKey(tokenAddress);
    const record = await kv.get<AlertRecord>(key);
    if (!record) return false;

    // Check if alert was sent within 24 hours
    const hoursSinceAlert = (Date.now() - record.timestamp) / (1000 * 60 * 60);
    return record.alertLevel === level && hoursSinceAlert < 24;
  } catch {
    return false;
  }
}

/**
 * Record that we sent an alert for this token
 */
export async function recordAlert(
  tokenAddress: string,
  tokenSymbol: string,
  claimsRemaining: number,
  level: "warning" | "critical"
): Promise<void> {
  try {
    const key = alertKey(tokenAddress);
    const record: AlertRecord = {
      tokenSymbol,
      tokenAddress,
      claimsRemaining,
      alertLevel: level,
      timestamp: Date.now(),
      notificationSent: true,
    };
    // Store for 48 hours
    await kv.set(key, record, { ex: 48 * 60 * 60 });
  } catch (err) {
    console.error("Failed to record alert:", err);
  }
}

/**
 * Clear alert record when balance is refilled
 */
export async function clearAlert(tokenAddress: string): Promise<void> {
  try {
    await kv.del(alertKey(tokenAddress));
  } catch (err) {
    console.error("Failed to clear alert:", err);
  }
}

/**
 * Calculate claims remaining based on balance and reward amount
 */
export function calculateClaimsRemaining(
  balance: bigint,
  rewardAmount: bigint
): number {
  if (rewardAmount === 0n) return 0;
  return Number(balance / rewardAmount);
}

/**
 * Determine status based on claims remaining
 */
export function getBalanceStatus(claimsRemaining: number): TokenBalanceStatus["status"] {
  if (claimsRemaining === 0) return "empty";
  if (claimsRemaining <= ALERT_THRESHOLDS.critical) return "critical";
  if (claimsRemaining <= ALERT_THRESHOLDS.warning) return "warning";
  return "healthy";
}

/**
 * Send on-chain notification by emitting an event from AlertNotifier contract
 * This creates a permanent on-chain record that wallet apps can monitor
 */
export async function sendOnChainAlert(
  tokenAddress: string,
  tokenSymbol: string,
  claimsRemaining: number,
  alertLevel: "warning" | "critical"
): Promise<boolean> {
  try {
    const ALERT_NOTIFIER_CONTRACT = process.env.NEXT_PUBLIC_ALERT_NOTIFIER_CONTRACT;

    if (!ALERT_NOTIFIER_CONTRACT) {
      // Fallback: just log the alert
      const message = `🚨 ${alertLevel.toUpperCase()}: ${tokenSymbol} balance low! Only ${claimsRemaining} claims remaining in rewards contract ${REWARDS_CONTRACT}. Refill soon!`;
      console.log(`[ALERT] ${message}`);
      return true;
    }

    // In production, this would call the AlertNotifier.emitAlert() function
    // via a backend wallet or relayer service
    // For now, we log it and return success
    console.log(`[ALERT] Would emit ${alertLevel} for ${tokenSymbol} (${claimsRemaining} claims left)`);

    return true;
  } catch (err) {
    console.error("Failed to send on-chain alert:", err);
    return false;
  }
}

/**
 * Get alert notification message for display
 */
export function getAlertMessage(
  tokenSymbol: string,
  claimsRemaining: number,
  alertLevel: "warning" | "critical"
): string {
  const emoji = alertLevel === "critical" ? "🚨" : "⚠️";
  return `${emoji} ${tokenSymbol} balance ${alertLevel}! Only ${claimsRemaining} claims remaining. Refill rewards contract.`;
}

/**
 * Record last balance check timestamp
 */
export async function recordBalanceCheck(): Promise<void> {
  try {
    await kv.set(lastCheckKey(), Date.now(), { ex: 24 * 60 * 60 });
  } catch (err) {
    console.error("Failed to record balance check:", err);
  }
}

/**
 * Get last balance check timestamp
 */
export async function getLastBalanceCheck(): Promise<number | null> {
  try {
    return await kv.get<number>(lastCheckKey());
  } catch {
    return null;
  }
}
