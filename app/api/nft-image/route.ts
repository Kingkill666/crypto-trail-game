import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { storeNftImage } from "@/lib/kv";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, metadata } = body;

    if (
      !image ||
      typeof image !== "string" ||
      !image.startsWith("data:image/png;base64,")
    ) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Extract base64 data and create a hash-based filename
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const hash = crypto
      .createHash("sha256")
      .update(base64Data)
      .digest("hex")
      .slice(0, 16);

    const origin = req.headers.get("origin") || req.nextUrl.origin;

    // Build metadata from what the client sends
    const nftType: string = metadata?.type || "victory"; // "victory" | "death"
    const score: number = metadata?.score ?? 0;
    const classId: string = metadata?.classId || "dev";
    const survivors: number = metadata?.survivors ?? 0;
    const days: number = metadata?.days ?? 0;
    const miles: number = metadata?.miles ?? 0;

    const classNames: Record<string, string> = {
      dev: "Developer",
      trader: "Trader",
      influencer: "Influencer",
      vc: "VC",
    };

    const isVictory = nftType === "victory";
    const name = isVictory
      ? `Crypto Trail Victory`
      : `Crypto Trail Death`;
    const description = isVictory
      ? `A ${classNames[classId] || classId} survived the Crypto Trail and reached Mainnet! Score: ${score.toLocaleString()}. ${survivors}/4 party members survived in ${days} days.`
      : `A ${classNames[classId] || classId} perished on the Crypto Trail after ${days} days and ${miles} miles. Score: ${score.toLocaleString()}. Rest in protocol.`;

    const attributes = [
      { trait_type: "Type", value: isVictory ? "Victory" : "Death" },
      { trait_type: "Class", value: classNames[classId] || classId },
      { trait_type: "Score", value: score, display_type: "number" as const },
      { trait_type: "Days", value: days, display_type: "number" as const },
      ...(isVictory
        ? [{ trait_type: "Survivors", value: `${survivors}/4` }]
        : [{ trait_type: "Miles", value: miles, display_type: "number" as const }]),
    ];

    // Determine rarity from score
    let rarity = "Common";
    if (score >= 6000) rarity = "Legendary";
    else if (score >= 4000) rarity = "Epic";
    else if (score >= 2000) rarity = "Rare";
    attributes.push({ trait_type: "Rarity", value: rarity });

    // Store in KV (persistent across Vercel cold starts)
    const { metadataUrl, imageUrl } = await storeNftImage(hash, base64Data, {
      name,
      description,
      external_url: "https://crypto-trail-game.vercel.app",
      attributes,
    }, origin);

    // Return both URLs:
    // - url: metadata JSON URL (used as tokenURI on-chain)
    // - imageUrl: direct PNG URL (used for cast embeds, sharing)
    return NextResponse.json({ url: metadataUrl, imageUrl, hash });
  } catch (err: any) {
    console.error("NFT image upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
