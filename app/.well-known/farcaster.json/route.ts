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
      iconUrl: "https://i.postimg.cc/K81LSBYB/Crypto_Trail_Start.jpg",
      homeUrl: DOMAIN,
      imageUrl: "https://i.postimg.cc/K81LSBYB/Crypto_Trail_Start.jpg",
      buttonTitle: "Go For It!",
      splashImageUrl: "https://i.postimg.cc/JzK1q28q/hero-200-copy.jpg",
      splashBackgroundColor: "#0a0a0f",
      webhookUrl: `${DOMAIN}/api/webhook`,
      subtitle: "Survive the Crypto Frontier",
      description: "Lead 4 degens from Genesis Block to Mainnet. Trade memecoins, cross sketchy bridges, dodge rug pulls, and fight rogue AI agents in this 8-bit survival game.",
      screenshotUrls: [],
      primaryCategory: "games",
      tags: ["crypto", "oregontrail", "8bit", "survival", "base"],
      heroImageUrl: "https://i.postimg.cc/K81LSBYB/Crypto_Trail_Start.jpg",
      tagline: "HODL Your Way to Mainnet",
      ogTitle: "Crypto Trail - Degen Edition",
      ogDescription: "A degen Oregon Trail for Farcaster. Dodge rug pulls and bridge exploits on your way to Mainnet.",
      ogImageUrl: "https://i.postimg.cc/K81LSBYB/Crypto_Trail_Start.jpg",
      castShareUrl: DOMAIN,
    },
  });
}
