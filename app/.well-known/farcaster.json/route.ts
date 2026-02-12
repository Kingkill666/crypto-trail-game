import { NextResponse } from "next/server";

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://crypto-trail-game.vercel.app";

export async function GET() {
  return NextResponse.json({
    // Generate your account association at https://www.base.dev/preview?tab=account
    accountAssociation: {
      header: "eyJmaWQiOjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIn0",
      payload: "eyJkb21haW4iOiJjcnlwdG8tdHJhaWwtZ2FtZS52ZXJjZWwuYXBwIn0",
      signature: "REPLACE_WITH_YOUR_SIGNATURE",
    },
    miniapp: {
      version: "1",
      name: "Crypto Trail",
      iconUrl: "https://i.postimg.cc/Y2d3rm4D/Crypto-Trail-share-URL.png",
      homeUrl: DOMAIN,
      splashImageUrl: `${DOMAIN}/images/CryptoTrail-Splash.png`,
      splashBackgroundColor: "#0a0a0f",
      webhookUrl: `${DOMAIN}/api/webhook`,
      subtitle: "Survive the Crypto Frontier",
      description: "Lead your party of 4 degens on a 900-mile journey from Genesis Block to Mainnet. Trade memecoins, cross sketchy bridges, dodge rug pulls, and fight off rogue AI agents in this 8-bit Oregon Trail-inspired survival game. Earn ETH rewards, mint commemorative NFTs, and compete for the leaderboard. Will you reach Mainnet or get REKT?",
      screenshotUrls: [],
      primaryCategory: "games",
      tags: ["crypto", "game", "oregontrail", "8bit", "defi", "nft", "trading", "survival", "pixel-art", "base"],
      heroImageUrl: "https://i.postimg.cc/Y2d3rm4D/Crypto-Trail-share-URL.png",
      tagline: "Trade, Bridge & HODL Your Way to Mainnet",
      ogTitle: "Crypto Trail - 8-Bit Degen Edition",
      ogDescription: "A degen Oregon Trail for Farcaster. Survive rug pulls, rogue AI agents, and bridge exploits on your 900-mile journey to Mainnet. Play free, earn NFTs.",
      ogImageUrl: "https://i.postimg.cc/Y2d3rm4D/Crypto-Trail-share-URL.png",
    },
  });
}
