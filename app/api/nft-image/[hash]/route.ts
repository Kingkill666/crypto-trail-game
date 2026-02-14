import { NextRequest, NextResponse } from "next/server";
import { getNftMetadata, getNftImage } from "@/lib/kv";

/**
 * GET /api/nft-image/[hash]
 *
 * Returns ERC-721 metadata JSON for the given NFT hash.
 * This is the URL stored as the tokenURI on-chain.
 *
 * Wallets and NFT indexers expect:
 * {
 *   "name": "Crypto Trail Victory",
 *   "description": "...",
 *   "image": "https://crypto-trail-game.vercel.app/api/nft-image/<hash>/image",
 *   "attributes": [...]
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  // Validate hash format (hex, 16 chars)
  if (!/^[a-f0-9]{16}$/.test(hash)) {
    return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
  }

  // Try to get metadata from KV first
  const metadata = await getNftMetadata(hash);

  if (metadata) {
    return NextResponse.json(metadata, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Fallback: if metadata doesn't exist but image does (legacy upload before
  // we added metadata), build minimal metadata on the fly
  const imageData = await getNftImage(hash);
  if (imageData) {
    const origin = req.nextUrl.origin;
    const fallbackMetadata = {
      name: "Crypto Trail NFT",
      description: "A Crypto Trail game NFT minted on Base.",
      image: `${origin}/api/nft-image/${hash}/image`,
      external_url: "https://crypto-trail-game.vercel.app",
      attributes: [],
    };
    return NextResponse.json(fallbackMetadata, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return NextResponse.json({ error: "NFT not found" }, { status: 404 });
}
