import { NextRequest, NextResponse } from "next/server";
import {
  submitGameResult,
  getLeaderboard,
  getTierFromScore,
  needsFarcasterRefresh,
  updateFarcasterProfile,
  type GameEntry,
} from "@/lib/kv";
import { lookupFarcasterByAddress } from "@/lib/neynar";

// GET /api/leaderboard — Fetch top 50
export async function GET() {
  try {
    const rows = await getLeaderboard(50);
    return NextResponse.json(
      { leaderboard: rows },
      { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Leaderboard GET error:", message);
    return NextResponse.json(
      { leaderboard: [], error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}

// POST /api/leaderboard — Submit game result
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, score, classId, survivors, days, miles, survived } = body;

    if (!wallet || typeof wallet !== "string" || !wallet.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const tier = getTierFromScore(score, survived);

    const game: GameEntry = {
      score,
      tier,
      survived: !!survived,
      days: days || 0,
      miles: miles || 0,
      survivors: survivors || 0,
      class: classId || "dev",
      timestamp: Date.now(),
    };

    const stats = await submitGameResult(wallet, game);

    // Fire-and-forget: resolve Farcaster profile if needed
    if (needsFarcasterRefresh(stats)) {
      lookupFarcasterByAddress(wallet)
        .then((profile) => {
          if (profile) return updateFarcasterProfile(wallet, profile);
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      stats: {
        games_played: stats.games_played,
        best_score: stats.best_score,
        best_tier: stats.best_tier,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Leaderboard POST error:", message);
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
  }
}
