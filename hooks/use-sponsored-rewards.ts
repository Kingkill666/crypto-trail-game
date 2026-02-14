"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { SPONSORED_EVENT_TITLES } from "@/lib/sponsored-tokens";

// ── CONSTANTS ──

const REWARDS_CONTRACT = (
  process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS || ""
) as `0x${string}`;

// ── ABI (minimal — only what we call from the frontend) ──

export const CRYPTO_TRAIL_REWARDS_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "claimId", type: "bytes32" },
      { name: "expiry", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "tokens", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "claimIds", type: "bytes32[]" },
      { name: "expiries", type: "uint256[]" },
      { name: "signatures", type: "bytes[]" },
    ],
    name: "batchClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "tokenBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── TYPES ──

export interface PendingReward {
  claimId: string;
  token: string;
  amount: string;
  expiry: number;
  signature: string;
  eventTitle: string;
  displayAmount: string;
  symbol: string;
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
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    }
  }, [writeError, receiptError]);

  // ── SESSION ──

  const initSession = useCallback(async () => {
    if (!address) return;
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
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

  // Record that a sponsored event occurred in this game session
  const recordEvent = useCallback(
    async (eventTitle: string) => {
      if (!address || !sessionIdRef.current) return;
      if (!SPONSORED_EVENT_TITLES.has(eventTitle)) return;
      try {
        await fetch("/api/rewards/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "event",
            wallet: address,
            sessionId: sessionIdRef.current,
            eventTitle,
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
    async (eventTitle: string) => {
      if (!address || !isConnected || !sessionIdRef.current) {
        setErrorMsg("Connect your wallet first");
        setClaimState("error");
        return;
      }
      if (!REWARDS_CONTRACT || REWARDS_CONTRACT.length < 10) {
        setErrorMsg("Rewards contract not configured");
        setClaimState("error");
        return;
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

        setClaimState("claiming");
        writeContract({
          address: REWARDS_CONTRACT,
          abi: CRYPTO_TRAIL_REWARDS_ABI,
          functionName: "claim",
          args: [
            reward.token as `0x${string}`,
            BigInt(reward.amount),
            reward.claimId as `0x${string}`,
            BigInt(reward.expiry),
            reward.signature as `0x${string}`,
          ],
        });
      } catch (err: unknown) {
        setClaimState("error");
        setErrorMsg(
          err instanceof Error
            ? err.message.slice(0, 100)
            : "Claim failed"
        );
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

  const claimAllPending = useCallback(async () => {
    if (!address || !isConnected || pendingRewards.length === 0) return;
    if (!REWARDS_CONTRACT || REWARDS_CONTRACT.length < 10) return;

    setClaimState("claiming");
    setErrorMsg(null);
    resetWrite();

    try {
      const now = Math.floor(Date.now() / 1000);
      const valid = pendingRewards.filter((r) => r.expiry > now);
      if (valid.length === 0) {
        setErrorMsg("Rewards expired");
        setClaimState("error");
        return;
      }

      if (valid.length === 1) {
        const r = valid[0];
        writeContract({
          address: REWARDS_CONTRACT,
          abi: CRYPTO_TRAIL_REWARDS_ABI,
          functionName: "claim",
          args: [
            r.token as `0x${string}`,
            BigInt(r.amount),
            r.claimId as `0x${string}`,
            BigInt(r.expiry),
            r.signature as `0x${string}`,
          ],
        });
      } else {
        writeContract({
          address: REWARDS_CONTRACT,
          abi: CRYPTO_TRAIL_REWARDS_ABI,
          functionName: "batchClaim",
          args: [
            valid.map((r) => r.token as `0x${string}`),
            valid.map((r) => BigInt(r.amount)),
            valid.map((r) => r.claimId as `0x${string}`),
            valid.map((r) => BigInt(r.expiry)),
            valid.map((r) => r.signature as `0x${string}`),
          ],
        });
      }
    } catch (err: unknown) {
      setClaimState("error");
      setErrorMsg(
        err instanceof Error
          ? err.message.slice(0, 100)
          : "Batch claim failed"
      );
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
