#!/usr/bin/env node
/**
 * One-time script to generate 4 NFT character portraits via xAI Grok Imagine API.
 * Outputs base64 PNG strings saved to scripts/nft-sprites.json
 *
 * Usage: node scripts/generate-nft-sprites.mjs
 */

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error("Set XAI_API_KEY environment variable first");
  process.exit(1);
}

const ENDPOINT = "https://api.x.ai/v1/images/generations";

const basePrompt = `Close-up portrait of a stylized cyberpunk character celebrating with both fists raised triumphantly, wearing large reflective wraparound sunglasses, big confident grin showing teeth, spiky messy hair, wearing a high-collar futuristic jacket. Modern high-quality 8-bit pixel art style with visible individual pixels, similar to Celeste or Hyper Light Drifter art quality. Dark cyberpunk city skyline with glowing neon lights in the background. The character is facing forward, portrait crop from chest up. Sharp clean pixel edges, no anti-aliasing, limited color palette per element. Black background behind the city. The word "VICTORY" is displayed in large bold glowing neon pixel-art letters across the top of the image above the character's head. The text is prominent, stylized, and glowing with neon light effects.`;

const tiers = [
  {
    name: "legendary",
    prompt: `${basePrompt} GOLD and AMBER neon color scheme. Golden neon glow everywhere. Red leather jacket with gold neon trim. Gold light reflecting in sunglasses. Warm golden atmosphere. Shower of gold sparkles and confetti around the character. The "VICTORY" text glows bright gold with golden light bloom.`,
  },
  {
    name: "epic",
    prompt: `${basePrompt} PURPLE and MAGENTA neon color scheme. Purple neon glow everywhere. Purple jacket with magenta neon trim. Purple-pink light reflecting in sunglasses. Cool purple atmosphere. Purple sparkles and energy particles around the character. The "VICTORY" text glows bright purple-magenta with purple light bloom.`,
  },
  {
    name: "rare",
    prompt: `${basePrompt} CYAN and BLUE neon color scheme. Cyan neon glow everywhere. Dark blue jacket with cyan neon trim. Blue-cyan light reflecting in sunglasses. Cool blue atmosphere. Cyan sparkles and digital particles around the character. The "VICTORY" text glows bright cyan-blue with blue light bloom.`,
  },
  {
    name: "common",
    prompt: `${basePrompt} GREEN neon color scheme. Green neon glow everywhere. Dark green jacket with bright green neon trim. Green light reflecting in sunglasses. Dark moody green atmosphere. Green digital sparkles around the character. The "VICTORY" text glows bright green with green light bloom.`,
  },
];

async function generateImage(tier) {
  console.log(`Generating ${tier.name}...`);
  const startTime = Date.now();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: tier.prompt,
      n: 1,
      response_format: "b64_json",
      aspect_ratio: "1:1",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error for ${tier.name}: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✓ ${tier.name} generated in ${elapsed}s`);

  return data.data[0].b64_json;
}

async function main() {
  console.log("Generating NFT character portraits via Grok Imagine API...\n");

  const results = {};

  for (const tier of tiers) {
    try {
      results[tier.name] = await generateImage(tier);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      process.exit(1);
    }
  }

  // Save to JSON file
  const { writeFile } = await import("fs/promises");
  const outPath = new URL("./nft-sprites.json", import.meta.url).pathname;
  await writeFile(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved all 4 sprites to ${outPath}`);

  // Also save individual PNGs for preview
  const { mkdir } = await import("fs/promises");
  const previewDir = new URL("./nft-previews/", import.meta.url).pathname;
  try { await mkdir(previewDir, { recursive: true }); } catch {}

  for (const [name, b64] of Object.entries(results)) {
    const pngPath = `${previewDir}${name}.png`;
    await writeFile(pngPath, Buffer.from(b64, "base64"));
    console.log(`  Saved ${pngPath}`);
  }

  console.log("\nDone! You can preview the PNGs in scripts/nft-previews/");
  console.log("Next step: run the embed script to bake these into the game code.");
}

main();
