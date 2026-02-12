"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";

// ── CONSTANTS ──
const OWNER_WALLET = (process.env.NEXT_PUBLIC_OWNER_WALLET || "0x15E916FbAF9762F1344e0544ecdadA62d2Face15") as `0x${string}`;
const ENTRY_FEE_USD = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE_USD || "1.00");
const NFT_CONTRACT = (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "") as `0x${string}`;
const PAYMENT_CONTRACT = (process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS || "") as `0x${string}`;

// ── CryptoTrailPayment ABI (minimal — only payEntry) ──
export const CRYPTO_TRAIL_PAYMENT_ABI = [
  {
    inputs: [],
    name: "payEntry",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

// ── CryptoTrailNFT ABI (minimal — only what we call from the frontend) ──
export const CRYPTO_TRAIL_NFT_ABI = [
  {
    inputs: [
      { name: "score", type: "uint256" },
      { name: "classId", type: "uint8" },
      { name: "survivors", type: "uint8" },
      { name: "daysPlayed", type: "uint16" },
      { name: "tokenURI", type: "string" },
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "mintPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── ETH PRICE HOOK ──
// Fetches ETH/USD price from CoinGecko's free API (no key needed)
// Falls back to a conservative estimate if the API is down
export function useEthPrice() {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrice() {
      try {
        // CoinGecko free API — no API key required
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
          { next: { revalidate: 60 } } // cache for 60s
        );
        if (!res.ok) throw new Error("Price fetch failed");
        const data = await res.json();
        if (!cancelled && data?.ethereum?.usd) {
          setEthPrice(data.ethereum.usd);
        }
      } catch {
        // Fallback: try Coinbase API
        try {
          const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=ETH");
          if (!res.ok) throw new Error("Coinbase fetch failed");
          const data = await res.json();
          if (!cancelled && data?.data?.rates?.USD) {
            setEthPrice(parseFloat(data.data.rates.USD));
          }
        } catch {
          // Last resort fallback — use a conservative price
          if (!cancelled) setEthPrice(2500);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPrice();
    // Refresh price every 2 minutes
    const interval = setInterval(fetchPrice, 120_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Calculate ETH amount for the entry fee
  const entryFeeEth = ethPrice ? ENTRY_FEE_USD / ethPrice : null;
  // Add 2% buffer for price slippage
  const entryFeeEthWithBuffer = entryFeeEth ? entryFeeEth * 1.02 : null;

  return {
    ethPrice,
    entryFeeUsd: ENTRY_FEE_USD,
    entryFeeEth,
    entryFeeEthWithBuffer,
    loading,
  };
}

// ── GAME ENTRY PAYMENT HOOK ──
// Uses writeContract → payEntry() on the payment contract (not a raw ETH transfer)
// so wallet transaction scanners don't flag it as "untrusted address"
export function useGamePayment() {
  const { address, isConnected } = useAccount();
  const { ethPrice, entryFeeUsd, entryFeeEth, entryFeeEthWithBuffer, loading: priceLoading } = useEthPrice();

  const [paymentState, setPaymentState] = useState<
    "idle" | "connecting" | "paying" | "confirming" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use writeContract for contract interaction (avoids "untrusted address" warning)
  const {
    writeContract,
    data: txHash,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Fallback: raw sendTransaction if no payment contract is configured
  const {
    sendTransaction,
    data: fallbackTxHash,
    error: sendError,
    reset: resetSend,
  } = useSendTransaction();

  const activeTxHash = txHash || fallbackTxHash;
  const activeError = writeError || sendError;

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: activeTxHash });

  // Update state based on tx confirmation
  useEffect(() => {
    if (isConfirming && paymentState === "paying") {
      setPaymentState("confirming");
    }
  }, [isConfirming, paymentState]);

  useEffect(() => {
    if (isConfirmed && (paymentState === "confirming" || paymentState === "paying")) {
      setPaymentState("success");
    }
  }, [isConfirmed, paymentState]);

  useEffect(() => {
    if (activeError || receiptError) {
      const err = activeError || receiptError;
      setPaymentState("error");
      setErrorMsg(err?.message?.includes("User rejected")
        ? "Transaction rejected"
        : err?.message?.slice(0, 100) || "Transaction failed"
      );
    }
  }, [activeError, receiptError]);

  const pay = useCallback(async () => {
    if (!isConnected || !address) {
      setPaymentState("error");
      setErrorMsg("Connect your wallet first");
      return;
    }

    if (!entryFeeEthWithBuffer) {
      setPaymentState("error");
      setErrorMsg("Unable to fetch ETH price");
      return;
    }

    setPaymentState("paying");
    setErrorMsg(null);
    resetWrite();
    resetSend();

    try {
      // Convert to wei — use 18 decimal precision
      const weiAmount = parseEther(entryFeeEthWithBuffer.toFixed(18));

      if (PAYMENT_CONTRACT && PAYMENT_CONTRACT.length >= 10) {
        // Preferred: call payEntry() on the payment contract
        // This is a contract interaction, not a raw ETH transfer,
        // so Blockaid/wallet scanners won't show "untrusted address" warnings
        writeContract({
          address: PAYMENT_CONTRACT,
          abi: CRYPTO_TRAIL_PAYMENT_ABI,
          functionName: "payEntry",
          value: weiAmount,
        });
      } else {
        // Fallback: direct ETH transfer (will show "untrusted address" warning)
        sendTransaction({
          to: OWNER_WALLET,
          value: weiAmount,
        });
      }
    } catch (err: any) {
      setPaymentState("error");
      setErrorMsg(err?.message?.slice(0, 100) || "Payment failed");
    }
  }, [isConnected, address, entryFeeEthWithBuffer, writeContract, sendTransaction, resetWrite, resetSend]);

  const reset = useCallback(() => {
    setPaymentState("idle");
    setErrorMsg(null);
    resetWrite();
    resetSend();
  }, [resetWrite, resetSend]);

  return {
    address,
    isConnected,
    ethPrice,
    entryFeeUsd,
    entryFeeEth,
    entryFeeEthWithBuffer,
    priceLoading,
    paymentState,
    errorMsg,
    txHash: activeTxHash,
    pay,
    reset,
  };
}

// ── NFT MINT HOOK ──
export function useNftMint() {
  const { address, isConnected } = useAccount();

  const [mintState, setMintState] = useState<
    "idle" | "minting" | "confirming" | "success" | "error"
  >("idle");
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

  useEffect(() => {
    if (isConfirming && mintState === "minting") {
      setMintState("confirming");
    }
  }, [isConfirming, mintState]);

  useEffect(() => {
    if (isConfirmed && (mintState === "confirming" || mintState === "minting")) {
      setMintState("success");
    }
  }, [isConfirmed, mintState]);

  useEffect(() => {
    if (writeError || receiptError) {
      const err = writeError || receiptError;
      setMintState("error");
      setErrorMsg(
        err?.message?.includes("User rejected")
          ? "Transaction rejected"
          : err?.message?.includes("insufficient")
            ? "Insufficient funds for gas"
            : err?.message?.slice(0, 100) || "Mint failed"
      );
    }
  }, [writeError, receiptError]);

  const mint = useCallback(
    async (gameData: {
      score: number;
      classId: string;
      survivors: number;
      days: number;
      tokenURI: string;
    }) => {
      if (!isConnected || !address) {
        setMintState("error");
        setErrorMsg("Connect your wallet first");
        return;
      }

      if (!NFT_CONTRACT || NFT_CONTRACT.length < 10) {
        setMintState("error");
        setErrorMsg("NFT contract not configured");
        return;
      }

      setMintState("minting");
      setErrorMsg(null);
      resetWrite();

      const classIdMap: Record<string, number> = {
        dev: 0,
        trader: 1,
        influencer: 2,
        vc: 3,
      };

      try {
        writeContract({
          address: NFT_CONTRACT,
          abi: CRYPTO_TRAIL_NFT_ABI,
          functionName: "mint",
          args: [
            BigInt(gameData.score),
            classIdMap[gameData.classId] ?? 0,
            gameData.survivors,
            gameData.days,
            gameData.tokenURI,
          ],
          // Mint is free (gas only) — lowest possible gas on Base
          value: 0n,
        });
      } catch (err: any) {
        setMintState("error");
        setErrorMsg(err?.message?.slice(0, 100) || "Mint failed");
      }
    },
    [isConnected, address, writeContract, resetWrite]
  );

  const reset = useCallback(() => {
    setMintState("idle");
    setErrorMsg(null);
    resetWrite();
  }, [resetWrite]);

  return {
    address,
    isConnected,
    mintState,
    errorMsg,
    txHash,
    mint,
    reset,
    nftContractConfigured: !!NFT_CONTRACT && NFT_CONTRACT.length >= 10,
  };
}
