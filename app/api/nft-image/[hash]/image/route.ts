import { NextRequest, NextResponse } from "next/server";
import { getNftImage } from "@/lib/kv";

/**
 * GET /api/nft-image/[hash]/image
 *
 * Serves the actual PNG image bytes for an NFT.
 * This is the URL referenced in the ERC-721 metadata JSON "image" field.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  // Validate hash format (hex, 16 chars)
  if (!/^[a-f0-9]{16}$/.test(hash)) {
    return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
  }

  const base64Data = await getNftImage(hash);

  if (!base64Data) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const buffer = Buffer.from(base64Data, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=86400, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
