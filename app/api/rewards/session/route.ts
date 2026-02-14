import { NextRequest, NextResponse } from "next/server";
import { createGameSession, recordSessionEvent } from "@/lib/kv-rewards";

// POST /api/rewards/session — Create game session or record a sponsored event
// Create: { action: "create", wallet, sessionId }
// Event:  { action: "event", wallet, sessionId, eventTitle }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, wallet, sessionId, eventTitle } = body;

    if (!wallet || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (action === "create") {
      await createGameSession(wallet, sessionId);
      return NextResponse.json({ success: true, sessionId });
    }

    if (action === "event") {
      if (!eventTitle) {
        return NextResponse.json({ error: "Missing eventTitle" }, { status: 400 });
      }
      await recordSessionEvent(wallet, sessionId, eventTitle);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Rewards session error:", message);
    return NextResponse.json({ error: "Failed to process session" }, { status: 500 });
  }
}
