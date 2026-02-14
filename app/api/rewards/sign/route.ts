import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { keccak256, encodePacked, toBytes } from "viem";
import {
  validateGameSession,
  markRewardSigned,
  hasRewardBeenSigned,
} from "@/lib/kv-rewards";
import { getSponsoredToken } from "@/lib/sponsored-tokens";

const SIGNER_PRIVATE_KEY = process.env.REWARDS_SIGNER_PRIVATE_KEY as `0x${string}` | undefined;
const REWARDS_CONTRACT = process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS as `0x${string}` | undefined;
const CHAIN_ID = 8453; // Base mainnet
const SIGNATURE_TTL = 3600; // 1 hour

// POST /api/rewards/sign — Validate session + sign a claim authorization
// Body: { wallet, eventTitle, gameSessionId }
export async function POST(req: NextRequest) {
  try {
    if (!SIGNER_PRIVATE_KEY || !REWARDS_CONTRACT) {
      return NextResponse.json({ error: "Rewards not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { wallet, eventTitle, gameSessionId } = body;

    if (!wallet || !eventTitle || !gameSessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Look up the sponsored token for this event
    const token = getSponsoredToken(eventTitle);
    if (!token) {
      return NextResponse.json({ error: "Not a sponsored event" }, { status: 400 });
    }

    // Check reward amount is configured (non-zero)
    if (token.rewardAmount === 0n) {
      return NextResponse.json({ error: "Reward amount not configured" }, { status: 503 });
    }

    // Validate game session exists and this event occurred
    const sessionValid = await validateGameSession(wallet, gameSessionId, eventTitle);
    if (!sessionValid) {
      return NextResponse.json({ error: "Invalid session or event" }, { status: 403 });
    }

    // Prevent double-signing
    const alreadySigned = await hasRewardBeenSigned(wallet, gameSessionId, eventTitle);
    if (alreadySigned) {
      return NextResponse.json({ error: "Already signed" }, { status: 409 });
    }

    // Generate unique claimId
    const claimId = keccak256(
      encodePacked(
        ["address", "string", "string", "uint256"],
        [wallet as `0x${string}`, gameSessionId, eventTitle, BigInt(Date.now())]
      )
    );

    // Compute expiry
    const expiry = BigInt(Math.floor(Date.now() / 1000) + SIGNATURE_TTL);

    // Sign the message (must match contract's _verifyClaim)
    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);
    const messageHash = keccak256(
      encodePacked(
        ["address", "address", "uint256", "bytes32", "uint256", "uint256", "address"],
        [
          wallet as `0x${string}`,
          token.address,
          token.rewardAmount,
          claimId as `0x${string}`,
          expiry,
          BigInt(CHAIN_ID),
          REWARDS_CONTRACT,
        ]
      )
    );
    const signature = await account.signMessage({
      message: { raw: toBytes(messageHash) },
    });

    // Record in Redis
    await markRewardSigned(wallet, gameSessionId, eventTitle, {
      claimId,
      token: token.address,
      amount: token.rewardAmount.toString(),
      expiry: Number(expiry),
      signature,
      displayAmount: token.displayAmount,
      symbol: token.symbol,
    });

    return NextResponse.json({
      claimId,
      token: token.address,
      amount: token.rewardAmount.toString(),
      expiry: Number(expiry),
      signature,
      displayAmount: token.displayAmount,
      symbol: token.symbol,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Reward sign error:", message);
    return NextResponse.json({ error: "Failed to sign reward" }, { status: 500 });
  }
}
