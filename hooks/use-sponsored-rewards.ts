"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { SPONSORED_EVENT_TITLES, getSponsoredToken, getRandomizedRewardAmount } from "@/lib/sponsored-tokens";

// ── CONSTANTS ──

const REWARDS_CONTRACT = (
  process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS ||
  "0xBd727931C785FaDcCd2aF6a4Ea70d12C90341B12"
) as `0x${string}`;

// ── ABI (minimal — only what we call from the frontend) ──

export const CRYPTO_TRAIL_REWARDS_ABI = [
  {
    inputs: [
      { name: "eventTitle", type: "string" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "eventTitle", type: "string" },
    ],
    name: "hasPlayerClaimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "eventTitle", type: "string" }],
    name: "eventTokens",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── TYPES ──

export interface PendingReward {
  nonce: string;
  token: string;
  amount: string;
  signature: string;
  eventTitle: string;
  displayAmount: string;
  symbol: string;
}

export interface EarnedReward {
  eventTitle: string;
  symbol: string;
  claimed: boolean;
}

export type ClaimState =
  | "idle"
  | "signing"
  | "claiming"
  | "confirming"
  | "success"
  | "error";

// ── HOOK ──

export function useSponsoredRewards() {
  const { address, isConnected } = useAccount();
  const sessionIdRef = useRef<string | null>(null);
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [earnedRewards, setEarnedRewards] = useState<EarnedReward[]>([]);
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // LAYER 1: Track on-chain claimed events to prevent double claims
  const claimedOnChainRef = useRef<Set<string>>(new Set());

  // Resolve ref to bridge wagmi effects into an awaitable promise
  const claimResolveRef = useRef<((success: boolean) => void) | null>(null);
  // Track which reward we're currently claiming for auto-defer on failure
  const currentClaimEventRef = useRef<string | null>(null);
  const currentSignedRewardRef = useRef<PendingReward | null>(null);

  const {
    writeContract,
    data: txHash,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Track confirmation state
  useEffect(() => {
    if (isConfirming && claimState === "claiming") setClaimState("confirming");
  }, [isConfirming, claimState]);

  useEffect(() => {
    if (
      isConfirmed &&
      (claimState === "confirming" || claimState === "claiming")
    ) {
      setClaimState("success");
      // LAYER 1: Mark as claimed on-chain
      if (currentClaimEventRef.current) {
        claimedOnChainRef.current.add(currentClaimEventRef.current);
      }
      if (claimResolveRef.current) {
        claimResolveRef.current(true);
        claimResolveRef.current = null;
      }
      currentClaimEventRef.current = null;
      currentSignedRewardRef.current = null;
    }
  }, [isConfirmed, claimState]);

  useEffect(() => {
    if (writeError || receiptError) {
      const err = writeError || receiptError;
      setClaimState("error");
      setErrorMsg(
        err?.message?.includes("User rejected")
          ? "Transaction rejected"
          : err?.message?.includes("AlreadyClaimed")
            ? "Already claimed"
            : err?.message?.includes("InsufficientBalance")
              ? "Reward pool empty — try again later"
              : err?.message?.slice(0, 100) || "Claim failed"
      );

      // LAYER 2: Auto-defer to pendingRewards if we have a signed reward and it failed
      if (currentSignedRewardRef.current && currentClaimEventRef.current) {
        const failedReward = currentSignedRewardRef.current;
        const failedEvent = currentClaimEventRef.current;
        // Only auto-defer if not already in pending
        setPendingRewards((prev) => {
          const exists = prev.some((r) => r.eventTitle === failedEvent);
          if (exists) return prev;
          return [...prev, failedReward];
        });
      }

      if (claimResolveRef.current) {
        claimResolveRef.current(false);
        claimResolveRef.current = null;
      }
      currentClaimEventRef.current = null;
      currentSignedRewardRef.current = null;
    }
  }, [writeError, receiptError]);

  // ── SESSION ──

  const initSession = useCallback(async () => {
    if (!address) return;
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    setEarnedRewards([]); // Reset for new game
    claimedOnChainRef.current.clear(); // Reset claim tracker
    try {
      await fetch("/api/rewards/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", wallet: address, sessionId }),
      });
    } catch {
      // Non-critical: game still works without rewards
    }
    return sessionId;
  }, [address]);

  // LAYER 3: Record that a sponsored event occurred in this game session
  const recordEvent = useCallback(
    async (eventTitle: string) => {
      if (!address || !sessionIdRef.current) return;
      if (!SPONSORED_EVENT_TITLES.has(eventTitle)) return;

      // Get randomized reward amount
      const token = getSponsoredToken(eventTitle);
      const amount = token ? getRandomizedRewardAmount(token) : undefined;

      // Add to earnedRewards immediately (LAYER 3: always show on end screen)
      if (token) {
        setEarnedRewards((prev) => [
          ...prev,
          {
            eventTitle,
            symbol: token.symbol,
            claimed: false,
          },
        ]);
      }

      try {
        await fetch("/api/rewards/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "event",
            wallet: address,
            sessionId: sessionIdRef.current,
            eventTitle,
            amount: amount?.toString(),
          }),
        });
      } catch {
        // Non-critical
      }
    },
    [address]
  );

  // ── CLAIM NOW ──

  const claimReward = useCallback(
    async (eventTitle: string): Promise<boolean> => {
      if (!address || !isConnected || !sessionIdRef.current) {
        setErrorMsg("Connect your wallet first");
        setClaimState("error");
        return false;
      }
      if (!REWARDS_CONTRACT || REWARDS_CONTRACT.length < 10) {
        setErrorMsg("Rewards contract not configured");
        setClaimState("error");
        return false;
      }

      // LAYER 1: Check if already claimed on-chain
      if (claimedOnChainRef.current.has(eventTitle)) {
        setErrorMsg("Already claimed");
        setClaimState("error");
        return false;
      }

      setClaimState("signing");
      setErrorMsg(null);
      resetWrite();

      try {
        const res = await fetch("/api/rewards/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: address,
            eventTitle,
            gameSessionId: sessionIdRef.current,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get signature");
        }

        const reward: PendingReward = {
          ...(await res.json()),
          eventTitle,
        };

        // Store for auto-defer on failure (LAYER 2)
        currentClaimEventRef.current = eventTitle;
        currentSignedRewardRef.current = reward;

        setClaimState("claiming");

        // Create a promise that resolves when the tx confirms or fails
        const result = await new Promise<boolean>((resolve) => {
          claimResolveRef.current = resolve;
          writeContract({
            address: REWARDS_CONTRACT,
            abi: CRYPTO_TRAIL_REWARDS_ABI,
            functionName: "claimReward",
            args: [
              eventTitle,
              reward.token as `0x${string}`,
              BigInt(reward.amount),
              BigInt(reward.nonce),
              reward.signature as `0x${string}`,
            ],
          });
        });

        // Mark as claimed in earnedRewards if successful (LAYER 3)
        if (result) {
          setEarnedRewards((prev) =>
            prev.map((r) =>
              r.eventTitle === eventTitle ? { ...r, claimed: true } : r
            )
          );
        }

        return result;
      } catch (err: unknown) {
        setClaimState("error");
        setErrorMsg(
          err instanceof Error
            ? err.message.slice(0, 100)
            : "Claim failed"
        );
        return false;
      }
    },
    [address, isConnected, writeContract, resetWrite]
  );

  // ── DEFER (get signature now, claim later) ──

  const deferReward = useCallback(
    async (eventTitle: string) => {
      if (!address || !sessionIdRef.current) return;

      try {
        const res = await fetch("/api/rewards/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: address,
            eventTitle,
            gameSessionId: sessionIdRef.current,
          }),
        });
        if (!res.ok) return;
        const reward = await res.json();
        setPendingRewards((prev) => [...prev, { ...reward, eventTitle }]);
      } catch {
        // Non-critical
      }
    },
    [address]
  );

  // ── BATCH CLAIM ALL PENDING ──

  const claimAllPending = useCallback(async (): Promise<boolean> => {
    if (!address || !isConnected || pendingRewards.length === 0) return false;
    if (!REWARDS_CONTRACT || REWARDS_CONTRACT.length < 10) return false;

    setClaimState("claiming");
    setErrorMsg(null);
    resetWrite();

    try {
      // LAYER 1: Filter out already-claimed rewards
      const valid = pendingRewards.filter(
        (r) => !claimedOnChainRef.current.has(r.eventTitle)
      );
      if (valid.length === 0) {
        setErrorMsg("No valid rewards to claim");
        setClaimState("error");
        return false;
      }

      // Claim first pending reward
      const r = valid[0];
      currentClaimEventRef.current = r.eventTitle;
      currentSignedRewardRef.current = r;

      const result = await new Promise<boolean>((resolve) => {
        claimResolveRef.current = resolve;

        writeContract({
          address: REWARDS_CONTRACT,
          abi: CRYPTO_TRAIL_REWARDS_ABI,
          functionName: "claimReward",
          args: [
            r.eventTitle,
            r.token as `0x${string}`,
            BigInt(r.amount),
            BigInt(r.nonce),
            r.signature as `0x${string}`,
          ],
        });
      });

      if (result) {
        // LAYER 1: Mark as claimed on-chain
        claimedOnChainRef.current.add(r.eventTitle);

        // Remove from pending
        setPendingRewards((prev) => prev.filter((p) => p.eventTitle !== r.eventTitle));

        // LAYER 3: Mark as claimed in earnedRewards
        setEarnedRewards((prev) =>
          prev.map((reward) =>
            reward.eventTitle === r.eventTitle
              ? { ...reward, claimed: true }
              : reward
          )
        );
      }
      return result;
    } catch (err: unknown) {
      setClaimState("error");
      setErrorMsg(
        err instanceof Error
          ? err.message.slice(0, 100)
          : "Claim failed"
      );
      return false;
    }
  }, [address, isConnected, pendingRewards, writeContract, resetWrite]);

  // ── HELPERS ──

  const reset = useCallback(() => {
    setClaimState("idle");
    setErrorMsg(null);
    resetWrite();
  }, [resetWrite]);

  const isSponsoredEvent = useCallback((eventTitle: string) => {
    return SPONSORED_EVENT_TITLES.has(eventTitle);
  }, []);

  return {
    // Session
    initSession,
    recordEvent,
    sessionId: sessionIdRef.current,
    // Claims
    claimReward,
    deferReward,
    claimAllPending,
    pendingRewards,
    earnedRewards,
    // State
    claimState,
    errorMsg,
    txHash,
    reset,
    // Helpers
    isSponsoredEvent,
    rewardsContractConfigured:
      !!REWARDS_CONTRACT && REWARDS_CONTRACT.length >= 10,
  };
}
