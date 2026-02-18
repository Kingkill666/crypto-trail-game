#!/usr/bin/env node
/**
 * Generate pixel art sprites using xAI Grok Imagine API.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) { console.error("ERROR: Set XAI_API_KEY env variable"); process.exit(1); }
const API_URL = "https://api.x.ai/v1/images/generations";
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images", "sprites");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const PROMPTS = [
  {
    filename: "cityscape-title.png",
    prompt: "Pixel art cyberpunk night scene, 8-bit retro game style. Side view of a bright RED exotic Lamborghini Aventador sports car parked on a wet dark road at night. Deep purple-blue sky with stars. City skyline behind with dark buildings that have neon-lit windows in purple, cyan, and pink colors. Chain-link fence between the car and buildings. Mountains silhouetted in far background. Wet road surface reflecting the car and neon lights. No people or characters. Pixel art style like classic 16-bit SNES/Genesis era games. Sharp pixel edges, no anti-aliasing.",
    aspect_ratio: "2:1",
  },
  {
    filename: "cityscape-trail.png",
    prompt: "Pixel art cyberpunk night road scene for a side-scrolling game, 8-bit retro style. Deep purple-blue sky with twinkling stars. Dark city skyline in background with neon purple, cyan, and amber lit windows on buildings of varying heights. Chain-link fence in middle ground. Dark wet asphalt road with dashed yellow center line taking up the bottom third. Wet road has neon color reflections. Mountains far in background. No car, no characters. Wide panoramic tileable background. Sharp pixel art style like classic SNES era.",
    aspect_ratio: "2:1",
  },
  {
    filename: "lambo-red.png",
    prompt: "Pixel art side view sprite of a bright red exotic Lamborghini Aventador supercar, 8-bit retro video game style. Low profile sleek aerodynamic design, visible black wheels with silver alloy hubs, bright yellow headlights, dark tinted windows, rear spoiler. Facing right. On a completely black background. Crisp sharp pixel edges, no anti-aliasing, no gradients. Style: NES/SNES era video game car sprite.",
    aspect_ratio: "2:1",
  },
];

async function generateImage(promptData) {
  const { filename, prompt, aspect_ratio } = promptData;
  const filepath = path.join(OUTPUT_DIR, filename);
  console.log(`Generating ${filename}...`);

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt,
        n: 1,
        response_format: "b64_json",
        aspect_ratio: aspect_ratio || "1:1",
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.log(`  HTTP ERROR ${resp.status}: ${errText.slice(0, 300)}`);
      return false;
    }

    const data = await resp.json();
    if (data.data && data.data.length > 0) {
      const b64 = data.data[0].b64_json;
      if (b64) {
        fs.writeFileSync(filepath, Buffer.from(b64, "base64"));
        console.log(`  SUCCESS: ${filepath}`);
        return true;
      }
      const url = data.data[0].url;
      if (url) {
        console.log(`  Got URL, downloading: ${url.slice(0, 80)}...`);
        const imgResp = await fetch(url);
        const buffer = Buffer.from(await imgResp.arrayBuffer());
        fs.writeFileSync(filepath, buffer);
        console.log(`  SUCCESS: ${filepath}`);
        return true;
      }
      console.log(`  ERROR: No image data. Keys: ${Object.keys(data.data[0])}`);
      return false;
    }
    console.log(`  ERROR: ${JSON.stringify(data).slice(0, 300)}`);
    return false;
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    return false;
  }
}

let success = 0;
for (const p of PROMPTS) {
  if (await generateImage(p)) success++;
}
console.log(`\nDone: ${success}/${PROMPTS.length} images generated`);
process.exit(success === PROMPTS.length ? 0 : 1);
