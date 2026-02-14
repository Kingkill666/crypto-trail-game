import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { storeNftImage } from "@/lib/kv";

const IMAGE_DIR = "/tmp/nft-images";

/**
 * POST /api/nft-migrate
 *
 * One-time migration: copies any NFT images from ephemeral /tmp into KV.
 * Protected by ADMIN_SECRET. Run once after deploy, then remove this route.
 *
 * curl -X POST https://crypto-trail-game.vercel.app/api/nft-migrate \
 *   -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 */
export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  const secret = process.env.ADMIN_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!existsSync(IMAGE_DIR)) {
    return NextResponse.json({ message: "No /tmp/nft-images directory found", migrated: 0 });
  }

  const origin = req.headers.get("origin") || req.nextUrl.origin;

  try {
    const files = await readdir(IMAGE_DIR);
    const pngFiles = files.filter((f) => f.endsWith(".png"));
    let migrated = 0;

    for (const filename of pngFiles) {
      const hash = filename.replace(".png", "");
      if (!/^[a-f0-9]{16}$/.test(hash)) continue;

      const filepath = path.join(IMAGE_DIR, filename);
      const buffer = await readFile(filepath);
      const base64Data = buffer.toString("base64");

      // Store with minimal fallback metadata (we don't know the game data for legacy mints)
      await storeNftImage(hash, base64Data, {
        name: "Crypto Trail NFT",
        description: "A Crypto Trail game NFT minted on Base.",
        external_url: "https://crypto-trail-game.vercel.app",
        attributes: [],
      }, origin);

      migrated++;
    }

    return NextResponse.json({
      message: `Migrated ${migrated} images from /tmp to KV`,
      migrated,
      total: pngFiles.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Migration failed" },
      { status: 500 }
    );
  }
}
