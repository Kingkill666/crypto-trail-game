"use client";

import { useRef, useEffect, useCallback } from "react";

// ── 8-BIT LAMBORGHINI SPRITE (32x12 pixels) ──
// Exotic low-slung profile with angular wedge shape
const LAMBO_SPRITE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,2,2,2,2,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,3,3,3,3,3,2,2,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,2,2,2,2,2,3,3,3,3,3,3,3,3,2,2,2,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,0,0],
  [0,1,4,4,4,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,4,1,0],
  [1,4,4,4,4,4,2,5,5,5,2,2,2,2,2,2,2,2,2,2,2,2,5,5,5,2,4,4,4,4,4,1],
  [1,4,4,4,4,4,2,5,6,5,2,2,2,2,2,2,2,2,2,2,2,2,5,6,5,2,4,4,4,4,4,1],
  [0,1,4,4,4,2,2,5,5,5,2,2,2,2,2,2,2,2,2,2,2,2,5,5,5,2,2,4,4,4,1,0],
  [0,0,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Color maps per frame for animation
const LAMBO_COLORS: Record<string, Record<number, string>> = {
  red: { 1: "#1a0a0a", 2: "#cc1111", 3: "#ff3333", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  yellow: { 1: "#1a1a0a", 2: "#ccaa00", 3: "#ffdd00", 4: "#222222", 5: "#333333", 6: "#ffffff" },
  blue: { 1: "#0a0a1a", 2: "#1155cc", 3: "#3388ff", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  green: { 1: "#0a1a0a", 2: "#11aa33", 3: "#33ff66", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  purple: { 1: "#0f0a1a", 2: "#7c3aed", 3: "#a855f7", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  neon: { 1: "#0a1a1a", 2: "#06b6d4", 3: "#22d3ee", 4: "#222222", 5: "#333333", 6: "#ff44ff" },
};

// ── BUILDING SPRITES (8-bit cityscape background) ──
const BUILDINGS = [
  // Tall building
  { pixels: [[1,1,1,1],[1,0,1,0],[1,1,1,1],[1,0,1,0],[1,1,1,1],[1,0,1,0],[1,1,1,1]], color: "#1a2244" },
  // Short building
  { pixels: [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]], color: "#1a1a33" },
  // Medium building with antenna
  { pixels: [[0,1,0],[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]], color: "#222244" },
];

interface PixelCanvasProps {
  width?: number;
  height?: number;
  animFrame: number;
  milesTraveled: number;
  totalMiles: number;
  tombstones: Array<{ mile: number }>;
  nextLandmarkEmoji: string;
  lamboColor?: string;
}

export function PixelTrailCanvas({
  width = 600,
  height = 120,
  animFrame,
  milesTraveled,
  totalMiles,
  tombstones,
  nextLandmarkEmoji,
  lamboColor = "red",
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = width;
    const H = height;

    // Clear
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, W, H);

    // ── SKY with gradient ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    skyGrad.addColorStop(0, "#050510");
    skyGrad.addColorStop(1, "#0a0a1e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.5);

    // ── STARS ──
    const starSeed = 42;
    for (let i = 0; i < 20; i++) {
      const sx = ((starSeed * (i + 1) * 7) % W);
      const sy = ((starSeed * (i + 1) * 3) % (H * 0.4));
      const twinkle = (animFrame + i) % 4;
      ctx.fillStyle = twinkle < 2 ? "#ffffff" : "#666666";
      ctx.globalAlpha = twinkle === 0 ? 0.9 : twinkle === 1 ? 0.4 : twinkle === 2 ? 0.7 : 0.3;
      const size = i % 3 === 0 ? 2 : 1;
      ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalAlpha = 1;

    // ── BUILDINGS (scrolling background) ──
    const scroll = (animFrame * 4) % W;
    for (let bi = 0; bi < 12; bi++) {
      const bx = ((bi * 55 - scroll + W * 2) % (W + 100)) - 50;
      const bldg = BUILDINGS[bi % BUILDINGS.length];
      const px = 3;
      const by = H * 0.55 - bldg.pixels.length * px;
      ctx.globalAlpha = 0.3;
      bldg.pixels.forEach((row, ry) => {
        row.forEach((p, rx) => {
          if (p) {
            ctx.fillStyle = bldg.color;
            ctx.fillRect(bx + rx * px, by + ry * px, px, px);
          } else {
            // Window glow
            if ((animFrame + bi + ry) % 5 < 2) {
              ctx.fillStyle = "#ffff0033";
              ctx.fillRect(bx + rx * px, by + ry * px, px, px);
            }
          }
        });
      });
    }
    ctx.globalAlpha = 1;

    // ── GROUND ──
    ctx.fillStyle = "#111122";
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // ── ROAD ──
    const roadY = H * 0.65;
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(0, roadY, W, 20);
    // Road edges
    ctx.fillStyle = "#333355";
    ctx.fillRect(0, roadY, W, 1);
    ctx.fillRect(0, roadY + 19, W, 1);
    // Dashed center line (scrolling)
    ctx.fillStyle = "#555533";
    for (let di = 0; di < 30; di++) {
      const dx = ((di * 25 - animFrame * 6 + W * 3) % (W + 50)) - 25;
      ctx.fillRect(dx, roadY + 9, 12, 2);
    }

    // ── TOMBSTONES on trail ──
    const nearTombs = tombstones.filter((t) => t.mile <= milesTraveled && t.mile > milesTraveled - 200);
    nearTombs.forEach((t, i) => {
      const tx = W * 0.1 + (i * W * 0.12);
      const ty = roadY - 12;
      // Simple cross tombstone
      ctx.fillStyle = "#555555";
      ctx.fillRect(tx + 2, ty, 2, 8);
      ctx.fillRect(tx, ty + 2, 6, 2);
      // RIP text
      ctx.fillStyle = "#444444";
      ctx.font = "bold 5px monospace";
      ctx.fillText("RIP", tx - 1, ty - 2);
    });

    // ── LAMBO ──
    const colors = LAMBO_COLORS[lamboColor] || LAMBO_COLORS.red;
    const pxSize = 3;
    const lamboX = W * 0.35;
    const lamboY = roadY - LAMBO_SPRITE.length * pxSize + 6;
    // Bounce
    const bounce = animFrame % 3 === 0 ? -1 : animFrame % 3 === 1 ? 0 : -1;
    LAMBO_SPRITE.forEach((row, ry) => {
      row.forEach((p, rx) => {
        if (p > 0) {
          ctx.fillStyle = colors[p] || "#ff0000";
          ctx.fillRect(lamboX + rx * pxSize, lamboY + ry * pxSize + bounce, pxSize, pxSize);
        }
      });
    });

    // ── EXHAUST PARTICLES ──
    for (let ei = 0; ei < 4; ei++) {
      const ex = lamboX - 8 - ei * 6 - ((animFrame * 3 + ei * 7) % 20);
      const ey = lamboY + LAMBO_SPRITE.length * pxSize * 0.6 + bounce + Math.sin(animFrame + ei) * 2;
      ctx.globalAlpha = 0.3 - ei * 0.07;
      ctx.fillStyle = "#aaaaaa";
      ctx.fillRect(ex, ey, 3 - (ei > 1 ? 1 : 0), 2);
    }
    ctx.globalAlpha = 1;

    // ── SPEED LINES ──
    if (animFrame % 2 === 0) {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#ffffff";
      for (let sl = 0; sl < 3; sl++) {
        const sly = roadY + 3 + sl * 5;
        const slx = lamboX - 20 - sl * 30 - (animFrame * 4 % 30);
        ctx.fillRect(slx, sly, 15, 1);
      }
      ctx.globalAlpha = 1;
    }

    // ── NEXT LANDMARK HINT ──
    ctx.font = "16px serif";
    ctx.globalAlpha = 0.25 + Math.sin(animFrame * 0.3) * 0.1;
    ctx.fillText(nextLandmarkEmoji, W * 0.85, roadY - 2);
    ctx.globalAlpha = 1;

    // ── PROGRESS INDICATOR (pixel bar at bottom) ──
    const barY = H - 8;
    ctx.fillStyle = "#111133";
    ctx.fillRect(10, barY, W - 20, 4);
    const pct = milesTraveled / totalMiles;
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(10, barY, (W - 20) * pct, 4);
    // Lambo dot on progress
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(10 + (W - 20) * pct - 2, barY - 1, 4, 6);

  }, [width, height, animFrame, milesTraveled, totalMiles, tombstones, nextLandmarkEmoji, lamboColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "auto",
        imageRendering: "pixelated",
        borderRadius: "8px",
        border: "2px solid #1a1a2e",
      }}
    />
  );
}

// ── TITLE SCREEN CANVAS ──
export function PixelTitleCanvas({
  width = 500,
  height = 140,
  animFrame,
}: {
  width?: number;
  height?: number;
  animFrame: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = width;
    const H = height;

    // Clear
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137 + 23) % W;
      const sy = (i * 89 + 11) % (H * 0.5);
      const twinkle = (animFrame + i * 3) % 6;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = twinkle < 2 ? 0.8 : twinkle < 4 ? 0.3 : 0.6;
      ctx.fillRect(sx, sy, twinkle === 0 ? 2 : 1, twinkle === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    // Scrolling city
    const scroll = (animFrame * 3) % W;
    for (let bi = 0; bi < 15; bi++) {
      const bx = ((bi * 40 - scroll + W * 2) % (W + 80)) - 40;
      const bh = 15 + (bi * 7) % 30;
      const by = H * 0.55 - bh;
      ctx.fillStyle = `hsl(${240 + bi * 5}, 30%, ${8 + (bi % 3) * 3}%)`;
      ctx.fillRect(bx, by, 20, bh);
      // Windows
      for (let wy = 0; wy < bh - 4; wy += 5) {
        for (let wx = 2; wx < 18; wx += 6) {
          ctx.fillStyle = (animFrame + bi + wy) % 7 < 3 ? "#ffff0044" : "#00000000";
          ctx.fillRect(bx + wx, by + wy + 2, 3, 3);
        }
      }
    }

    // Ground
    ctx.fillStyle = "#0a0a18";
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Road
    const roadY = H * 0.65;
    ctx.fillStyle = "#15152a";
    ctx.fillRect(0, roadY, W, 24);
    ctx.fillStyle = "#222244";
    ctx.fillRect(0, roadY, W, 1);
    ctx.fillRect(0, roadY + 23, W, 1);
    // Dashes
    ctx.fillStyle = "#444422";
    for (let di = 0; di < 30; di++) {
      const dx = ((di * 25 - animFrame * 8 + W * 3) % (W + 50)) - 25;
      ctx.fillRect(dx, roadY + 11, 12, 2);
    }

    // ── LAMBO driving across ──
    const colors = LAMBO_COLORS.red;
    const pxSize = 3;
    const lamboX = ((animFrame * 5) % (W + 120)) - 120;
    const lamboYPos = roadY - LAMBO_SPRITE.length * pxSize + 8;
    const bounce = animFrame % 3 === 0 ? -1 : 0;

    LAMBO_SPRITE.forEach((row, ry) => {
      row.forEach((p, rx) => {
        if (p > 0) {
          ctx.fillStyle = colors[p] || "#ff0000";
          ctx.fillRect(lamboX + rx * pxSize, lamboYPos + ry * pxSize + bounce, pxSize, pxSize);
        }
      });
    });

    // Exhaust
    for (let ei = 0; ei < 5; ei++) {
      const ex = lamboX - 6 - ei * 5 - ((animFrame * 4 + ei * 5) % 15);
      const ey = lamboYPos + 20 + bounce + Math.sin(animFrame * 0.5 + ei) * 2;
      ctx.globalAlpha = 0.25 - ei * 0.04;
      ctx.fillStyle = "#aaaaaa";
      ctx.fillRect(ex, ey, 3, 2);
    }
    ctx.globalAlpha = 1;

    // Neon reflection on road
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(lamboX, roadY + 10, LAMBO_SPRITE[0].length * pxSize, 14);
    ctx.globalAlpha = 1;

  }, [width, height, animFrame]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "auto",
        imageRendering: "pixelated",
        borderRadius: "8px",
        border: "2px solid #1a1a2e",
      }}
    />
  );
}

