#!/usr/bin/env node
/**
 * Generate a side-view lambo sprite using xAI Grok Imagine API,
 * then remove the black background to create a transparent PNG.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");

// Load API key from .env.local
const envPath = path.join(ROOT_DIR, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const keyMatch = envContent.match(/XAI_API_KEY=(.+)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : "";
if (!API_KEY) {
  console.error("ERROR: XAI_API_KEY not found in .env.local");
  process.exit(1);
}
const API_URL = "https://api.x.ai/v1/images/generations";
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images", "sprites");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const prompt = {
  filename: "lambo-red.png",
  prompt: "Pixel art side profile view of a bright red Lamborghini Aventador supercar, 16-bit retro video game sprite style. Slight three-quarter perspective showing mostly the side with a hint of the front. Low sleek aerodynamic body, angular sharp edges, two visible black wheels with silver alloy rims, dark tinted windows, bright yellow headlights visible on front, red taillights on rear, small rear spoiler. The car is facing RIGHT, driving right. Solid black background #000000. Pixel art with crisp sharp pixel edges, no anti-aliasing, no gradients, no ground shadows, no road. Game sprite asset, isolated car only on pure black background.",
  aspect_ratio: "2:1",
};

/**
 * Remove black/near-black background pixels and make them transparent.
 * Uses flood-fill from corners to only remove connected background regions,
 * preserving dark pixels that are part of the car (tires, windows, etc).
 */
async function removeBlackBackground(inputPath, outputPath) {
  console.log("  Removing black background...");
  const img = await loadImage(inputPath);
  const w = img.width;
  const h = img.height;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Threshold: pixels with R,G,B all below this are considered "black background"
  const THRESHOLD = 30;

  function isBlackish(idx) {
    return data[idx] < THRESHOLD && data[idx + 1] < THRESHOLD && data[idx + 2] < THRESHOLD;
  }

  function getIdx(x, y) {
    return (y * w + x) * 4;
  }

  // Flood fill from edges to find connected black background
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Seed from all edge pixels that are black
  for (let x = 0; x < w; x++) {
    if (isBlackish(getIdx(x, 0))) queue.push(x * h + 0);  // top
    if (isBlackish(getIdx(x, h - 1))) queue.push(x * h + (h - 1));  // bottom
  }
  for (let y = 0; y < h; y++) {
    if (isBlackish(getIdx(0, y))) queue.push(0 * h + y);  // left
    if (isBlackish(getIdx(w - 1, y))) queue.push((w - 1) * h + y);  // right
  }

  // BFS flood fill
  while (queue.length > 0) {
    const pos = queue.pop();
    const x = Math.floor(pos / h);
    const y = pos % h;
    const key = y * w + x;

    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    if (visited[key]) continue;

    const idx = getIdx(x, y);
    if (!isBlackish(idx)) continue;

    visited[key] = 1;
    // Make this pixel transparent
    data[idx + 3] = 0;

    queue.push((x + 1) * h + y);
    queue.push((x - 1) * h + y);
    queue.push(x * h + (y + 1));
    queue.push(x * h + (y - 1));
  }

  ctx.putImageData(imageData, 0, 0);
  const pngBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`  Background removed: ${outputPath}`);
}

async function generateImage() {
  const rawPath = path.join(OUTPUT_DIR, "lambo-raw.png");
  const finalPath = path.join(OUTPUT_DIR, prompt.filename);
  console.log(`Generating ${prompt.filename}...`);

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt: prompt.prompt,
        n: 1,
        response_format: "b64_json",
        aspect_ratio: prompt.aspect_ratio,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.log(`  HTTP ERROR ${resp.status}: ${errText.slice(0, 300)}`);
      return false;
    }

    const data = await resp.json();
    let saved = false;
    if (data.data && data.data.length > 0) {
      const b64 = data.data[0].b64_json;
      if (b64) {
        fs.writeFileSync(rawPath, Buffer.from(b64, "base64"));
        saved = true;
      } else {
        const url = data.data[0].url;
        if (url) {
          console.log(`  Got URL, downloading: ${url.slice(0, 80)}...`);
          const imgResp = await fetch(url);
          const buffer = Buffer.from(await imgResp.arrayBuffer());
          fs.writeFileSync(rawPath, buffer);
          saved = true;
        }
      }
    }

    if (!saved) {
      console.log(`  ERROR: ${JSON.stringify(data).slice(0, 300)}`);
      return false;
    }

    console.log(`  Raw image saved: ${rawPath}`);

    // Remove black background
    await removeBlackBackground(rawPath, finalPath);

    // Clean up raw file
    fs.unlinkSync(rawPath);
    console.log(`  SUCCESS: ${finalPath}`);
    return true;
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    return false;
  }
}

await generateImage();
