#!/usr/bin/env python3
"""Generate pixel art sprites using xAI Grok Imagine API."""
import json
import base64
import urllib.request
import ssl
import os
import sys

API_KEY = "REDACTED_XAI_KEY"
API_URL = "https://api.x.ai/v1/images/generations"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "sprites")

os.makedirs(OUTPUT_DIR, exist_ok=True)

PROMPTS = [
    {
        "filename": "cityscape-title.png",
        "prompt": "Pixel art cyberpunk night scene, 8-bit retro game style. Side view of a bright RED exotic Lamborghini Aventador sports car parked on a wet dark road at night. Deep purple-blue sky with stars. City skyline behind with dark buildings that have neon-lit windows in purple, cyan, and pink colors. Chain-link fence between the car and buildings. Mountains silhouetted in far background. Wet road surface reflecting the car and neon lights. No people or characters. Pixel art style like classic 16-bit SNES/Genesis era games. Sharp pixel edges, no anti-aliasing.",
        "aspect_ratio": "3:1",
    },
    {
        "filename": "cityscape-trail.png",
        "prompt": "Pixel art cyberpunk night road scene for a side-scrolling game, 8-bit retro style. Deep purple-blue sky with twinkling stars. Dark city skyline in background with neon purple, cyan, and amber lit windows on buildings of varying heights. Chain-link fence in middle ground. Dark wet asphalt road with dashed yellow center line taking up the bottom third. Wet road has neon color reflections. Mountains far in background. No car, no characters. Wide panoramic tileable background. Sharp pixel art style like classic SNES era.",
        "aspect_ratio": "4:1",
    },
    {
        "filename": "lambo-red.png",
        "prompt": "Pixel art side view sprite of a bright red exotic Lamborghini Aventador supercar, 8-bit retro video game style. Low profile sleek aerodynamic design, visible black wheels with silver alloy hubs, bright yellow headlights, dark tinted windows, rear spoiler. Facing right. On a completely black background. Crisp sharp pixel edges, no anti-aliasing, no gradients. Style: NES/SNES era video game car sprite.",
        "aspect_ratio": "2:1",
    },
]


def generate_image(prompt_data):
    filename = prompt_data["filename"]
    filepath = os.path.join(OUTPUT_DIR, filename)
    print(f"Generating {filename}...")

    body = json.dumps({
        "model": "grok-imagine-image",
        "prompt": prompt_data["prompt"],
        "n": 1,
        "response_format": "b64_json",
        "aspect_ratio": prompt_data.get("aspect_ratio", "1:1"),
    }).encode("utf-8")

    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )

    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "data" in data and len(data["data"]) > 0:
                b64 = data["data"][0].get("b64_json", "")
                if b64:
                    with open(filepath, "wb") as f:
                        f.write(base64.b64decode(b64))
                    print(f"  SUCCESS: {filepath}")
                    return True
                else:
                    # Check for URL format
                    url = data["data"][0].get("url", "")
                    if url:
                        print(f"  Got URL instead of b64, downloading: {url[:80]}...")
                        dl_req = urllib.request.Request(url)
                        with urllib.request.urlopen(dl_req, context=ctx) as dl_resp:
                            with open(filepath, "wb") as df:
                                df.write(dl_resp.read())
                        print(f"  SUCCESS: {filepath}")
                        return True
                    print(f"  ERROR: No image data in response")
                    print(f"  Response keys: {list(data['data'][0].keys())}")
                    return False
            else:
                print(f"  ERROR: {json.dumps(data)[:300]}")
                return False
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"  HTTP ERROR {e.code}: {body[:300]}")
        return False
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


if __name__ == "__main__":
    success = 0
    for p in PROMPTS:
        if generate_image(p):
            success += 1
    print(f"\nDone: {success}/{len(PROMPTS)} images generated")
    sys.exit(0 if success == len(PROMPTS) else 1)