// ── EVENT ANIMATION CANVAS ──
export function PixelEventCanvas({
  width = 400,
  height = 100,
  animFrame,
  eventType,
}: {
  width?: number;
  height?: number;
  animFrame: number;
  eventType: "good" | "bad" | "neutral";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = width;
    const H = height;

    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    if (eventType === "good") {
      // Rising coins / diamonds
      for (let i = 0; i < 12; i++) {
        const cx = (i * 37 + 20) % W;
        const cy = H - ((animFrame * 3 + i * 20) % (H + 20));
        const sparkle = (animFrame + i) % 4;
        ctx.fillStyle = sparkle < 2 ? "#ffd700" : "#ffaa00";
        ctx.globalAlpha = 0.6 - (i % 4) * 0.1;
        // Diamond shape
        const s = 3;
        ctx.fillRect(cx, cy - s, s, s);
        ctx.fillRect(cx - s, cy, s, s);
        ctx.fillRect(cx + s, cy, s, s);
        ctx.fillRect(cx, cy + s, s, s);
        ctx.fillRect(cx, cy, s, s);
      }
      ctx.globalAlpha = 1;
      // Green glow wave
      for (let x = 0; x < W; x += 2) {
        const wave = Math.sin(x * 0.02 + animFrame * 0.3) * 10 + H * 0.5;
        ctx.fillStyle = "#10b98122";
        ctx.fillRect(x, wave, 2, 3);
      }
    } else if (eventType === "bad") {
      // Glitch effect
      for (let i = 0; i < 8; i++) {
        const gy = ((animFrame * 7 + i * 29) % H);
        const gw = 20 + (i * 13) % 60;
        const gx = (i * 47 + animFrame * 3) % W;
        ctx.fillStyle = i % 2 === 0 ? "#ff000033" : "#ff444422";
        ctx.fillRect(gx, gy, gw, 2);
      }
      // Red scanline flash
      if (animFrame % 4 < 2) {
        ctx.fillStyle = "#ff000008";
        ctx.fillRect(0, 0, W, H);
      }
      // Falling debris
      for (let i = 0; i < 6; i++) {
        const dx = (i * 71 + 10) % W;
        const dy = ((animFrame * 4 + i * 30) % (H + 20)) - 10;
        ctx.fillStyle = "#ff4444";
        ctx.globalAlpha = 0.4;
        ctx.fillRect(dx, dy, 2, 2);
        ctx.fillRect(dx + 1, dy + 2, 2, 2);
      }
      ctx.globalAlpha = 1;
    } else {
      // Neutral - data stream
      for (let i = 0; i < 15; i++) {
        const col = (i * 31) % W;
        for (let j = 0; j < 5; j++) {
          const row = ((animFrame * 2 + i * 11 + j * 17) % H);
          ctx.fillStyle = "#f59e0b";
          ctx.globalAlpha = 0.15 - j * 0.02;
          ctx.fillRect(col, row, 2, 4);
        }
      }
      ctx.globalAlpha = 1;
      // Horizontal scan
      const scanY = (animFrame * 3) % H;
      ctx.fillStyle = "#f59e0b11";
      ctx.fillRect(0, scanY, W, 4);
    }

    // Border glow based on type
    const glowColor = eventType === "good" ? "#10b981" : eventType === "bad" ? "#ef4444" : "#f59e0b";
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.3 + Math.sin(animFrame * 0.5) * 0.15;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.globalAlpha = 1;

  }, [width, height, animFrame, eventType]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "auto",
        imageRendering: "pixelated",
        borderRadius: "8px",
      }}
    />
  );
}

