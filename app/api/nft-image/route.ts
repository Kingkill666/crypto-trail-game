import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

// Store images in /tmp (writable on Vercel serverless)
const IMAGE_DIR = "/tmp/nft-images";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string" || !image.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Extract base64 data and create a hash-based filename
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const hash = crypto.createHash("sha256").update(base64Data).digest("hex").slice(0, 16);
    const filename = `${hash}.png`;

    // Ensure directory exists
    if (!existsSync(IMAGE_DIR)) {
      await mkdir(IMAGE_DIR, { recursive: true });
    }

    // Write PNG file
    const filepath = path.join(IMAGE_DIR, filename);
    await writeFile(filepath, Buffer.from(base64Data, "base64"));

    // Build the public URL
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const imageUrl = `${origin}/api/nft-image/${hash}`;

    return NextResponse.json({ url: imageUrl, hash });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
