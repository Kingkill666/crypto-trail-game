import { NextRequest, NextResponse } from "next/server";

// Vercel Cron Job endpoint
// Configure in vercel.json to run every 6 hours
// This will automatically check token balances and send alerts

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(req: NextRequest) {
  // Verify this is coming from Vercel Cron (checks Authorization header)
  const authHeader = req.headers.get("authorization");

  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  // We'll use ADMIN_SECRET for simplicity
  if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call the admin token balance endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crypto-trail-game.vercel.app";
    const url = new URL("/api/admin/token-balances", baseUrl);
    url.searchParams.set("secret", ADMIN_SECRET || "");
    url.searchParams.set("checkOnly", "false");

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!data.success) {
      throw new Error("Balance check failed");
    }

    console.log("[CRON] Token balance check completed", {
      summary: data.summary,
      alerts: data.alerts,
    });

    return NextResponse.json({
      success: true,
      message: "Balance check completed",
      summary: data.summary,
      alertsSent: data.alerts?.length || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[CRON] Balance check failed:", message);
    return NextResponse.json(
      { error: "Balance check failed", details: message },
      { status: 500 }
    );
  }
}