// ── BRIDGE ANIMATION CANVAS ──
export function PixelBridgeCanvas({
  width = 400,
  height = 120,
  animFrame,
}: {
  width?: number;
  height?: number;
  animFrame: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = width;
    const H = height;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, W, H);

    // Bridge structure
    const bridgeY = H * 0.5;

    // Cables
    ctx.strokeStyle = "#333355";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const cx = i * (W / 7);
      ctx.beginPath();
      ctx.moveTo(cx, bridgeY - 20);
      ctx.lineTo(cx, bridgeY);
      ctx.stroke();
    }

    // Main span
    ctx.fillStyle = "#222244";
    ctx.fillRect(0, bridgeY, W, 8);

    // Towers
    ctx.fillStyle = "#333366";
    ctx.fillRect(W * 0.15, bridgeY - 30, 8, 38);
    ctx.fillRect(W * 0.85 - 8, bridgeY - 30, 8, 38);

    // Data particles crossing bridge
    for (let i = 0; i < 10; i++) {
      const px = ((animFrame * 4 + i * 40) % (W + 20)) - 10;
      const py = bridgeY - 3 + Math.sin(px * 0.05 + i) * 2;
      ctx.fillStyle = (animFrame + i) % 3 === 0 ? "#06b6d4" : "#7c3aed";
      ctx.globalAlpha = 0.6;
      ctx.fillRect(px, py, 3, 3);
    }
    ctx.globalAlpha = 1;

    // Lambo crossing
    const colors = LAMBO_COLORS.red;
    const pxSize = 2;
    const lamboX = ((animFrame * 3) % (W + 100)) - 80;
    const lamboYPos = bridgeY - LAMBO_SPRITE.length * pxSize + 2;

    LAMBO_SPRITE.forEach((row, ry) => {
      row.forEach((p, rx) => {
        if (p > 0) {
          ctx.fillStyle = colors[p] || "#ff0000";
          ctx.fillRect(lamboX + rx * pxSize, lamboYPos + ry * pxSize, pxSize, pxSize);
        }
      });
    });

    // Water / void below
    for (let x = 0; x < W; x += 4) {
      const wy = bridgeY + 12 + Math.sin(x * 0.03 + animFrame * 0.2) * 3;
      ctx.fillStyle = "#06b6d4";
      ctx.globalAlpha = 0.08;
      ctx.fillRect(x, wy, 4, 2);
    }
    ctx.globalAlpha = 1;

  }, [width, height, animFrame]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "auto",
        imageRendering: "pixelated",
        borderRadius: "8px",
        border: "2px solid #1a1a2e",
      }}
    />
  );
}
