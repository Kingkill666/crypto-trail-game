#!/usr/bin/env node
/**
 * One-time script to generate the Crypto Trail hero/share image via xAI Grok Imagine API.
 *
 * Usage: XAI_API_KEY=your-key node scripts/generate-hero-image.mjs
 */

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error("Set XAI_API_KEY environment variable first");
  process.exit(1);
}

const ENDPOINT = "https://api.x.ai/v1/images/generations";

const heroPrompt = `Pixel art scene, 8-bit retro video game style. A red Lamborghini supercar driving down a neon-lit cyberpunk highway at night, viewed from behind. The car is speeding toward a glowing futuristic city skyline on the horizon. On the LEFT side of the road there are exactly 3 neon signs: the first says "WALLET", the second says "$PIZZA", the third says "NFT". On the RIGHT side of the road there are exactly 3 neon signs: the first says "HODL", the second says "DEFI", the third says "GAS". A Bitcoin diamond road sign on the far left, an Ethereum diamond road sign on the far right. Every sign is unique, no sign repeats. Neon purple, blue, and pink city lights reflecting on the wet road. Stars in the dark sky above. The text "Crypto Trail" is displayed in large bold golden yellow pixel-art block letters at the top of the image. The text is prominent and glowing. Pixel art, 8-bit retro gaming aesthetic, visible square pixels, sharp clean pixel edges, no anti-aliasing, limited color palette. Dark background with vibrant neon colors.`;

async function main() {
  console.log("Generating hero image via Grok Imagine API...\n");
  const startTime = Date.now();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: heroPrompt,
      n: 1,
      response_format: "b64_json",
      aspect_ratio: "1:1",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`API error: ${res.status} ${errText}`);
    process.exit(1);
  }

  const data = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✓ Hero image generated in ${elapsed}s`);

  const b64 = data.data[0].b64_json;

  const { writeFile, mkdir } = await import("fs/promises");

  const shareDir = new URL("../public/images/share/", import.meta.url).pathname;
  try { await mkdir(shareDir, { recursive: true }); } catch {}

  const outPath = `${shareDir}hero-200.png`;
  await writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`  Saved ${outPath}`);

  // Also save a preview copy
  const previewDir = new URL("./nft-previews/", import.meta.url).pathname;
  try { await mkdir(previewDir, { recursive: true }); } catch {}
  const previewPath = `${previewDir}hero-200.png`;
  await writeFile(previewPath, Buffer.from(b64, "base64"));
  console.log(`  Saved ${previewPath}`);

  console.log("\nDone! Preview at public/images/share/hero-200.png");
}

main();
