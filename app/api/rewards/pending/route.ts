import { NextRequest, NextResponse } from "next/server";
import { getPendingRewards } from "@/lib/kv-rewards";

// GET /api/rewards/pending?wallet=0x...&sessionId=...
// Returns all signed but unclaimed rewards for a game session
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!wallet || !sessionId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const rewards = await getPendingRewards(wallet, sessionId);
    return NextResponse.json({ rewards });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Pending rewards error:", message);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}
