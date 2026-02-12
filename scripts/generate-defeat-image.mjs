#!/usr/bin/env node
/**
 * One-time script to generate a "defeat" share image via xAI Grok Imagine API.
 * The image shows a broke/dead cyberpunk character with a broken exotic car.
 *
 * Usage: XAI_API_KEY=your-key node scripts/generate-defeat-image.mjs
 */

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error("Set XAI_API_KEY environment variable first");
  process.exit(1);
}

const ENDPOINT = "https://api.x.ai/v1/images/generations";

const defeatPrompt = `Pixel art game over screen, 32x32 pixel character scaled up, retro 8-bit video game style. A defeated cyberpunk pixel character sitting slumped on the ground, head down, cracked pixel sunglasses, torn pixel jacket. Behind him a wrecked red pixel Lamborghini with pixel smoke coming from the hood. Pixel crypto coins on the ground. Dark pixel city background. The text "CRYPTO TRAIL REKT ME" in large blocky pixel font at the top glowing red neon. Everything is made of large visible square pixels. Low resolution pixel art upscaled, like a NES or SNES game. No smooth lines, no gradients, no anti-aliasing. Every shape is built from square pixel blocks. Red and dark orange color palette. Pixel art, 8-bit, retro gaming aesthetic.`;

async function main() {
  console.log("Generating defeat share image via Grok Imagine API...\n");
  const startTime = Date.now();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: defeatPrompt,
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
  console.log(`  ✓ Defeat image generated in ${elapsed}s`);

  const b64 = data.data[0].b64_json;

  // Save PNG to public/images/nft/
  const { writeFile, mkdir } = await import("fs/promises");

  const nftDir = new URL("../public/images/nft/", import.meta.url).pathname;
  try { await mkdir(nftDir, { recursive: true }); } catch {}

  const outPath = `${nftDir}defeat.png`;
  await writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`  Saved ${outPath}`);

  // Also save a preview copy
  const previewDir = new URL("./nft-previews/", import.meta.url).pathname;
  try { await mkdir(previewDir, { recursive: true }); } catch {}
  const previewPath = `${previewDir}defeat.png`;
  await writeFile(previewPath, Buffer.from(b64, "base64"));
  console.log(`  Saved ${previewPath}`);

  console.log("\nDone! Preview at public/images/nft/defeat.png");
}

main();
