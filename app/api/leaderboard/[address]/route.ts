import { NextRequest, NextResponse } from "next/server";
import {
  getPlayerProfile,
  needsFarcasterRefresh,
  updateFarcasterProfile,
} from "@/lib/kv";
import { lookupFarcasterByAddress } from "@/lib/neynar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address || !address.startsWith("0x") || address.length < 10) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const profile = await getPlayerProfile(address);

    if (!profile) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Refresh stale Farcaster data inline (this endpoint is user-triggered)
    if (profile.stats && needsFarcasterRefresh(profile.stats)) {
      const fcProfile = await lookupFarcasterByAddress(address);
      if (fcProfile) {
        await updateFarcasterProfile(address, fcProfile);
        profile.stats.fc_fid = fcProfile.fid;
        profile.stats.fc_username = fcProfile.username;
        profile.stats.fc_display_name = fcProfile.displayName;
        profile.stats.fc_pfp = fcProfile.pfp;
      }
    }

    return NextResponse.json(
      { stats: profile.stats, games: profile.games, rank: profile.rank },
      { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=15" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Player profile error:", message);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
