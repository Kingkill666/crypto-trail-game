import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle Farcaster webhook events
    const { event } = body;

    if (event === "frame_added") {
      // User added the mini app
      console.log("Crypto Trail mini app added by user");
    } else if (event === "frame_removed") {
      // User removed the mini app
      console.log("Crypto Trail mini app removed by user");
    } else if (event === "notifications_enabled") {
      console.log("Notifications enabled");
    } else if (event === "notifications_disabled") {
      console.log("Notifications disabled");
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
