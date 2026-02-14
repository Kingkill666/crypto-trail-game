import { NextRequest, NextResponse } from "next/server";
import { grantFreePlay, checkFreePlay, consumeFreePlay } from "@/lib/kv";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

// GET /api/free-play?wallet=0x... — Check if a wallet has free plays
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !wallet.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }

  try {
    const plays = await checkFreePlay(wallet);
    return NextResponse.json({ wallet: wallet.toLowerCase(), freePlays: plays });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Free play check error:", message);
    return NextResponse.json({ error: "Failed to check free plays" }, { status: 500 });
  }
}

// POST /api/free-play — Grant or consume a free play
// Grant: { action: "grant", wallet, reason, secret }
// Consume: { action: "consume", wallet }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, wallet, reason, secret } = body;

    if (!wallet || typeof wallet !== "string" || !wallet.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (action === "grant") {
      // Admin-only: require secret
      if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const result = await grantFreePlay(
        wallet,
        reason || "Admin override — failed transaction",
        "admin"
      );
      return NextResponse.json({
        success: true,
        wallet: wallet.toLowerCase(),
        freePlays: result.plays,
      });
    }

    if (action === "consume") {
      const consumed = await consumeFreePlay(wallet);
      if (!consumed) {
        return NextResponse.json({ error: "No free plays available" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        wallet: wallet.toLowerCase(),
        consumed: true,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Free play error:", message);
    return NextResponse.json({ error: "Failed to process free play" }, { status: 500 });
  }
}
