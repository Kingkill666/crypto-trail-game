import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const IMAGE_DIR = "/tmp/nft-images";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  // Validate hash format (hex, 16 chars)
  if (!/^[a-f0-9]{16}$/.test(hash)) {
    return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
  }

  const filepath = path.join(IMAGE_DIR, `${hash}.png`);

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const buffer = await readFile(filepath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
