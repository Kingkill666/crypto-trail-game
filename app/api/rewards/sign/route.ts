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
    if (token.rewardAmount === BigInt(0)) {
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

    // Apply random multiplier for randomReward tokens (1x-5x)
    let finalRewardAmount = token.rewardAmount;
    let multiplier = 1;
    if (token.randomReward) {
      multiplier = Math.floor(Math.random() * 5) + 1; // Random 1-5
      finalRewardAmount = token.rewardAmount * BigInt(multiplier);
    }

    // Calculate display amount
    const displayAmount = token.randomReward
      ? `$0.0${multiplier} ${token.symbol}`
      : token.displayAmount;

    // Generate unique nonce (replay protection)
    const nonce = keccak256(
      encodePacked(
        ["address", "string", "string", "uint256"],
        [wallet as `0x${string}`, gameSessionId, eventTitle, BigInt(Date.now())]
      )
    );

    // Sign using EIP-712 (matches contract's claimReward function)
    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

    // EIP-712 Domain Separator (must match contract)
    const DOMAIN_SEPARATOR = keccak256(
      encodePacked(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          keccak256(toBytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
          keccak256(toBytes("CryptoTrailRewards")),
          keccak256(toBytes("1")),
          BigInt(CHAIN_ID),
          REWARDS_CONTRACT,
        ]
      )
    );

    // EIP-712 Struct Hash (matches contract's CLAIM_TYPEHASH)
    const CLAIM_TYPEHASH = keccak256(
      toBytes("Claim(address player,string eventTitle,address token,uint256 amount,uint256 nonce)")
    );

    const structHash = keccak256(
      encodePacked(
        ["bytes32", "address", "bytes32", "address", "uint256", "uint256"],
        [
          CLAIM_TYPEHASH,
          wallet as `0x${string}`,
          keccak256(toBytes(eventTitle)),
          token.address,
          finalRewardAmount,
          BigInt(nonce),
        ]
      )
    );

    // Final EIP-712 digest
    const digest = keccak256(
      encodePacked(
        ["string", "bytes32", "bytes32"],
        ["\x19\x01", DOMAIN_SEPARATOR, structHash]
      )
    );

    const signature = await account.signMessage({
      message: { raw: toBytes(digest) },
    });

    // Record in Redis with final amount and display
    await markRewardSigned(wallet, gameSessionId, eventTitle, {
      nonce: nonce,
      token: token.address,
      amount: finalRewardAmount.toString(),
      signature,
      displayAmount,
      symbol: token.symbol,
    });

    return NextResponse.json({
      nonce: nonce,
      token: token.address,
      amount: finalRewardAmount.toString(),
      signature,
      displayAmount,
      symbol: token.symbol,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Reward sign error:", message);
    return NextResponse.json({ error: "Failed to sign reward" }, { status: 500 });
  }
}
