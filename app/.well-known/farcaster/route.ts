import { NextResponse } from "next/server";

// TODO: Replace with your actual domain once deployed
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://crypto-trail-game.vercel.app";

export async function GET() {
  return NextResponse.json({
    // TODO: Replace with your actual Farcaster account association
    // Generate this at https://warpcast.com/~/developers/mini-apps
    accountAssociation: {
      header: "eyJmaWQiOjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIn0",
      payload: "eyJkb21haW4iOiJjcnlwdG8tdHJhaWwtZ2FtZS52ZXJjZWwuYXBwIn0",
      signature: "REPLACE_WITH_YOUR_SIGNATURE",
    },
    frame: {
      version: "1",
      name: "Crypto Trail",
      iconUrl: `${DOMAIN}/images/crypto_trail_splash.png`,
      homeUrl: DOMAIN,
      splashImageUrl: `${DOMAIN}/images/crypto_trail_splash.png`,
      splashBackgroundColor: "#0a0a0f",
      subtitle: "Degen Oregon Trail",
      description: "Survive the crypto frontier in this 8-bit Oregon Trail-inspired adventure. Trade, bridge, and HODL your way to Mainnet!",
      primaryCategory: "games",
      tags: ["crypto", "game", "oregontrail", "8bit", "defi"],
    },
  });
}
