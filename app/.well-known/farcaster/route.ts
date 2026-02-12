import { NextResponse } from "next/server";

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://crypto-trail-game.vercel.app";

export async function GET() {
  return NextResponse.json({
    // Generate your real account association at https://warpcast.com/~/developers/mini-apps
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
      imageUrl: `${DOMAIN}/images/crypto_trail_splash.png`,
      buttonTitle: "Play Crypto Trail",
      splashImageUrl: `${DOMAIN}/images/crypto_trail_splash.png`,
      splashBackgroundColor: "#0a0a0f",
      subtitle: "Survive the Crypto Frontier",
      description: "Lead your party of 4 degens on a 900-mile journey from Genesis Block to Mainnet. Trade memecoins, cross sketchy bridges, dodge rug pulls, and fight off rogue AI agents in this 8-bit Oregon Trail-inspired survival game. Earn ETH rewards, mint commemorative NFTs, and compete for the leaderboard. Will you reach Mainnet or get REKT?",
      primaryCategory: "games",
      tags: ["crypto", "game", "oregontrail", "8bit", "defi", "nft", "trading", "survival", "pixel-art", "base"],
      tagline: "Trade, Bridge & HODL Your Way to Mainnet",
      ogTitle: "Crypto Trail - 8-Bit Degen Edition",
      ogDescription: "A degen Oregon Trail for Farcaster. Survive rug pulls, rogue AI agents, and bridge exploits on your 900-mile journey to Mainnet. Play free, earn NFTs.",
      ogImageUrl: `${DOMAIN}/images/crypto_trail_splash.png`,
      heroImageUrl: `${DOMAIN}/images/crypto_trail_splash.png`,
      webhookUrl: `${DOMAIN}/api/webhook`,
    },
  });
}
