#!/usr/bin/env node
/**
 * One-time script to generate a "death" NFT character portrait via xAI Grok Imagine API.
 * This is the single sprite used for ALL death NFTs (stats are overlaid client-side).
 *
 * Usage: XAI_API_KEY=your-key node scripts/generate-death-sprite.mjs
 */

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error("Set XAI_API_KEY environment variable first");
  process.exit(1);
}

const ENDPOINT = "https://api.x.ai/v1/images/generations";

const deathPrompt = `Extremely low resolution 16x16 pixel art scaled up to large size, NES 8-bit video game screenshot. A defeated blocky pixel character slumped over the steering wheel of a wrecked red pixel Lamborghini convertible, the car is smashed and smoking with pixel flames, broken pixel headlights. The character has blocky pixel sunglasses cracked with X eyes, blocky pixel hair. Very dark cyberpunk pixel city background with dim neon pixel signs reading $REKT and LIQUIDATED and RUG PULLED. No quotation marks on any text. The text REKT in massive bold blocky pixel font across the top with no quotation marks. Very dark moody lighting, mostly black and dark red shadows, barely lit scene. No coins on the ground, empty dark ground. Red and crimson neon color scheme. Extremely chunky large visible square pixels everywhere, like a real NES game zoomed in 8x. Each pixel block should be clearly individually visible and large. Maximum pixelation. 8-bit color palette only. No smooth lines, no curves, no anime, no gradients, no anti-aliasing whatsoever. Raw chunky square pixel blocks only. Retro 8-bit NES pixel art. Very dark atmosphere, low brightness, shadows everywhere.`;

async function main() {
  console.log("Generating death NFT sprite via Grok Imagine API...\n");
  const startTime = Date.now();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: deathPrompt,
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
  console.log(`  ✓ Death sprite generated in ${elapsed}s`);

  const b64 = data.data[0].b64_json;

  // Save PNG to public/images/nft/
  const { writeFile, mkdir } = await import("fs/promises");

  const nftDir = new URL("../public/images/nft/", import.meta.url).pathname;
  try { await mkdir(nftDir, { recursive: true }); } catch {}

  const outPath = `${nftDir}death.png`;
  await writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`  Saved ${outPath}`);

  // Also save a preview copy
  const previewDir = new URL("./nft-previews/", import.meta.url).pathname;
  try { await mkdir(previewDir, { recursive: true }); } catch {}
  const previewPath = `${previewDir}death-nft.png`;
  await writeFile(previewPath, Buffer.from(b64, "base64"));
  console.log(`  Saved ${previewPath}`);

  console.log("\nDone! Preview at public/images/nft/death.png");
}

main();
