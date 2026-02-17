"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useConnect } from "wagmi";
import { useGamePayment, useNftMint, useFreePlay } from "@/hooks/use-web3";
import { useLeaderboard, usePlayerProfile, submitScore } from "@/hooks/use-leaderboard";

// ═══════════════════════════════════════════════════════════════
// CRYPTO TRAIL - A Degen Oregon Trail for Farcaster (8-BIT EDITION)
// Farcaster Mini App — Target: 424×695px web, device-sized mobile
// ═══════════════════════════════════════════════════════════════

// ── FARCASTER SDK (safe import — works outside Farcaster too) ──
const farcasterSdkPromise: Promise<any> =
  typeof window !== "undefined"
    ? import("@farcaster/miniapp-sdk")
        .then((mod) => mod.sdk)
        .catch(() => null)
    : Promise.resolve(null);

function useFarcasterReady() {
  const called = useRef(false);
  useEffect(() => {
    if (!called.current) {
      called.current = true;
      farcasterSdkPromise.then((sdk) => {
        if (sdk?.actions?.ready) {
          sdk.actions.ready();
        }
        // Auto-prompt user to add mini app (non-blocking, runs independently)
        if (sdk?.context && sdk?.actions?.addMiniApp) {
          sdk.context.then((ctx: any) => {
            if (ctx?.client && !ctx.client.added) {
              sdk.actions.addMiniApp().catch(() => {});
            }
          }).catch(() => {});
        }
      });
    }
  }, []);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crypto-trail-game.vercel.app";

async function uploadNftImage(
  base64DataUrl: string,
  metadata?: {
    type: "victory" | "death";
    score: number;
    classId: string;
    survivors: number;
    days: number;
    miles?: number;
  }
): Promise<{ metadataUrl: string; imageUrl: string } | null> {
  try {
    const res = await fetch("/api/nft-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64DataUrl, metadata }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      metadataUrl: data.url || null,
      imageUrl: data.imageUrl || data.url || null,
    };
  } catch {
    return null;
  }
}

async function shareGameCast(text: string, nftImageDataUrl?: string | null, staticImageUrl?: string | null) {
  const sdk = await farcasterSdkPromise;
  if (!sdk?.actions?.composeCast) return;

  const embeds: string[] = [];

  // Upload NFT image and add as first embed
  if (nftImageDataUrl) {
    const result = await uploadNftImage(nftImageDataUrl);
    if (result?.imageUrl) embeds.push(result.imageUrl);
  } else if (staticImageUrl) {
    embeds.push(staticImageUrl);
  }

  // Add the game URL as second embed (max 2 embeds per cast)
  if (embeds.length < 2) {
    embeds.push(APP_URL);
  }

  await sdk.actions.composeCast({
    text,
    embeds: embeds as [] | [string] | [string, string],
  });
}

// ── 8-BIT LAMBORGHINI SPRITE (32x12 pixels) ──
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

const LAMBO_COLORS: Record<string, Record<number, string>> = {
  red: { 1: "#1a0a0a", 2: "#cc1111", 3: "#ff3333", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  yellow: { 1: "#1a1a0a", 2: "#ccaa00", 3: "#ffdd00", 4: "#222222", 5: "#333333", 6: "#ffffff" },
  blue: { 1: "#0a0a1a", 2: "#1155cc", 3: "#3388ff", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  green: { 1: "#0a1a0a", 2: "#11aa33", 3: "#33ff66", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  purple: { 1: "#0f0a1a", 2: "#7c3aed", 3: "#a855f7", 4: "#222222", 5: "#333333", 6: "#ffff44" },
  neon: { 1: "#0a1a1a", 2: "#06b6d4", 3: "#22d3ee", 4: "#222222", 5: "#333333", 6: "#ff44ff" },
};

const BUILDINGS = [
  { pixels: [[1,1,1,1],[1,0,1,0],[1,1,1,1],[1,0,1,0],[1,1,1,1],[1,0,1,0],[1,1,1,1]], color: "#1a2244" },
  { pixels: [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]], color: "#1a1a33" },
  { pixels: [[0,1,0],[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]], color: "#222244" },
];

// ── 8-BIT EVENT ICON SPRITES (unique per event) ──
// Each sprite is drawn on a 48x48 canvas with pixel-perfect rendering

const EVENT_SPRITES: Record<string, { draw: (ctx: CanvasRenderingContext2D, f: number) => void }> = {
  // ═══ GOOD EVENTS (12) ═══
  "AIRDROP!": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(14, 4, 20, 4);
      ctx.fillRect(12, 8, 24, 2);
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(16, 4, 4, 4);
      ctx.fillRect(24, 4, 4, 4);
      ctx.fillStyle = "#666";
      ctx.fillRect(14, 10, 1, 10); ctx.fillRect(33, 10, 1, 10);
      ctx.fillRect(16, 12, 1, 8); ctx.fillRect(31, 12, 1, 8);
      const by = 20 + (f % 4 < 2 ? 0 : 1);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(18, by, 12, 10);
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(23, by, 2, 10);
      ctx.fillRect(18, by + 4, 12, 2);
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = (f % 3 === 0) ? 0.9 : 0.3;
      ctx.fillRect(8, 8, 2, 2); ctx.fillRect(38, 12, 2, 2); ctx.fillRect(6, 28, 2, 2);
      ctx.fillRect(40, 6, 2, 2);
      ctx.fillStyle = "#10b981";
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 5; i++) {
        const tx = 8 + i * 8, ty = 34 + ((f * 2 + i * 7) % 12);
        ctx.fillRect(tx, ty, 3, 3);
      }
      ctx.globalAlpha = 1;
    }
  },
  "PUMP!": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#10b981";
      ctx.fillRect(4, 40, 4, 2); ctx.fillRect(8, 36, 4, 2); ctx.fillRect(12, 38, 4, 2);
      ctx.fillRect(16, 32, 4, 2); ctx.fillRect(20, 28, 4, 2); ctx.fillRect(24, 24, 4, 2);
      ctx.fillRect(28, 16, 4, 2); ctx.fillRect(32, 8, 4, 2);
      const ry = 4 + (f % 3 === 0 ? -1 : 0);
      ctx.fillStyle = "#e0e0e0";
      ctx.fillRect(36, ry, 4, 12);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(34, ry + 8, 8, 4);
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(36, ry, 4, 2);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(36, ry + 12, 4, 3 + (f % 2));
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(37, ry + 15, 2, 2 + (f % 3));
      ctx.fillStyle = "#ffd700";
      ctx.globalAlpha = 0.6;
      ctx.fillRect(42, 6, 2, 2); ctx.fillRect(30, 2, 2, 2);
      ctx.globalAlpha = 1;
    }
  },
  "BASED MOMENT": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(14, 12, 6, 4); ctx.fillRect(26, 12, 6, 4);
      ctx.fillRect(12, 14, 24, 6);
      ctx.fillRect(14, 20, 20, 4);
      ctx.fillRect(16, 24, 16, 4);
      ctx.fillRect(18, 28, 12, 4);
      ctx.fillRect(20, 32, 8, 4);
      ctx.fillRect(22, 36, 4, 2);
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(16, 14, 4, 4);
      ctx.fillStyle = "#ffd700";
      ctx.globalAlpha = f % 3 === 0 ? 0.9 : 0.4;
      ctx.fillRect(6, 8, 2, 2); ctx.fillRect(40, 10, 2, 2);
      ctx.fillRect(8, 30, 2, 2); ctx.fillRect(38, 26, 2, 2);
      ctx.fillRect(4, 20, 2, 2); ctx.fillRect(42, 18, 2, 2);
      ctx.globalAlpha = 1;
    }
  },
  "NFT FLIP": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(8, 6, 32, 2); ctx.fillRect(8, 38, 32, 2);
      ctx.fillRect(8, 6, 2, 34); ctx.fillRect(38, 6, 2, 34);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(10, 8, 28, 30);
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(22, 12, 4, 2); ctx.fillRect(20, 14, 8, 2); ctx.fillRect(18, 16, 12, 2);
      ctx.fillRect(16, 18, 16, 2); ctx.fillRect(18, 20, 12, 2); ctx.fillRect(20, 22, 8, 4);
      ctx.fillRect(22, 26, 4, 4); ctx.fillRect(23, 30, 2, 2);
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(20, 16, 2, 2);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(30, 34, 10, 8);
      ctx.fillStyle = "#fff";
      ctx.fillRect(33, 36, 1, 4); ctx.fillRect(34, 36, 2, 1); ctx.fillRect(34, 38, 2, 1);
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = f % 2 === 0 ? 0.8 : 0.3;
      ctx.fillRect(12, 10, 2, 2);
      ctx.globalAlpha = 1;
    }
  },
  "BUG BOUNTY": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(14, 20, 8, 6); ctx.fillRect(16, 18, 4, 2);
      ctx.fillStyle = "#333";
      ctx.fillRect(12, 22, 2, 2); ctx.fillRect(22, 22, 2, 2);
      ctx.fillRect(12, 26, 2, 4); ctx.fillRect(22, 26, 2, 4);
      ctx.fillRect(14, 26, 2, 2); ctx.fillRect(20, 26, 2, 2);
      ctx.fillStyle = "#666";
      ctx.fillRect(26, 10, 10, 2); ctx.fillRect(24, 12, 2, 8);
      ctx.fillRect(36, 12, 2, 8); ctx.fillRect(26, 20, 10, 2);
      ctx.fillRect(24, 10, 2, 2); ctx.fillRect(36, 10, 2, 2);
      ctx.fillRect(24, 20, 2, 2); ctx.fillRect(36, 20, 2, 2);
      ctx.fillRect(36, 20, 4, 2); ctx.fillRect(38, 22, 4, 2); ctx.fillRect(40, 24, 4, 2);
      ctx.fillStyle = "#06b6d433";
      ctx.fillRect(26, 12, 10, 8);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(6, 36, 6, 6); ctx.fillRect(14, 38, 6, 6); ctx.fillRect(22, 36, 6, 6);
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(8, 38, 2, 2); ctx.fillRect(16, 40, 2, 2); ctx.fillRect(24, 38, 2, 2);
    }
  },
  "FARCASTER FREN": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(10, 18, 16, 4); ctx.fillRect(12, 14, 12, 4); ctx.fillRect(14, 12, 8, 2);
      ctx.fillStyle = "#555";
      ctx.fillRect(17, 22, 2, 16); ctx.fillRect(12, 38, 12, 2);
      ctx.fillStyle = "#06b6d4";
      ctx.globalAlpha = (f % 4 === 0) ? 0.8 : (f % 4 === 1) ? 0.6 : (f % 4 === 2) ? 0.4 : 0.2;
      ctx.fillRect(28, 8, 2, 2); ctx.fillRect(30, 6, 2, 6); ctx.fillRect(32, 4, 2, 10);
      ctx.fillRect(34, 2, 2, 14); ctx.fillRect(36, 6, 2, 6);
      ctx.globalAlpha = (f % 4 === 2) ? 0.8 : 0.3;
      ctx.fillRect(38, 8, 2, 4); ctx.fillRect(40, 6, 2, 8); ctx.fillRect(42, 8, 2, 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#f472b6";
      ctx.fillRect(34, 20, 4, 2); ctx.fillRect(32, 22, 8, 2); ctx.fillRect(34, 24, 4, 2);
      ctx.fillRect(35, 26, 2, 2);
    }
  },
  "YIELD HARVEST": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#10b981";
      ctx.fillRect(12, 16, 2, 24); ctx.fillRect(22, 12, 2, 28); ctx.fillRect(32, 18, 2, 22);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(10, 20, 2, 4); ctx.fillRect(14, 24, 2, 4);
      ctx.fillRect(20, 16, 2, 4); ctx.fillRect(24, 20, 2, 4);
      ctx.fillRect(30, 22, 2, 4); ctx.fillRect(34, 26, 2, 4);
      ctx.fillStyle = "#ffd700";
      const bob = f % 4 < 2 ? 0 : -1;
      ctx.fillRect(10, 10 + bob, 6, 6); ctx.fillRect(20, 6 + bob, 6, 6); ctx.fillRect(30, 12 + bob, 6, 6);
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(12, 12 + bob, 2, 2); ctx.fillRect(22, 8 + bob, 2, 2); ctx.fillRect(32, 14 + bob, 2, 2);
      ctx.fillStyle = "#3d2200";
      ctx.fillRect(4, 40, 40, 4);
      ctx.fillStyle = "#5c3300";
      ctx.fillRect(4, 40, 40, 2);
    }
  },
  "AI AGENT ALPHA": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#333";
      ctx.fillRect(14, 8, 20, 20);
      ctx.fillStyle = "#444";
      ctx.fillRect(16, 10, 16, 16);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(18, 14, 4, 2); ctx.fillRect(18, 18, 4, 2);
      ctx.fillRect(20, 12, 2, 2); ctx.fillRect(18, 16, 2, 2); ctx.fillRect(20, 20, 2, 2);
      ctx.fillRect(28, 14, 4, 2); ctx.fillRect(28, 18, 4, 2);
      ctx.fillRect(30, 12, 2, 2); ctx.fillRect(28, 16, 2, 2); ctx.fillRect(30, 20, 2, 2);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(23, 2, 2, 6);
      ctx.fillStyle = f % 2 === 0 ? "#10b981" : "#0a0a12";
      ctx.fillRect(21, 0, 6, 3);
      ctx.fillStyle = "#333";
      ctx.fillRect(16, 28, 16, 10);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(20, 30, 8, 2); ctx.fillRect(18, 34, 12, 2);
      ctx.fillRect(10, 30, 6, 4); ctx.fillRect(32, 30, 6, 4);
      ctx.fillStyle = "#555";
      ctx.fillRect(18, 38, 4, 6); ctx.fillRect(26, 38, 4, 6);
    }
  },
  "AI AUDIT SAVES YOU": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#10b981";
      ctx.fillRect(12, 6, 24, 4); ctx.fillRect(10, 10, 28, 16);
      ctx.fillRect(12, 26, 24, 4); ctx.fillRect(14, 30, 20, 4);
      ctx.fillRect(18, 34, 12, 4); ctx.fillRect(22, 38, 4, 2);
      ctx.fillStyle = "#0a3d2a";
      ctx.fillRect(14, 10, 20, 16); ctx.fillRect(16, 26, 16, 4); ctx.fillRect(20, 30, 8, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(18, 20, 2, 2); ctx.fillRect(20, 22, 2, 2);
      ctx.fillRect(22, 24, 2, 2); ctx.fillRect(24, 22, 2, 2);
      ctx.fillRect(26, 20, 2, 2); ctx.fillRect(28, 18, 2, 2); ctx.fillRect(30, 16, 2, 2);
      ctx.fillStyle = "#10b981";
      ctx.globalAlpha = 0.2 + (f % 3) * 0.1;
      ctx.fillRect(6, 4, 36, 38);
      ctx.globalAlpha = 1;
    }
  },
  "AI DEV SPEEDRUN": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#333";
      ctx.fillRect(6, 4, 36, 28);
      ctx.fillStyle = "#0a0a2e";
      ctx.fillRect(8, 6, 32, 24);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(10, 8, 12, 2); ctx.fillRect(10, 12, 8, 2);
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(20, 12, 14, 2); ctx.fillRect(10, 16, 18, 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(10, 20, 10, 2); ctx.fillRect(22, 20, 8, 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(10, 24, 16, 2);
      if (f % 3 < 2) { ctx.fillStyle = "#fff"; ctx.fillRect(28, 24, 4, 2); }
      ctx.fillStyle = "#555";
      ctx.fillRect(20, 32, 8, 2); ctx.fillRect(16, 34, 16, 2);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(36, 6, 4, 2); ctx.fillRect(34, 8, 4, 2); ctx.fillRect(32, 10, 6, 2);
      ctx.fillRect(34, 12, 4, 2); ctx.fillRect(36, 14, 4, 2); ctx.fillRect(38, 16, 4, 2);
    }
  },
  "AI ART SELLS": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#664400";
      ctx.fillRect(12, 32, 2, 14); ctx.fillRect(34, 32, 2, 14); ctx.fillRect(22, 36, 2, 10);
      ctx.fillStyle = "#ddd";
      ctx.fillRect(10, 4, 28, 28);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(12, 6, 24, 24);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(14, 8, 8, 8);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(22, 12, 10, 10);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(16, 18, 8, 8);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(14, 14, 4, 4);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(34, 28, 12, 8);
      ctx.fillStyle = "#000";
      ctx.font = "bold 6px monospace";
      ctx.fillText("5E", 36, 34);
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = f % 2 === 0 ? 0.8 : 0.3;
      ctx.fillRect(38, 4, 2, 2); ctx.fillRect(4, 10, 2, 2);
      ctx.globalAlpha = 1;
    }
  },
  "GPT PREDICTS THE DIP": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(14, 4, 20, 2); ctx.fillRect(10, 6, 28, 2);
      ctx.fillRect(8, 8, 32, 20); ctx.fillRect(10, 28, 28, 2); ctx.fillRect(14, 30, 20, 2);
      ctx.fillStyle = "#0a0a2e";
      ctx.fillRect(12, 8, 24, 20);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(14, 12, 2, 2); ctx.fillRect(16, 14, 2, 2); ctx.fillRect(18, 16, 2, 2);
      ctx.fillRect(20, 18, 2, 2); ctx.fillRect(22, 20, 2, 2);
      ctx.fillRect(24, 18, 2, 2); ctx.fillRect(26, 14, 2, 2); ctx.fillRect(28, 10, 2, 2);
      ctx.fillRect(30, 8, 2, 2); ctx.fillRect(32, 6, 2, 2);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(32, 4, 2, 2); ctx.fillRect(30, 6, 2, 2); ctx.fillRect(34, 6, 2, 2);
      ctx.fillStyle = "#555";
      ctx.fillRect(12, 32, 24, 2); ctx.fillRect(16, 34, 16, 4);
      ctx.fillStyle = "#7c3aed";
      ctx.globalAlpha = 0.15 + (f % 3) * 0.08;
      ctx.fillRect(8, 4, 32, 28);
      ctx.globalAlpha = 1;
    }
  },

  // ═══ BAD EVENTS (10) ═══
  "RUG PULL!": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#ffd700";
      const off = f % 4;
      ctx.fillRect(12, 8 + off * 2, 4, 4); ctx.fillRect(20, 6 + off * 3, 4, 4);
      ctx.fillRect(30, 10 + off * 2, 4, 4); ctx.fillRect(16, 14 + off, 4, 4);
      ctx.fillStyle = "#ef4444";
      const rx = (f % 6) * 2;
      ctx.fillRect(4 + rx, 28, 36, 4);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(8 + rx, 28, 4, 4); ctx.fillRect(18 + rx, 28, 4, 4); ctx.fillRect(28 + rx, 28, 4, 4);
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(4 + rx, 32, 4, 4); ctx.fillRect(4 + rx, 36, 2, 2);
      ctx.fillStyle = "#ffcc99";
      ctx.fillRect(22, 16, 4, 4);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(20, 20, 8, 6);
      ctx.fillStyle = "#1e3a5f";
      ctx.fillRect(20, 26, 4, 2); ctx.fillRect(24, 26, 4, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(36, 4, 4, 8); ctx.fillRect(36, 14, 4, 4);
    }
  },
  "GAS SPIKE!": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#555";
      ctx.fillRect(14, 12, 14, 24);
      ctx.fillStyle = "#333";
      ctx.fillRect(16, 14, 10, 8);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(16, 14, 10, 8);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 6px monospace";
      ctx.fillText("999", 17, 21);
      ctx.fillStyle = "#222";
      ctx.fillRect(28, 16, 8, 2); ctx.fillRect(34, 16, 2, 12); ctx.fillRect(32, 26, 4, 4);
      ctx.fillStyle = "#666";
      ctx.fillRect(16, 10, 10, 2);
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(18, 4 - (f % 2), 6, 6);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(20, 2 - (f % 2), 4, 4);
      ctx.fillStyle = "#ff6b00";
      ctx.fillRect(16, 6, 2, 4); ctx.fillRect(26, 6, 2, 4);
      ctx.fillStyle = "#333";
      ctx.fillRect(34, 30 + (f % 3), 2, 3);
    }
  },
  "BEAR MARKET": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(12, 8, 24, 22);
      ctx.fillRect(8, 12, 4, 8); ctx.fillRect(36, 12, 4, 8);
      ctx.fillStyle = "#A0522D";
      ctx.fillRect(10, 14, 2, 4); ctx.fillRect(38, 14, 2, 4);
      ctx.fillStyle = "#111";
      ctx.fillRect(18, 16, 4, 4); ctx.fillRect(28, 16, 4, 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(18, 16, 2, 2); ctx.fillRect(28, 16, 2, 2);
      ctx.fillStyle = "#111";
      ctx.fillRect(20, 26, 2, 2); ctx.fillRect(22, 28, 4, 2); ctx.fillRect(26, 26, 2, 2);
      ctx.fillStyle = "#333";
      ctx.fillRect(22, 22, 4, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(8, 34, 4, 2); ctx.fillRect(12, 36, 4, 2); ctx.fillRect(16, 38, 4, 2);
      ctx.fillRect(20, 40, 4, 2); ctx.fillRect(24, 42, 8, 2); ctx.fillRect(32, 44, 8, 2);
      ctx.fillRect(38, 42, 2, 2); ctx.fillRect(36, 44, 6, 2);
    }
  },
  "WALLET DRAINED!": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#664400";
      ctx.fillRect(8, 16, 22, 18);
      ctx.fillStyle = "#885500";
      ctx.fillRect(8, 16, 22, 4);
      ctx.fillStyle = "#553300";
      ctx.fillRect(26, 22, 4, 8);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(26, 24, 4, 4);
      ctx.fillStyle = "#ffd700";
      const sp = f % 4;
      ctx.fillRect(32 + sp * 2, 16 - sp, 4, 4);
      ctx.fillRect(34 + sp * 2, 22 - sp, 4, 4);
      ctx.fillRect(30 + sp * 2, 28 + sp, 4, 4);
      ctx.fillRect(36 + sp, 12 - sp * 2, 4, 4);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(10, 20, 16, 10);
      ctx.fillStyle = "#555";
      ctx.fillRect(14, 22, 8, 6);
      ctx.fillStyle = "#000";
      ctx.fillRect(16, 24, 2, 2); ctx.fillRect(20, 24, 2, 2);
    }
  },
  "LIQUIDATED": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(22, 2, 4, 8); ctx.fillRect(8, 10, 8, 2); ctx.fillRect(32, 10, 8, 2);
      ctx.fillRect(10, 4, 2, 6); ctx.fillRect(36, 4, 2, 6);
      ctx.fillRect(6, 20, 4, 2); ctx.fillRect(10, 24, 4, 2); ctx.fillRect(14, 28, 4, 2);
      ctx.fillRect(18, 32, 4, 2); ctx.fillRect(22, 36, 4, 2); ctx.fillRect(26, 40, 12, 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.fillText("100x", 14, 18);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(14, 22, 2, 2); ctx.fillRect(16, 24, 2, 2);
      ctx.fillRect(16, 22, 2, 2); ctx.fillRect(14, 24, 2, 2);
      ctx.fillRect(30, 22, 2, 2); ctx.fillRect(32, 24, 2, 2);
      ctx.fillRect(32, 22, 2, 2); ctx.fillRect(30, 24, 2, 2);
      ctx.fillStyle = "#ffd700";
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 6; i++) { ctx.fillRect(10 + i * 6, 38 + (f + i) % 4, 2, 2); }
      ctx.globalAlpha = 1;
    }
  },
  "AI BOT GONE ROGUE": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#333";
      ctx.fillRect(14, 6, 20, 18);
      ctx.fillStyle = "#444";
      ctx.fillRect(16, 8, 16, 14);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(18, 12, 4, 4); ctx.fillRect(26, 12, 4, 4);
      ctx.fillStyle = f % 2 === 0 ? "#ff0000" : "#cc0000";
      ctx.fillRect(19, 13, 2, 2); ctx.fillRect(27, 13, 2, 2);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(18, 18, 2, 2); ctx.fillRect(20, 20, 8, 2); ctx.fillRect(28, 18, 2, 2);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(23, 0, 2, 6);
      ctx.fillStyle = f % 3 === 0 ? "#ffd700" : "#ff4444";
      ctx.fillRect(20, 0, 8, 3);
      ctx.fillStyle = "#ffd700";
      ctx.globalAlpha = f % 2 === 0 ? 0.8 : 0.3;
      ctx.fillRect(8, 8, 2, 2); ctx.fillRect(38, 10, 2, 2);
      ctx.fillRect(6, 18, 2, 2); ctx.fillRect(40, 16, 2, 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#333";
      ctx.fillRect(16, 24, 16, 12);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(20, 26, 8, 2); ctx.fillRect(20, 30, 8, 2);
      ctx.fillRect(10, 26, 6, 4); ctx.fillRect(32, 26, 6, 4);
      ctx.fillRect(8, 30, 4, 2); ctx.fillRect(36, 30, 4, 2);
    }
  },
  "PROMPT INJECTION ATTACK": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#aaa";
      ctx.fillRect(8, 20, 24, 6);
      ctx.fillStyle = "#888";
      ctx.fillRect(8, 20, 24, 2);
      ctx.fillStyle = "#666";
      ctx.fillRect(4, 18, 4, 10);
      ctx.fillStyle = "#ccc";
      ctx.fillRect(32, 22, 10, 2);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(42, 22, 4, 2);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(10, 22, 16, 2);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 5px monospace";
      ctx.fillText("INJECT", 12, 38);
      ctx.fillStyle = "#10b981";
      ctx.fillText("{DROP *}", 10, 44);
      ctx.fillStyle = "#555";
      ctx.fillRect(18, 6, 10, 8); ctx.fillRect(20, 14, 6, 2);
      ctx.fillStyle = "#000";
      ctx.fillRect(20, 8, 2, 2); ctx.fillRect(24, 8, 2, 2); ctx.fillRect(22, 12, 2, 2);
    }
  },
  "DEEPFAKE SCAM": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#ffcc99";
      ctx.fillRect(10, 8, 14, 20);
      ctx.fillStyle = "#ff9966";
      ctx.fillRect(24 + (f % 2), 8, 14, 20);
      ctx.fillStyle = "#333";
      ctx.fillRect(14, 14, 4, 4); ctx.fillRect(28 + (f % 2), 14, 4, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(22, 6, 4, 24);
      ctx.fillStyle = "#00ff0044";
      ctx.fillRect(24, 8 + (f % 3), 16, 2); ctx.fillRect(10, 18 + (f % 4), 14, 2);
      ctx.fillStyle = "#333";
      ctx.fillRect(16, 24, 6, 2); ctx.fillRect(28 + (f % 2), 24, 6, 2);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 5px monospace";
      ctx.fillText("FAKE", 14, 38);
      ctx.fillStyle = "#10b981";
      ctx.fillText("01101", 12, 44);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(4, 4, 6, 2); ctx.fillRect(38, 4, 6, 2);
    }
  },
  "AI HALLUCINATION": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, 10, 28, 18); ctx.fillRect(12, 8, 24, 2); ctx.fillRect(12, 28, 24, 2);
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(18, 14, 12, 10);
      const px = 22 + Math.floor(Math.sin(f * 0.8) * 2);
      const py = 17 + Math.floor(Math.cos(f * 0.8) * 2);
      ctx.fillStyle = "#000";
      ctx.fillRect(px, py, 4, 4);
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(20, 14, 2, 2); ctx.fillRect(26, 14, 2, 2);
      ctx.fillRect(18, 18, 2, 2); ctx.fillRect(28, 18, 2, 2);
      ctx.fillRect(20, 22, 2, 2); ctx.fillRect(26, 22, 2, 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(6, 4, 2, 4); ctx.fillRect(4, 6, 2, 2); ctx.fillRect(8, 6, 2, 2);
      ctx.fillRect(38, 4, 2, 4); ctx.fillRect(36, 6, 2, 2); ctx.fillRect(40, 6, 2, 2);
      ctx.fillStyle = "#ef4444";
      for (let i = 0; i < 8; i++) { ctx.fillRect(6 + i * 5, 34 + ((f + i) % 3), 3, 2); }
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 5px monospace";
      ctx.fillText("SAFE\u2713", 12, 44);
      ctx.fillStyle = "#555";
      ctx.fillRect(12, 42, 24, 1);
    }
  },
  "AI FLASH CRASH": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(4, 8, 2, 2); ctx.fillRect(6, 12, 2, 2); ctx.fillRect(8, 16, 2, 2);
      ctx.fillRect(10, 22, 2, 2); ctx.fillRect(12, 30, 2, 2); ctx.fillRect(14, 38, 2, 2);
      ctx.fillRect(18, 6, 2, 2); ctx.fillRect(20, 10, 2, 2); ctx.fillRect(22, 18, 2, 2);
      ctx.fillRect(24, 26, 2, 2); ctx.fillRect(26, 34, 2, 2); ctx.fillRect(28, 40, 2, 2);
      ctx.fillRect(32, 10, 2, 2); ctx.fillRect(34, 16, 2, 2); ctx.fillRect(36, 24, 2, 2);
      ctx.fillRect(38, 32, 2, 2); ctx.fillRect(40, 40, 2, 2);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(22, 2, 4, 2); ctx.fillRect(20, 4, 4, 2); ctx.fillRect(22, 6, 6, 2);
      ctx.fillRect(24, 8, 4, 2); ctx.fillRect(22, 10, 4, 2);
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 10px monospace";
      ctx.fillText("-60%", 10, 44);
      ctx.fillStyle = "#555";
      ctx.fillRect(4, 2, 6, 4); ctx.fillRect(38, 2, 6, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(5, 3, 2, 2); ctx.fillRect(39, 3, 2, 2);
    }
  },

  // ═══ NEUTRAL EVENTS (5) ═══
  "CHAIN FORK": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(4, 20, 4, 4); ctx.fillRect(10, 20, 4, 4); ctx.fillRect(16, 20, 4, 4);
      ctx.fillRect(22, 18, 4, 8);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(28, 14, 4, 4); ctx.fillRect(34, 10, 4, 4); ctx.fillRect(40, 6, 4, 4);
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(28, 28, 4, 4); ctx.fillRect(34, 32, 4, 4); ctx.fillRect(40, 36, 4, 4);
      ctx.fillStyle = "#888";
      ctx.fillRect(8, 22, 2, 2); ctx.fillRect(14, 22, 2, 2);
      ctx.fillRect(26, 16, 2, 2); ctx.fillRect(32, 12, 2, 2);
      ctx.fillRect(26, 30, 2, 2); ctx.fillRect(32, 34, 2, 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(20, 4, 8, 2); ctx.fillRect(26, 6, 2, 4); ctx.fillRect(22, 10, 6, 2);
      ctx.fillRect(22, 12, 2, 2); ctx.fillRect(22, 16, 2, 2);
    }
  },
  "GOVERNANCE VOTE": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#444";
      ctx.fillRect(10, 16, 28, 22);
      ctx.fillStyle = "#555";
      ctx.fillRect(10, 16, 28, 4);
      ctx.fillStyle = "#222";
      ctx.fillRect(18, 18, 12, 2);
      const py = 6 + (f % 4);
      ctx.fillStyle = "#eee";
      ctx.fillRect(18, py, 12, 12);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(22, py + 2, 2, 2); ctx.fillRect(24, py + 4, 2, 2);
      ctx.fillRect(26, py + 2, 2, 2); ctx.fillRect(28, py, 2, 2);
      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 5px monospace";
      ctx.fillText("DAO", 17, 32);
      ctx.fillStyle = "#888";
      ctx.fillRect(4, 28, 4, 6); ctx.fillRect(5, 24, 2, 4);
      ctx.fillRect(40, 28, 4, 6); ctx.fillRect(41, 24, 2, 4);
    }
  },
  "CT DRAMA": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(14, 14, 16, 12); ctx.fillRect(12, 16, 20, 8); ctx.fillRect(18, 8, 10, 8);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(28, 14, 6, 4);
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(10, 18, 6, 6);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(22, 10, 4, 4);
      ctx.fillStyle = f % 2 === 0 ? "#ff0000" : "#cc0000";
      ctx.fillRect(23, 11, 2, 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(16, 8, 6, 6);
      ctx.fillStyle = "#666";
      ctx.fillRect(14, 10, 4, 4);
      ctx.fillRect(15, 11, 2, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(32, 4, 12, 8);
      ctx.fillStyle = "#333";
      ctx.font = "bold 5px monospace";
      ctx.fillText("BEEP", 33, 10);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(6, 4, 4, 6); ctx.fillRect(6, 12, 4, 2);
    }
  },
  "BOT VS BOT": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(4, 12, 14, 12);
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(6, 14, 10, 8);
      ctx.fillStyle = "#fff";
      ctx.fillRect(8, 16, 3, 3); ctx.fillRect(12, 16, 3, 3);
      ctx.fillStyle = "#000";
      ctx.fillRect(9, 17, 2, 2); ctx.fillRect(13, 17, 2, 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(10, 8, 2, 4);
      ctx.fillStyle = f % 2 === 0 ? "#3b82f6" : "#1d4ed8";
      ctx.fillRect(8, 6, 6, 3);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(30, 12, 14, 12);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(32, 14, 10, 8);
      ctx.fillStyle = "#fff";
      ctx.fillRect(33, 16, 3, 3); ctx.fillRect(37, 16, 3, 3);
      ctx.fillStyle = "#000";
      ctx.fillRect(33, 17, 2, 2); ctx.fillRect(37, 17, 2, 2);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(36, 8, 2, 4);
      ctx.fillStyle = f % 2 === 0 ? "#ef4444" : "#b91c1c";
      ctx.fillRect(34, 6, 6, 3);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(20, 14, 2, 2); ctx.fillRect(22, 16, 4, 2); ctx.fillRect(24, 18, 2, 2);
      ctx.fillRect(22, 20, 4, 2);
      ctx.fillRect(18, 18, 2, 4); ctx.fillRect(28, 18, 2, 4);
      ctx.fillStyle = "#555";
      ctx.fillRect(4, 28, 18, 8); ctx.fillRect(26, 34, 18, 8);
      ctx.fillStyle = "#888";
      ctx.font = "bold 4px monospace";
      ctx.fillText("NO U", 7, 33);
      ctx.fillText("NO U!!", 28, 40);
    }
  },
  "AI WRITES A WHITEPAPER": {
    draw: (ctx, f) => {
      ctx.fillStyle = "#eee";
      ctx.fillRect(12, 4, 24, 34);
      ctx.fillStyle = "#ccc";
      ctx.fillRect(30, 4, 6, 6);
      ctx.fillStyle = "#ddd";
      ctx.fillRect(30, 4, 4, 4);
      ctx.fillStyle = "#333";
      ctx.fillRect(16, 10, 16, 2);
      ctx.fillStyle = "#555";
      ctx.fillRect(16, 14, 14, 1); ctx.fillRect(16, 17, 12, 1);
      ctx.fillRect(16, 20, 16, 1); ctx.fillRect(16, 23, 10, 1);
      ctx.fillRect(16, 26, 14, 1); ctx.fillRect(16, 29, 8, 1);
      if (f % 3 < 2) { ctx.fillStyle = "#7c3aed"; ctx.fillRect(26, 29, 3, 2); }
      ctx.fillStyle = "#666";
      ctx.fillRect(34, 24, 8, 3); ctx.fillRect(40, 20, 3, 8);
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(38, 28, 2, 4);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(10, 40, 28, 6);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 5px monospace";
      ctx.fillText("$50M", 16, 45);
    }
  },
};

// ── SPONSORED EVENT IMAGES (use logo instead of pixel sprite) ──
const EVENT_IMAGES: Record<string, string> = {
  "BETR POKER CHAMPION": "/images/Betr-logo.png",
  "BRND MINI APP WINNER": "/images/BRND-logo.png",
  "DAU CO-SPONSOR": "/images/DAU-logo.png",
  "FARCASTER MINI APP": "/images/Farcaster_logo.png",
  "JESSE POLLAK APED IN": "/images/Jesse.png",
  "PIZZA PARTY FOR VETS": "/images/PizzaParty-logo.png",
};

function PixelEventIcon({ eventTitle, animFrame }: { eventTitle: string; animFrame: number }) {
  const imageSrc = EVENT_IMAGES[eventTitle];

  // Render logo image for sponsored events
  if (imageSrc) {
    return (
      <img src={imageSrc} alt={eventTitle} style={{
        width: "72px", height: "72px", objectFit: "contain",
        display: "block", margin: "0 auto 8px",
        border: "2px solid #1a1a2e", borderRadius: "4px",
        background: "#0a0a12", padding: "4px",
      }} />
    );
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, 48, 48);
    const sprite = EVENT_SPRITES[eventTitle];
    if (sprite) {
      sprite.draw(ctx, animFrame);
    } else {
      ctx.fillStyle = "#555";
      ctx.fillRect(16, 16, 16, 16);
      ctx.fillStyle = "#888";
      ctx.fillRect(20, 20, 8, 8);
    }
  }, [eventTitle, animFrame]);
  useEffect(() => { draw(); }, [draw]);
  return (
    <canvas ref={canvasRef} width={48} height={48} style={{
      width: "72px", height: "72px", imageRendering: "pixelated" as const,
      display: "block", margin: "0 auto 8px",
      border: "2px solid #1a1a2e", borderRadius: "4px",
      background: "#0a0a12",
    }} />
  );
}

// ── PIXEL CANVAS COMPONENTS (inlined) ──

function PixelTrailCanvas({ width = 600, height = 120, animFrame, milesTraveled, totalMiles, tombstones, nextLandmarkEmoji, lamboColor = "red" }: {
  width?: number; height?: number; animFrame: number; milesTraveled: number; totalMiles: number;
  tombstones: Array<{ mile: number }>; nextLandmarkEmoji: string; lamboColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = width, H = height;
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, W, H);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    skyGrad.addColorStop(0, "#050510");
    skyGrad.addColorStop(1, "#0a0a1e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.5);
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
            if ((animFrame + bi + ry) % 5 < 2) {
              ctx.fillStyle = "#ffff0033";
              ctx.fillRect(bx + rx * px, by + ry * px, px, px);
            }
          }
        });
      });
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#111122";
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
    const roadY = H * 0.65;
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(0, roadY, W, 20);
    ctx.fillStyle = "#333355";
    ctx.fillRect(0, roadY, W, 1);
    ctx.fillRect(0, roadY + 19, W, 1);
    ctx.fillStyle = "#555533";
    for (let di = 0; di < 30; di++) {
      const dx = ((di * 25 - animFrame * 6 + W * 3) % (W + 50)) - 25;
      ctx.fillRect(dx, roadY + 9, 12, 2);
    }
    const nearTombs = tombstones.filter((t) => t.mile <= milesTraveled && t.mile > milesTraveled - 200);
    nearTombs.forEach((t, i) => {
      const tx = W * 0.1 + (i * W * 0.12);
      const ty = roadY - 12;
      ctx.fillStyle = "#555555";
      ctx.fillRect(tx + 2, ty, 2, 8);
      ctx.fillRect(tx, ty + 2, 6, 2);
      ctx.fillStyle = "#444444";
      ctx.font = "bold 5px monospace";
      ctx.fillText("RIP", tx - 1, ty - 2);
    });
    const colors = LAMBO_COLORS[lamboColor] || LAMBO_COLORS.red;
    const pxSize = 3;
    const lamboX = W * 0.35;
    const lamboY = roadY - LAMBO_SPRITE.length * pxSize + 6;
    const bounce = animFrame % 3 === 0 ? -1 : animFrame % 3 === 1 ? 0 : -1;
    LAMBO_SPRITE.forEach((row, ry) => {
      row.forEach((p, rx) => {
        if (p > 0) {
          ctx.fillStyle = colors[p] || "#ff0000";
          ctx.fillRect(lamboX + rx * pxSize, lamboY + ry * pxSize + bounce, pxSize, pxSize);
        }
      });
    });
    for (let ei = 0; ei < 4; ei++) {
      const ex = lamboX - 8 - ei * 6 - ((animFrame * 3 + ei * 7) % 20);
      const ey = lamboY + LAMBO_SPRITE.length * pxSize * 0.6 + bounce + Math.sin(animFrame + ei) * 2;
      ctx.globalAlpha = 0.3 - ei * 0.07;
      ctx.fillStyle = "#aaaaaa";
      ctx.fillRect(ex, ey, 3 - (ei > 1 ? 1 : 0), 2);
    }
    ctx.globalAlpha = 1;
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
    ctx.font = "16px serif";
    ctx.globalAlpha = 0.25 + Math.sin(animFrame * 0.3) * 0.1;
    ctx.fillText(nextLandmarkEmoji, W * 0.85, roadY - 2);
    ctx.globalAlpha = 1;
    const barY = H - 8;
    ctx.fillStyle = "#111133";
    ctx.fillRect(10, barY, W - 20, 4);
    const pct = milesTraveled / totalMiles;
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(10, barY, (W - 20) * pct, 4);
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(10 + (W - 20) * pct - 2, barY - 1, 4, 6);
  }, [width, height, animFrame, milesTraveled, totalMiles, tombstones, nextLandmarkEmoji, lamboColor]);
  useEffect(() => { draw(); }, [draw]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "auto", imageRendering: "pixelated" as const, borderRadius: "8px", border: "2px solid #1a1a2e" }} />;
}

function PixelTitleCanvas({ width = 500, height = 140, animFrame }: { width?: number; height?: number; animFrame: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = width, H = height;
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137 + 23) % W;
      const sy = (i * 89 + 11) % (H * 0.5);
      const twinkle = (animFrame + i * 3) % 6;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = twinkle < 2 ? 0.8 : twinkle < 4 ? 0.3 : 0.6;
      ctx.fillRect(sx, sy, twinkle === 0 ? 2 : 1, twinkle === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
    const scroll = (animFrame * 3) % W;
    for (let bi = 0; bi < 15; bi++) {
      const bx = ((bi * 40 - scroll + W * 2) % (W + 80)) - 40;
      const bh = 15 + (bi * 7) % 30;
      const by = H * 0.55 - bh;
      ctx.fillStyle = `hsl(${240 + bi * 5}, 30%, ${8 + (bi % 3) * 3}%)`;
      ctx.fillRect(bx, by, 20, bh);
      for (let wy = 0; wy < bh - 4; wy += 5) {
        for (let wx = 2; wx < 18; wx += 6) {
          ctx.fillStyle = (animFrame + bi + wy) % 7 < 3 ? "#ffff0044" : "#00000000";
          ctx.fillRect(bx + wx, by + wy + 2, 3, 3);
        }
      }
    }
    ctx.fillStyle = "#0a0a18";
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
    const roadY = H * 0.65;
    ctx.fillStyle = "#15152a";
    ctx.fillRect(0, roadY, W, 24);
    ctx.fillStyle = "#222244";
    ctx.fillRect(0, roadY, W, 1);
    ctx.fillRect(0, roadY + 23, W, 1);
    ctx.fillStyle = "#444422";
    for (let di = 0; di < 30; di++) {
      const dx = ((di * 25 - animFrame * 8 + W * 3) % (W + 50)) - 25;
      ctx.fillRect(dx, roadY + 11, 12, 2);
    }
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
    for (let ei = 0; ei < 5; ei++) {
      const ex = lamboX - 6 - ei * 5 - ((animFrame * 4 + ei * 5) % 15);
      const ey = lamboYPos + 20 + bounce + Math.sin(animFrame * 0.5 + ei) * 2;
      ctx.globalAlpha = 0.25 - ei * 0.04;
      ctx.fillStyle = "#aaaaaa";
      ctx.fillRect(ex, ey, 3, 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(lamboX, roadY + 10, LAMBO_SPRITE[0].length * pxSize, 14);
    ctx.globalAlpha = 1;
  }, [width, height, animFrame]);
  useEffect(() => { draw(); }, [draw]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "auto", imageRendering: "pixelated" as const, borderRadius: "8px", border: "2px solid #1a1a2e" }} />;
}

function PixelEventCanvas({ width = 400, height = 100, animFrame, eventType }: { width?: number; height?: number; animFrame: number; eventType: "good" | "bad" | "neutral" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = width, H = height, f = animFrame;
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    if (eventType === "good") {
      // LAYER 1: Pulsing radial gradient burst
      const pulseR = 40 + Math.sin(f * 0.4) * 20;
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, pulseR);
      grad.addColorStop(0, f % 6 < 3 ? "#10b98130" : "#ffd70025");
      grad.addColorStop(0.5, "#10b98110");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // LAYER 2: Gold coin rain
      for (let i = 0; i < 20; i++) {
        const cx = (i * 23 + f * 4) % (W + 40) - 20;
        const cy = ((f * 3 + i * 31) % (H + 30)) - 15;
        const sz = 3 + (i % 3);
        const bright = (f + i) % 5;
        ctx.fillStyle = bright < 2 ? "#ffd700" : bright < 4 ? "#ffaa00" : "#fff5cc";
        ctx.globalAlpha = 0.7 - (i % 5) * 0.08;
        ctx.fillRect(cx, cy, sz, sz);
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = bright === 0 ? 0.8 : 0.15;
        ctx.fillRect(cx, cy, 1, 1);
      }
      ctx.globalAlpha = 1;

      // LAYER 3: Rising diamond sparkles
      for (let i = 0; i < 16; i++) {
        const cx = (i * 27 + 15) % W;
        const cy = H - ((f * 4 + i * 18) % (H + 30));
        const colors = ["#ffd700", "#10b981", "#06b6d4", "#fff", "#a855f7", "#22d3ee"];
        ctx.fillStyle = colors[(f + i) % colors.length];
        ctx.globalAlpha = 0.5 + Math.sin(f * 0.6 + i) * 0.3;
        const s = 2 + (i % 2);
        ctx.fillRect(cx, cy - s, s, s);
        ctx.fillRect(cx - s, cy, s, s);
        ctx.fillRect(cx + s, cy, s, s);
        ctx.fillRect(cx, cy + s, s, s);
        ctx.fillRect(cx, cy, s, s);
        if (i % 3 === 0) {
          ctx.fillRect(cx - s * 2, cy, s, s);
          ctx.fillRect(cx + s * 2, cy, s, s);
          ctx.fillRect(cx, cy - s * 2, s, s);
          ctx.fillRect(cx, cy + s * 2, s, s);
        }
      }
      ctx.globalAlpha = 1;

      // LAYER 4: Horizontal energy wave
      for (let x = 0; x < W; x += 2) {
        const wave1 = Math.sin(x * 0.025 + f * 0.5) * 12 + H * 0.35;
        const wave2 = Math.sin(x * 0.018 + f * 0.3 + 2) * 15 + H * 0.65;
        ctx.fillStyle = "#10b981";
        ctx.globalAlpha = 0.35 + Math.sin(x * 0.01 + f * 0.2) * 0.15;
        ctx.fillRect(x, wave1, 3, 4);
        ctx.fillStyle = "#ffd700";
        ctx.globalAlpha = 0.25 + Math.sin(x * 0.015 + f * 0.25) * 0.1;
        ctx.fillRect(x, wave2, 3, 3);
      }
      ctx.globalAlpha = 1;

      // LAYER 5: Starburst flashes
      if (f % 8 < 3) {
        const sx = (f * 37) % W, sy = (f * 23) % H;
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.6;
        for (let d = 0; d < 8; d++) {
          const angle = d * Math.PI / 4;
          const len = 6 + (f % 3) * 2;
          ctx.fillRect(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len, 2, 2);
          ctx.fillRect(sx + Math.cos(angle) * (len / 2), sy + Math.sin(angle) * (len / 2), 2, 2);
        }
        ctx.globalAlpha = 1;
      }

      // LAYER 6: Floating ETH symbols
      for (let i = 0; i < 6; i++) {
        const ex = 20 + i * 65, ey = H - ((f * 2 + i * 25) % (H + 10));
        ctx.fillStyle = "#7c3aed";
        ctx.globalAlpha = 0.3 + (i % 3) * 0.1;
        ctx.fillRect(ex + 2, ey, 2, 2);
        ctx.fillRect(ex, ey + 2, 6, 2);
        ctx.fillRect(ex + 2, ey + 4, 2, 2);
      }
      ctx.globalAlpha = 1;

    } else if (eventType === "bad") {
      // LAYER 1: Aggressive red flash strobe
      const flashIntensity = f % 6 < 2 ? 0.15 : f % 6 < 4 ? 0.05 : 0.1;
      ctx.fillStyle = "#ff0000";
      ctx.globalAlpha = flashIntensity;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      // LAYER 2: Heavy glitch scanlines
      for (let i = 0; i < 16; i++) {
        const gy = ((f * 9 + i * 19) % H);
        const gw = 30 + (i * 17 + f * 5) % 100;
        const gx = (i * 37 + f * 7) % W;
        const colors = ["#ff0000", "#ff2222", "#ff4444", "#cc0000", "#ff000088"];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.3 + (i % 3) * 0.15;
        ctx.fillRect(gx, gy, gw, 2 + (i % 2));
        ctx.globalAlpha = 0.15;
        ctx.fillRect(gx + (f % 2 === 0 ? 4 : -4), gy + 3, gw * 0.7, 1);
      }
      ctx.globalAlpha = 1;

      // LAYER 3: Falling debris / shrapnel
      for (let i = 0; i < 14; i++) {
        const dx = (i * 31 + f * 5) % W;
        const dy = ((f * 5 + i * 23) % (H + 20)) - 10;
        const sz = 2 + (i % 3);
        ctx.fillStyle = i % 3 === 0 ? "#ff4444" : i % 3 === 1 ? "#ff6b00" : "#ffaa00";
        ctx.globalAlpha = 0.5 + Math.sin(f + i) * 0.2;
        ctx.fillRect(dx, dy, sz, sz);
        ctx.globalAlpha = 0.2;
        ctx.fillRect(dx - 1, dy - 3, sz - 1, 3);
      }
      ctx.globalAlpha = 1;

      // LAYER 4: Chromatic aberration
      ctx.fillStyle = "#ff000018";
      ctx.fillRect(f % 2 === 0 ? 2 : -2, 0, W, H);
      ctx.fillStyle = "#0000ff10";
      ctx.fillRect(f % 2 === 0 ? -2 : 2, 0, W, H);

      // LAYER 5: Skull warning symbols
      for (let i = 0; i < 4; i++) {
        const sx = 40 + i * 90, sy = 10 + ((f * 3 + i * 20) % 30);
        ctx.fillStyle = "#ff4444";
        ctx.globalAlpha = 0.2 + Math.sin(f * 0.8 + i) * 0.15;
        ctx.fillRect(sx, sy, 8, 6);
        ctx.fillRect(sx + 1, sy + 6, 6, 2);
        ctx.fillStyle = "#050508";
        ctx.fillRect(sx + 1, sy + 2, 2, 2);
        ctx.fillRect(sx + 5, sy + 2, 2, 2);
        ctx.fillRect(sx + 3, sy + 4, 2, 1);
      }
      ctx.globalAlpha = 1;

      // LAYER 6: Explosion shockwave rings
      const ringR = (f * 4) % 60;
      ctx.strokeStyle = "#ef4444";
      ctx.globalAlpha = Math.max(0, 0.5 - ringR / 60);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, ringR * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // LAYER 7: Static noise
      for (let i = 0; i < 40; i++) {
        const nx = ((f * 13 + i * 53) * 7919) % W;
        const ny = ((f * 7 + i * 41) * 6271) % H;
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.03 + (i % 5) * 0.01;
        ctx.fillRect(nx, ny, 2, 2);
      }
      ctx.globalAlpha = 1;

    } else {
      // NEUTRAL: Digital data stream / Matrix-style

      // LAYER 1: Background circuit pattern
      ctx.fillStyle = "#f59e0b08";
      for (let x = 0; x < W; x += 20) { ctx.fillRect(x, 0, 1, H); }
      for (let y = 0; y < H; y += 20) { ctx.fillRect(0, y, W, 1); }

      // LAYER 2: Falling data columns
      for (let i = 0; i < 25; i++) {
        const col = (i * 17 + 8) % W;
        for (let j = 0; j < 8; j++) {
          const row = ((f * 3 + i * 13 + j * 11) % (H + 20)) - 10;
          const colors = ["#f59e0b", "#ffcc00", "#ffd700", "#f5a623", "#e8960a"];
          ctx.fillStyle = colors[(i + j) % colors.length];
          ctx.globalAlpha = 0.3 - j * 0.03;
          ctx.fillRect(col, row, 2, 3);
        }
      }
      ctx.globalAlpha = 1;

      // LAYER 3: Horizontal scan beam
      const scanY1 = (f * 4) % (H + 20) - 10;
      ctx.fillStyle = "#f59e0b";
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, scanY1, W, 3);
      ctx.globalAlpha = 0.08;
      ctx.fillRect(0, scanY1 - 5, W, 15);
      ctx.globalAlpha = 1;

      // LAYER 4: Data nodes with connections
      for (let i = 0; i < 8; i++) {
        const nx = 30 + (i * 47 + f * 2) % (W - 60);
        const ny = 15 + (i * 23) % (H - 30);
        ctx.fillStyle = "#f59e0b";
        ctx.globalAlpha = 0.4 + Math.sin(f * 0.3 + i) * 0.2;
        ctx.fillRect(nx - 2, ny - 2, 4, 4);
        if (i < 7) {
          const nx2 = 30 + ((i + 1) * 47 + f * 2) % (W - 60);
          const ny2 = 15 + ((i + 1) * 23) % (H - 30);
          ctx.globalAlpha = 0.1;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx2, ny2);
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // LAYER 5: Hex text
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 6px monospace";
      ctx.globalAlpha = 0.12;
      const hexChars = "0123456789ABCDEF";
      for (let i = 0; i < 12; i++) {
        const hx = (i * 35 + f * 2) % W;
        const hy = ((f * 2 + i * 19) % (H + 10)) - 5;
        const ch = hexChars[(f + i * 3) % 16] + hexChars[(f + i * 7) % 16];
        ctx.fillText(ch, hx, hy);
      }
      ctx.globalAlpha = 1;
    }

    const glowColor = eventType === "good" ? "#10b981" : eventType === "bad" ? "#ef4444" : "#f59e0b";
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.3 + Math.sin(f * 0.5) * 0.15;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.globalAlpha = 1;
  }, [width, height, animFrame, eventType]);
  useEffect(() => { draw(); }, [draw]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "auto", imageRendering: "pixelated" as const, borderRadius: "8px" }} />;
}

function PixelBridgeCanvas({ width = 400, height = 120, animFrame }: { width?: number; height?: number; animFrame: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = width, H = height;
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, W, H);
    const bridgeY = H * 0.5;
    ctx.strokeStyle = "#333355";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const cx = i * (W / 7);
      ctx.beginPath();
      ctx.moveTo(cx, bridgeY - 20);
      ctx.lineTo(cx, bridgeY);
      ctx.stroke();
    }
    ctx.fillStyle = "#222244";
    ctx.fillRect(0, bridgeY, W, 8);
    ctx.fillStyle = "#333366";
    ctx.fillRect(W * 0.15, bridgeY - 30, 8, 38);
    ctx.fillRect(W * 0.85 - 8, bridgeY - 30, 8, 38);
    for (let i = 0; i < 10; i++) {
      const px = ((animFrame * 4 + i * 40) % (W + 20)) - 10;
      const py = bridgeY - 3 + Math.sin(px * 0.05 + i) * 2;
      ctx.fillStyle = (animFrame + i) % 3 === 0 ? "#06b6d4" : "#7c3aed";
      ctx.globalAlpha = 0.6;
      ctx.fillRect(px, py, 3, 3);
    }
    ctx.globalAlpha = 1;
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
    for (let x = 0; x < W; x += 4) {
      const wy = bridgeY + 12 + Math.sin(x * 0.03 + animFrame * 0.2) * 3;
      ctx.fillStyle = "#06b6d4";
      ctx.globalAlpha = 0.08;
      ctx.fillRect(x, wy, 4, 2);
    }
    ctx.globalAlpha = 1;
  }, [width, height, animFrame]);
  useEffect(() => { draw(); }, [draw]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "auto", imageRendering: "pixelated" as const, borderRadius: "8px", border: "2px solid #1a1a2e" }} />;
}

// ── GAME DATA ──────────────────────────────────────────────────

const LANDMARKS = [
  { name: "Genesis Block", miles: 0, type: "start", emoji: "🏁", description: "Your journey into Web3 begins here. An AI agent helped you set up your wallet in 3 seconds." },
  { name: "Ethereum Mainnet", miles: 80, type: "dex", emoji: "⟠", description: "The OG chain. Half the validators are now AI nodes. Gas fees are still insane." },
  { name: "Uniswap Pools", miles: 160, type: "dex", emoji: "🦄", description: "A vast ocean of liquidity pools. AI market makers dominate every pair." },
  { name: "The Bridge", miles: 250, type: "bridge", emoji: "🌉", description: "A rickety cross-chain bridge. An AI auditor says it's safe. Do you trust it?" },
  { name: "Base Layer 2", miles: 340, type: "dex", emoji: "🔵", description: "Coinbase's promised land. AI-powered apps everywhere. Cheap gas, blue chip vibes." },
  { name: "AI Agent Hub", miles: 430, type: "hub", emoji: "🤖", description: "A sprawling marketplace of autonomous AI agents trading, coding, and shitposting 24/7." },
  { name: "Farcaster Hub", miles: 520, type: "dex", emoji: "📡", description: "The decentralized social frontier. Half the casts are from AI bots. The good half." },
  { name: "The Neural Network", miles: 610, type: "hub", emoji: "🧠", description: "A sentient DeFi protocol that optimizes yields using machine learning. It whispers alpha." },
  { name: "DeFi Yield Farms", miles: 710, type: "dex", emoji: "🌾", description: "AI-managed yield farms promising 10,000% APY. The AI says trust me bro." },
  { name: "The Mempool", miles: 800, type: "bridge", emoji: "🌀", description: "Unconfirmed transactions swirl in chaos. AI MEV bots are fighting each other for your scraps." },
  { name: "Mainnet (The Promised Chain)", miles: 900, type: "end", emoji: "⛓️", description: "You've made it. Your protocol is deployed. Not even AI could stop you. You're gonna make it." },
];

const CLASSES = [
  { id: "dev", name: "Solidity Developer", emoji: "👨‍💻", bonus: "AI audits cost 50% less", startETH: 800, startStables: 400, startTokens: 200 },
  { id: "trader", name: "Degen Trader", emoji: "📈", bonus: "Trading gains +30%", startETH: 1200, startStables: 200, startTokens: 100 },
  { id: "influencer", name: "CT Influencer", emoji: "🐦", bonus: "Party morale decays 50% slower", startETH: 600, startStables: 600, startTokens: 300 },
  { id: "vc", name: "Crypto VC", emoji: "💼", bonus: "Start with more capital", startETH: 2000, startStables: 300, startTokens: 50 },
];

const PARTY_NAMES = [
  "Vitalik Jr.", "Based Chad", "Ser Moonboy", "Anon Dev", "DeFi Degen",
  "NFT Maxi", "Whale Watcher", "Paper Hands Pete", "Diamond Dana", "Rug Inspector",
  "Gas Guzzler", "Airdrop Andy", "Yield Farmer Yuki", "Bridge Bandit", "Meme Lord",
  "Claude Bot", "GPT Intern", "Agent 0x42", "AI Overlord", "Prompt Engineer Pat",
  "Skynet Steve", "Neural Nate", "Bot or Not", "Deepfake Dave", "Sentient Sam",
];

const AFFLICTIONS = [
  { name: "Impermanent Loss", severity: 2, emoji: "📉" },
  { name: "Rug Pull PTSD", severity: 3, emoji: "🧶" },
  { name: "Gas Fee Fever", severity: 1, emoji: "⛽" },
  { name: "Seed Phrase Amnesia", severity: 4, emoji: "🧠" },
  { name: "Flash Loan Shock", severity: 3, emoji: "⚡" },
  { name: "Bear Market Depression", severity: 2, emoji: "🐻" },
  { name: "FOMO Infection", severity: 1, emoji: "😰" },
  { name: "Governance Fatigue", severity: 1, emoji: "😴" },
  { name: "MEV Poisoning", severity: 3, emoji: "🤖" },
  { name: "Overleverage Syndrome", severity: 4, emoji: "💀" },
  { name: "AI Hallucination Virus", severity: 3, emoji: "👁️" },
  { name: "Prompt Injection Flu", severity: 2, emoji: "💉" },
  { name: "Replaced-by-Bot Anxiety", severity: 2, emoji: "😱" },
  { name: "AI Agent Dependency", severity: 1, emoji: "🫠" },
  { name: "Sentient Contract Paranoia", severity: 3, emoji: "🫥" },
  { name: "Deepfake Identity Crisis", severity: 4, emoji: "🎭" },
];

const DEATH_MESSAGES = [
  "got rugged into oblivion",
  "lost their seed phrase forever",
  "was liquidated on a 100x leverage position",
  "bridged to a fake chain and vanished",
  "approved an unlimited token spend to a drainer",
  "got phished by a fake MetaMask popup",
  "was frontrun into bankruptcy",
  "held a memecoin to zero",
  "sent ETH to the wrong address",
  "was exit scammed by an anon dev",
  "was replaced by an AI agent that traded better",
  "trusted an AI auditor that hallucinated the code was safe",
  "got deepfaked into sending their keys to a bot",
  "argued with a sentient smart contract and lost",
  "was outperformed by GPT-7 and gave up on life",
  "let an AI agent manage their portfolio. It went to zero.",
  "got prompt-injected into approving a drain transaction",
  "was convinced by an AI influencer to buy a rug",
  "had their job, their trade, and their identity stolen by bots",
];

interface GameState {
  eth: number;
  stables: number;
  tokens: number;
  morale: number;
}

const TRAIL_EVENTS = [
  { type: "good" as const, title: "AIRDROP!", message: "A mysterious protocol just dropped tokens to your wallet!", effect: (g: GameState) => ({ ...g, tokens: g.tokens + 150 + Math.floor(Math.random() * 200) }) },
  { type: "good" as const, title: "PUMP!", message: "Your memecoin bags just 10x'd! You sell the top like a chad.", effect: (g: GameState) => ({ ...g, eth: g.eth + 300 + Math.floor(Math.random() * 400) }) },
  { type: "good" as const, title: "BASED MOMENT", message: "Vitalik liked your cast on Farcaster. Clout level: MAXIMUM.", effect: (g: GameState) => ({ ...g, morale: Math.min(100, g.morale + 25) }) },
  { type: "good" as const, title: "NFT FLIP", message: "You minted a free NFT that someone bought for 5 ETH!", effect: (g: GameState) => ({ ...g, eth: g.eth + 500 }) },
  { type: "good" as const, title: "BUG BOUNTY", message: "Found a critical vulnerability. The protocol paid you handsomely.", effect: (g: GameState) => ({ ...g, eth: g.eth + 400, stables: g.stables + 200 }) },
  { type: "good" as const, title: "FARCASTER FREN", message: "A whale on Farcaster shared your mini app. Users flooding in!", effect: (g: GameState) => ({ ...g, morale: Math.min(100, g.morale + 20), tokens: g.tokens + 100 }) },
  { type: "good" as const, title: "YIELD HARVEST", message: "Your DeFi farming position just paid out a fat yield.", effect: (g: GameState) => ({ ...g, stables: g.stables + 250 }) },
  { type: "good" as const, title: "AI AGENT ALPHA", message: "Your AI trading agent found a mispriced token. It 5x'd overnight.", effect: (g: GameState) => ({ ...g, eth: g.eth + 500, morale: Math.min(100, g.morale + 10) }) },
  { type: "good" as const, title: "AI AUDIT SAVES YOU", message: "Your AI auditor flagged a critical exploit. Funds saved!", effect: (g: GameState) => ({ ...g, morale: Math.min(100, g.morale + 20) }) },
  { type: "good" as const, title: "AI DEV SPEEDRUN", message: "Claude wrote your entire smart contract in 30 seconds. Deployed to Base.", effect: (g: GameState) => ({ ...g, eth: g.eth + 300, tokens: g.tokens + 150 }) },
  { type: "good" as const, title: "AI ART SELLS", message: "An AI generated your NFT collection. A collector bought the floor for 3 ETH.", effect: (g: GameState) => ({ ...g, eth: g.eth + 300 }) },
  { type: "good" as const, title: "GPT PREDICTS THE DIP", message: "Your fine-tuned model predicted the exact bottom. You bought. It pumped 8x.", effect: (g: GameState) => ({ ...g, eth: g.eth + 600 }) },
  { type: "good" as const, title: "BETR POKER CHAMPION", message: "You entered the BETR Poker tournament and crushed the final table. You walk away with 2,500 Betrmint!", effect: (g: GameState) => ({ ...g, tokens: g.tokens + 250, morale: Math.min(100, g.morale + 15) }) },
  { type: "good" as const, title: "BRND MINI APP WINNER", message: "Your mini app beat out all the competition and placed 1st in BRND rankings! You earn 40,000 BRND tokens!", effect: (g: GameState) => ({ ...g, tokens: g.tokens + 400, morale: Math.min(100, g.morale + 20) }) },
  { type: "good" as const, title: "DAU CO-SPONSOR", message: "DAU came in and co-sponsored your project! They believe in your vision and back you with 1,000 DAU.", effect: (g: GameState) => ({ ...g, stables: g.stables + 300, morale: Math.min(100, g.morale + 15) }) },
  { type: "good" as const, title: "FARCASTER MINI APP", message: "Your mini app placed 1st on Farcaster! The community loves it. You earn $50 USDC in rewards!", effect: (g: GameState) => ({ ...g, stables: g.stables + 250, morale: Math.min(100, g.morale + 20) }) },
  { type: "good" as const, title: "JESSE POLLAK APED IN", message: "Jesse Pollak saw your project and aped in! You just got an investment of 5 ETH. Based.", effect: (g: GameState) => ({ ...g, eth: g.eth + 500, morale: Math.min(100, g.morale + 25) }) },
  { type: "good" as const, title: "PIZZA PARTY FOR VETS", message: "You fed the local homeless veterans with some pizza. Your whole crew feels accomplished and recharged.", effect: (g: GameState) => ({ ...g, morale: Math.min(100, g.morale + 20) }) },
  { type: "bad" as const, title: "RUG PULL!", message: "The dev team deleted their Twitter and drained the LP. Classic.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, g.eth - 300 - Math.floor(Math.random() * 200)), morale: Math.max(0, g.morale - 20) }) },
  { type: "bad" as const, title: "GAS SPIKE!", message: "Gas fees are 500 gwei. Your transaction cost more than your rent.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, g.eth - 200) }) },
  { type: "bad" as const, title: "BEAR MARKET", message: "Everything is down 40%. CT is dead. Even the AI bots stopped trading.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, Math.floor(g.eth * 0.7)), morale: Math.max(0, g.morale - 15) }) },
  { type: "bad" as const, title: "WALLET DRAINED!", message: "You signed a malicious transaction. Wallet drained.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, g.eth - 400), stables: Math.max(0, g.stables - 200) }) },
  { type: "bad" as const, title: "LIQUIDATED", message: "Your leveraged position got rekt. The cascade was brutal.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, Math.floor(g.eth * 0.5)), morale: Math.max(0, g.morale - 25) }) },
  { type: "bad" as const, title: "AI BOT GONE ROGUE", message: "Your autonomous trading bot longed the top and shorted the bottom.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, g.eth - 400), morale: Math.max(0, g.morale - 20) }) },
  { type: "bad" as const, title: "PROMPT INJECTION ATTACK", message: "A hacker prompt-injected your AI agent into approving a token drain.", effect: (g: GameState) => ({ ...g, stables: Math.max(0, g.stables - 350), morale: Math.max(0, g.morale - 15) }) },
  { type: "bad" as const, title: "DEEPFAKE SCAM", message: "A deepfake of Vitalik told you to send ETH to a 'new L2 genesis address.'", effect: (g: GameState) => ({ ...g, eth: Math.max(0, g.eth - 300) }) },
  { type: "bad" as const, title: "AI HALLUCINATION", message: "Your AI auditor said the contract was safe. It hallucinated.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, g.eth - 350), stables: Math.max(0, g.stables - 150) }) },
  { type: "bad" as const, title: "AI FLASH CRASH", message: "Thousands of AI trading agents panic-sold. Market flash-crashed 60%.", effect: (g: GameState) => ({ ...g, eth: Math.max(0, Math.floor(g.eth * 0.5)), morale: Math.max(0, g.morale - 20) }) },
  { type: "neutral" as const, title: "CHAIN FORK", message: "The blockchain has forked! One side is pro-AI, the other anti-AI.", effect: (g: GameState) => ({ ...g }) },
  { type: "neutral" as const, title: "GOVERNANCE VOTE", message: "A DAO proposal: 'Should we let AI agents vote on governance?'", effect: (g: GameState) => ({ ...g, tokens: g.tokens + 50 }) },
  { type: "neutral" as const, title: "CT DRAMA", message: "A famous CT account was revealed to be an AI bot all along.", effect: (g: GameState) => ({ ...g, morale: Math.min(100, g.morale + 5) }) },
  { type: "neutral" as const, title: "BOT VS BOT", message: "Two AI agents are arguing in a Farcaster thread. 847 replies deep.", effect: (g: GameState) => ({ ...g, morale: Math.min(100, g.morale + 10) }) },
  { type: "neutral" as const, title: "AI WRITES A WHITEPAPER", message: "An AI wrote a 40-page whitepaper for a new L3. It raises $50M.", effect: (g: GameState) => ({ ...g, tokens: g.tokens + 100 }) },
];

const BRIDGE_EVENTS = [
  { title: "Smooth Bridge", message: "Your tokens crossed safely. An AI validator confirmed it.", outcome: "safe" as const },
  { title: "Stuck in Bridge", message: "Your transaction is stuck. 7-day wait.", outcome: "delay" as const, penalty: 3 },
  { title: "Bridge Tax", message: "The bridge's AI fee optimizer decided you should pay extra.", outcome: "fee" as const },
  { title: "BRIDGE EXPLOIT!", message: "An AI found a zero-day while your tokens were in transit!", outcome: "exploit" as const },
];

const TRADE_TOKENS = [
  { name: "$DEGEN", volatility: 0.8, emoji: "🎰" },
  { name: "$PEPE", volatility: 0.9, emoji: "🐸" },
  { name: "$BRETT", volatility: 0.7, emoji: "🔵" },
  { name: "$HIGHER", volatility: 0.6, emoji: "⬆️" },
  { name: "$FARCAST", volatility: 0.5, emoji: "📡" },
  { name: "$RUG", volatility: 1.0, emoji: "🧶" },
  { name: "$CLAUDE", volatility: 0.7, emoji: "🤖" },
  { name: "$GPT", volatility: 0.85, emoji: "🧠" },
  { name: "$SKYNET", volatility: 1.0, emoji: "👁️" },
  { name: "$AGENT", volatility: 0.6, emoji: "🕵️" },
  { name: "$SENTIENT", volatility: 0.95, emoji: "🫥" },
];

const EPITAPHS = [
  "Here lies {name}. They bought the top.",
  "RIP {name}. They never backed up their seed phrase.",
  "In memory of {name}. Diamond hands to the grave.",
  "{name} -- NGMI, but at least they tried.",
  "Here lies {name}. Replaced by an AI agent.",
  "RIP {name}. They asked Claude to manage their portfolio.",
  "{name} -- trusted the AI auditor. The AI was wrong.",
  "Here lies {name}. A deepfake stole their identity and their ETH.",
];

// ── NFT DATA ──────────────────────────────────────────────────

const NFT_PALETTES: Record<string, {
  neon1: string; neon2: string; frame: string; glow: string;
  sprite: string;
}> = {
  legendary: { neon1: "#ffd700", neon2: "#ff6b00", frame: "#ffd700", glow: "#ffd70060", sprite: "/images/nft/legendary.png" },
  epic:      { neon1: "#bf5af2", neon2: "#ff2d55", frame: "#a855f7", glow: "#bf5af260", sprite: "/images/nft/epic.png" },
  rare:      { neon1: "#00d4ff", neon2: "#0088ff", frame: "#06b6d4", glow: "#00d4ff50", sprite: "/images/nft/rare.png" },
  common:    { neon1: "#00ff88", neon2: "#00cc66", frame: "#555",    glow: "#00ff8840", sprite: "/images/nft/common.png" },
};

const DEATH_PALETTE = { neon1: "#ef4444", neon2: "#991111", frame: "#ef4444", glow: "#ef444460", sprite: "/images/nft/death.png" };

// ── HELPER FUNCTIONS ───────────────────────────────────────────

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function getMarketCondition(day: number) {
  const cycle = Math.sin(day * 0.05) * 0.5 + 0.5;
  if (cycle > 0.7) return { name: "Bull Market", emoji: "🐂", color: "#00ff88", modifier: 1.3 };
  if (cycle < 0.3) return { name: "Bear Market", emoji: "🐻", color: "#ff4444", modifier: 0.7 };
  return { name: "Crab Market", emoji: "🦀", color: "#ffaa00", modifier: 1.0 };
}

function hashStats(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function getRarityTier(score: number) {
  if (score >= 6000) return "legendary";
  if (score >= 4000) return "epic";
  if (score >= 2000) return "rare";
  return "common";
}

const TIER_COLORS: Record<string, string> = {
  legendary: "#ffd700",
  epic: "#a855f7",
  rare: "#06b6d4",
  common: "#10b981",
  dead: "#ef4444",
};

const TIER_LABELS: Record<string, string> = {
  legendary: "LEGENDARY",
  epic: "EPIC",
  rare: "RARE",
  common: "COMMON",
  dead: "DEAD",
};

// Load an image from a URL and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateNFTImage(gameData: {
  classId: string;
  score: number;
  survivors: number;
  totalParty: number;
  days: number;
  eth: number;
  stables: number;
  tokens: number;
  morale: number;
  partyNames: string[];
  tombstones: string[];
  playerClass: { name: string } | null;
}): Promise<string> {
  const { classId, score, survivors, totalParty, days, eth, stables, tokens, morale, partyNames, playerClass } = gameData;
  const canvas = document.createElement("canvas");
  const W = 400, H = 400;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const rarity = getRarityTier(score);
  const pal = NFT_PALETTES[rarity];
  const seed = hashStats(`${classId}-${score}-${survivors}-${days}-${partyNames.join("")}`);
  const aliveParty = partyNames.filter((_, i) => i < survivors);

  const px = (x: number, y: number, w: number, h: number, c: string, a = 1) => {
    ctx.globalAlpha = a; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
  };

  // ── LOAD AI-GENERATED CHARACTER SPRITE ──
  const spriteImg = await loadImage(pal.sprite);

  // ── DRAW SPRITE (full canvas, the image already has VICTORY text + character) ──
  ctx.drawImage(spriteImg, 0, 0, W, H);

  // ── STATS OVERLAY AT BOTTOM ──
  // Semi-transparent dark panel covering bottom portion
  const panelH = 120;
  const panelY = H - panelH;
  // Gradient fade from transparent to dark
  const fadeGrad = ctx.createLinearGradient(0, panelY - 30, 0, panelY + 10);
  fadeGrad.addColorStop(0, "rgba(0,0,0,0)");
  fadeGrad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, panelY - 30, W, 40);
  px(0, panelY, W, panelH, "#000", 0.85);

  // Top neon line
  px(8, panelY, W - 16, 2, pal.neon1, 0.8);
  // Corner brackets
  const cb = 12;
  px(8, panelY, cb, 2, pal.neon1, 1); px(8, panelY, 2, cb, pal.neon1, 1);
  px(W - 8 - cb, panelY, cb, 2, pal.neon1, 1); px(W - 10, panelY, 2, cb, pal.neon1, 1);
  px(8, H - 2, cb, 2, pal.neon1, 0.5); px(8, H - cb, 2, cb, pal.neon1, 0.5);
  px(W - 8 - cb, H - 2, cb, 2, pal.neon1, 0.5); px(W - 10, H - cb, 2, cb, pal.neon1, 0.5);

  // ── RARITY BADGE ──
  ctx.textAlign = "center";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = pal.neon1;
  ctx.fillText(`[ ${rarity.toUpperCase()} ]`, W / 2, panelY + 16);

  // ── CLASS NAME ──
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillStyle = pal.neon2;
  ctx.fillText(playerClass?.name?.toUpperCase() || classId.toUpperCase(), W / 2, panelY + 30);

  // ── SCORE (big and bold) ──
  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.fillStyle = "#fff";
  ctx.fillText(`SCORE: ${score.toLocaleString()}`, W / 2, panelY + 55);

  // ── STATS GRID ──
  const sX = 20, sX2 = W / 2 + 10;
  let sY = panelY + 72;
  ctx.textAlign = "left";
  ctx.font = "bold 11px 'Courier New', monospace";

  ctx.fillStyle = pal.neon1; ctx.fillText(`Survivors: ${survivors}/${totalParty}`, sX, sY);
  ctx.fillStyle = pal.neon1; ctx.fillText(`Days: ${days}`, sX2, sY);
  sY += 14;
  ctx.fillStyle = "#8899bb"; ctx.fillText(`ETH: ${eth}`, sX, sY);
  ctx.fillStyle = "#8899bb"; ctx.fillText(`USDC: ${stables}`, sX2, sY);
  sY += 14;
  ctx.fillStyle = "#8899bb"; ctx.fillText(`Tokens: ${tokens}`, sX, sY);
  ctx.fillStyle = "#8899bb"; ctx.fillText(`Morale: ${morale}`, sX2, sY);
  sY += 14;

  // ── PARTY NAMES ──
  ctx.fillStyle = pal.neon1; ctx.font = "bold 9px 'Courier New', monospace";
  ctx.textAlign = "center";
  const nameStr = aliveParty.join(" • ");
  ctx.fillText(nameStr.length > 52 ? nameStr.slice(0, 49) + "..." : nameStr, W / 2, sY);

  // ── NEON FRAME ──
  const fw = rarity === "legendary" ? 3 : rarity === "epic" ? 2 : 1;
  ctx.strokeStyle = pal.glow; ctx.lineWidth = fw + 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.strokeStyle = pal.frame; ctx.lineWidth = fw;
  ctx.strokeRect(fw, fw, W - fw * 2, H - fw * 2);

  if (rarity === "legendary" || rarity === "epic") {
    const cs = 20;
    px(0, 0, cs, fw, pal.neon1, 0.7); px(0, 0, fw, cs, pal.neon1, 0.7);
    px(W - cs, 0, cs, fw, pal.neon1, 0.7); px(W - fw, 0, fw, cs, pal.neon1, 0.7);
    px(0, H - fw, cs, fw, pal.neon1, 0.5); px(0, H - cs, fw, cs, pal.neon1, 0.5);
    px(W - cs, H - fw, cs, fw, pal.neon1, 0.5); px(W - fw, H - cs, fw, cs, pal.neon1, 0.5);
  }

  // Scanlines for retro feel
  for (let sl = 0; sl < H; sl += 3) px(0, sl, W, 1, "#000", 0.04);

  // Serial number
  ctx.textAlign = "right"; ctx.fillStyle = "#333344";
  ctx.font = "8px 'Courier New', monospace";
  ctx.fillText(`#${(seed % 99999).toString().padStart(5, "0")}`, W - 14, H - 4);

  return canvas.toDataURL("image/png");
}

async function generateDeathNFTImage(gameData: {
  classId: string;
  score: number;
  days: number;
  miles: number;
  eth: number;
  stables: number;
  tokens: number;
  morale: number;
  tombstones: Array<{ name: string; mile: number; day: number; epitaph: string }>;
  playerClass: { name: string } | null;
}): Promise<string> {
  const { classId, score, days, miles, eth, stables, tokens, morale, tombstones, playerClass } = gameData;
  const canvas = document.createElement("canvas");
  const W = 400, H = 400;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const pal = DEATH_PALETTE;
  const seed = hashStats(`death-${classId}-${score}-${days}-${miles}-${tombstones.map(t => t.name).join("")}`);

  const px = (x: number, y: number, w: number, h: number, c: string, a = 1) => {
    ctx.globalAlpha = a; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
  };

  // ── LOAD DEATH CHARACTER SPRITE ──
  const spriteImg = await loadImage(pal.sprite);
  ctx.drawImage(spriteImg, 0, 0, W, H);

  // ── STATS OVERLAY AT BOTTOM ──
  const panelH = 130;
  const panelY = H - panelH;
  const fadeGrad = ctx.createLinearGradient(0, panelY - 30, 0, panelY + 10);
  fadeGrad.addColorStop(0, "rgba(0,0,0,0)");
  fadeGrad.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, panelY - 30, W, 40);
  px(0, panelY, W, panelH, "#000", 0.9);

  // Top neon line
  px(8, panelY, W - 16, 2, pal.neon1, 0.8);
  // Corner brackets
  const cb = 12;
  px(8, panelY, cb, 2, pal.neon1, 1); px(8, panelY, 2, cb, pal.neon1, 1);
  px(W - 8 - cb, panelY, cb, 2, pal.neon1, 1); px(W - 10, panelY, 2, cb, pal.neon1, 1);
  px(8, H - 2, cb, 2, pal.neon1, 0.5); px(8, H - cb, 2, cb, pal.neon1, 0.5);
  px(W - 8 - cb, H - 2, cb, 2, pal.neon1, 0.5); px(W - 10, H - cb, 2, cb, pal.neon1, 0.5);

  // ── REKT BADGE ──
  ctx.textAlign = "center";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = pal.neon1;
  ctx.fillText("[ REKT ]", W / 2, panelY + 16);

  // ── CLASS NAME ──
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillStyle = pal.neon2;
  ctx.fillText(playerClass?.name?.toUpperCase() || classId.toUpperCase(), W / 2, panelY + 30);

  // ── SCORE ──
  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.fillStyle = "#fff";
  ctx.fillText(`SCORE: ${score.toLocaleString()}`, W / 2, panelY + 55);

  // ── STATS GRID ──
  const sX = 20, sX2 = W / 2 + 10;
  let sY = panelY + 72;
  ctx.textAlign = "left";
  ctx.font = "bold 11px 'Courier New', monospace";

  ctx.fillStyle = pal.neon1; ctx.fillText(`Miles: ${miles}`, sX, sY);
  ctx.fillStyle = pal.neon1; ctx.fillText(`Days: ${days}`, sX2, sY);
  sY += 14;
  ctx.fillStyle = "#8899bb"; ctx.fillText(`ETH: ${eth}`, sX, sY);
  ctx.fillStyle = "#8899bb"; ctx.fillText(`USDC: ${stables}`, sX2, sY);
  sY += 14;
  ctx.fillStyle = "#8899bb"; ctx.fillText(`Tokens: ${tokens}`, sX, sY);
  ctx.fillStyle = "#8899bb"; ctx.fillText(`Morale: ${morale}`, sX2, sY);
  sY += 14;

  // ── TOMBSTONE NAMES ──
  ctx.fillStyle = pal.neon1; ctx.font = "bold 9px 'Courier New', monospace";
  ctx.textAlign = "center";
  const tombStr = tombstones.map(t => t.name).join(" * ");
  ctx.fillText(tombStr.length > 52 ? tombStr.slice(0, 49) + "..." : tombStr, W / 2, sY);

  // ── RED NEON FRAME ──
  ctx.strokeStyle = pal.glow; ctx.lineWidth = 7;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.strokeStyle = pal.frame; ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // Scanlines for retro feel
  for (let sl = 0; sl < H; sl += 3) px(0, sl, W, 1, "#000", 0.04);

  // Serial number
  ctx.textAlign = "right"; ctx.fillStyle = "#331111";
  ctx.font = "8px 'Courier New', monospace";
  ctx.fillText(`#${(seed % 99999).toString().padStart(5, "0")}`, W - 14, H - 4);

  return canvas.toDataURL("image/png");
}

// ── LEADERBOARD HELPERS ──

const STORAGE_KEY = "crypto-trail-leaderboard";

async function loadLeaderboard() {
  try {
    if (typeof window !== "undefined" && (window as any).storage) {
      const result = await (window as any).storage.get(STORAGE_KEY, true);
      if (result && result.value) return JSON.parse(result.value);
    }
  } catch (e) { /* ignore */ }
  try {
    const raw = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return [];
}

async function saveLeaderboard(entries: any[]) {
  try {
    const json = JSON.stringify(entries);
    if (typeof window !== "undefined" && (window as any).storage) {
      await (window as any).storage.set(STORAGE_KEY, json, true);
    }
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, json);
    }
  } catch (e) { /* ignore */ }
}

function formatTimeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── STYLES ──

const CSS = `
  @keyframes pixelFadeIn {
    0% { opacity: 0; transform: scale(0.95) translateY(8px); }
    40% { opacity: 0.5; transform: scale(1.01) translateY(-2px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes pixelSlideUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes pixelFlicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }
  @keyframes glitchShift {
    0% { transform: translateX(0); }
    20% { transform: translateX(-2px); }
    40% { transform: translateX(2px); }
    60% { transform: translateX(-1px); }
    80% { transform: translateX(1px); }
    100% { transform: translateX(0); }
  }
  @keyframes crtOn {
    0% { opacity: 0; transform: scaleY(0.01) scaleX(0.8); }
    30% { opacity: 1; transform: scaleY(1.05) scaleX(0.95); }
    60% { transform: scaleY(0.98) scaleX(1.02); }
    100% { transform: scaleY(1) scaleX(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes nftReveal {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes eventBounce {
    0% { transform: scale(0.3) rotate(-5deg); opacity: 0; }
    50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
    70% { transform: scale(0.95) rotate(-1deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes textTypewriter {
    from { max-width: 0; }
    to { max-width: 100%; }
  }
  @keyframes borderPulse {
    0%, 100% { border-color: #222; box-shadow: none; }
    50% { border-color: #7c3aed; box-shadow: 0 0 20px #7c3aed22; }
  }
`;

// ── PIXEL BUTTON COMPONENT ──
function PixelBtn({
  onClick,
  children,
  color = "#7c3aed",
  textColor = "white",
  disabled = false,
  fullWidth = false,
  size = "md",
}: {
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const pad = size === "sm" ? "8px 14px" : size === "lg" ? "16px 40px" : "12px 24px";
  const font = size === "sm" ? "11px" : size === "lg" ? "16px" : "13px";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: pad,
        fontSize: font,
        fontWeight: "700",
        background: disabled ? "#222" : color,
        color: disabled ? "#555" : textColor,
        border: `2px solid ${disabled ? "#333" : color}`,
        borderBottom: `4px solid ${disabled ? "#1a1a1a" : adjustColor(color, -40)}`,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Courier New', monospace",
        letterSpacing: "1px",
        textTransform: "uppercase" as const,
        width: fullWidth ? "100%" : "auto",
        transition: "all 0.1s",
        imageRendering: "pixelated" as const,
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderBottomWidth = "2px";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(2px)";
        }
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderBottomWidth = "4px";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderBottomWidth = "4px";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}

function adjustColor(hex: string, amount: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

// ── EVENT PROMPT WRAPPER ──
function EventPrompt({ children, type = "neutral" }: { children: React.ReactNode; type?: string }) {
  const borderColor = type === "good" ? "#10b981" : type === "bad" ? "#ef4444" : "#f59e0b";
  return (
    <div style={{
      animation: "crtOn 0.4s ease-out, borderPulse 2s ease-in-out infinite",
      border: `3px solid ${borderColor}`,
      borderRadius: "4px",
      background: "#0a0a0f",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 0 30px ${borderColor}22, inset 0 0 60px #00000088`,
    }}>
      {/* CRT corner brackets */}
      <div style={{ position: "absolute", top: 4, left: 4, width: 12, height: 12, borderTop: `2px solid ${borderColor}`, borderLeft: `2px solid ${borderColor}`, opacity: 0.6 }} />
      <div style={{ position: "absolute", top: 4, right: 4, width: 12, height: 12, borderTop: `2px solid ${borderColor}`, borderRight: `2px solid ${borderColor}`, opacity: 0.6 }} />
      <div style={{ position: "absolute", bottom: 4, left: 4, width: 12, height: 12, borderBottom: `2px solid ${borderColor}`, borderLeft: `2px solid ${borderColor}`, opacity: 0.6 }} />
      <div style={{ position: "absolute", bottom: 4, right: 4, width: 12, height: 12, borderBottom: `2px solid ${borderColor}`, borderRight: `2px solid ${borderColor}`, opacity: 0.6 }} />
      {/* Inner scanlines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────

export default function CryptoTrail() {
  useFarcasterReady();

  // Prevent hydration mismatch — wait for client mount before rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── WEB3 ──
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const connectWallet = () => connect({ connector: connectors[0] });
  const gamePayment = useGamePayment();
  const nftMint = useNftMint();
  const freePlay = useFreePlay();

  const [phase, setPhase] = useState("title");
  const [playerClass, setPlayerClass] = useState<typeof CLASSES[0] | null>(null);
  const [party, setParty] = useState<Array<{ id: number; name: string; health: number; affliction: typeof AFFLICTIONS[0] | null; alive: boolean }>>([]);
  const [partyNames, setPartyNames] = useState(["Based Chad", "", "", ""]);
  const [day, setDay] = useState(1);
  const [milesTraveled, setMilesTraveled] = useState(0);
  const [eth, setEth] = useState(0);
  const [stables, setStables] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [morale, setMorale] = useState(75);
  const [pace, setPace] = useState("normal");
  const [currentEvent, setCurrentEvent] = useState<typeof TRAIL_EVENTS[0] | null>(null);
  const [currentLandmark, setCurrentLandmark] = useState<typeof LANDMARKS[0] | null>(null);
  const [log, setLog] = useState<Array<{ text: string; day: number }>>([]);
  const [tradeState, setTradeState] = useState<{ token: typeof TRADE_TOKENS[0]; price: number; bought: number; rounds: number; maxRounds: number } | null>(null);
  const [bridgeState, setBridgeState] = useState<typeof BRIDGE_EVENTS[0] | null>(null);
  const [tombstones, setTombstones] = useState<Array<{ name: string; mile: number; day: number; epitaph: string }>>([]);
  const [animFrame, setAnimFrame] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [nftImage, setNftImage] = useState<string | null>(null);
  const [nftMintState, setNftMintState] = useState("idle");
  const [deathNftImage, setDeathNftImage] = useState<string | null>(null);
  const [deathNftMintState, setDeathNftMintState] = useState("idle");
  const [sharing, setSharing] = useState(false);
  const [eventAnimPhase, setEventAnimPhase] = useState(0); // 0 = intro, 1 = content, 2 = ready
  const [shopItems, setShopItems] = useState({ audits: 0, hardwareWallets: 0, vpn: 0, aiAgent: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const { leaderboard: globalLeaderboard, loading: lbLoading, error: lbError, fetchLeaderboard } = useLeaderboard();
  const { profile: playerProfile, loading: profileLoading, fetchProfile, clearProfile } = usePlayerProfile();
  const logRef = useRef<HTMLDivElement>(null);

  const totalMiles = 900;
  const paceMap: Record<string, number> = { slow: 8, normal: 14, fast: 22, degen: 30 };
  const paceRiskMap: Record<string, number> = { slow: 0.5, normal: 1.0, fast: 1.8, degen: 3.0 };
  const paceMoraleCost: Record<string, number> = { slow: 1, normal: 0, fast: -1, degen: -3 };
  const paceStableMult: Record<string, number> = { slow: 1, normal: 1, fast: 1.5, degen: 2 };

  // Pixel animation timer - faster for smoother 8-bit feel
  useEffect(() => {
    const t = setInterval(() => setAnimFrame((f) => f + 1), 250);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Load leaderboard
  useEffect(() => {
    loadLeaderboard().then(setLeaderboard);
  }, []);

  // DEBUG: Ctrl+Shift+V to jump to victory screen with mock data
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "V") {
        e.preventDefault();
        setPlayerClass(CLASSES[0]);
        setParty([
          { id: 0, name: "Based Chad", health: 90, affliction: null, alive: true },
          { id: 1, name: "Vitalik Jr.", health: 70, affliction: null, alive: true },
          { id: 2, name: "Ser Moonboy", health: 0, affliction: null, alive: false },
          { id: 3, name: "Anon Dev", health: 50, affliction: null, alive: true },
        ]);
        setPartyNames(["Based Chad", "Vitalik Jr.", "Ser Moonboy", "Anon Dev"]);
        setDay(42);
        setMilesTraveled(900);
        setEth(1337);
        setStables(420);
        setTokens(69);
        setMorale(85);
        setTombstones([{ name: "Ser Moonboy", mile: 612, day: 28, epitaph: "RIP Ser Moonboy — Day 28, Mile 612 — rugged by a memecoin" }]);
        setNftMintState("idle");
        setNftImage(null);
        setPhase("victory");
      }
      // DEBUG: Ctrl+Shift+D to jump to gameover/death screen with mock data
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setPlayerClass(CLASSES[1]);
        setParty([
          { id: 0, name: "Based Chad", health: 0, affliction: null, alive: false },
          { id: 1, name: "Vitalik Jr.", health: 0, affliction: null, alive: false },
          { id: 2, name: "Ser Moonboy", health: 0, affliction: null, alive: false },
          { id: 3, name: "Anon Dev", health: 0, affliction: null, alive: false },
        ]);
        setPartyNames(["Based Chad", "Vitalik Jr.", "Ser Moonboy", "Anon Dev"]);
        setDay(28);
        setMilesTraveled(412);
        setEth(3);
        setStables(12);
        setTokens(0);
        setMorale(5);
        setTombstones([
          { name: "Ser Moonboy", mile: 180, day: 12, epitaph: "RIP Ser Moonboy — Day 12, Mile 180 — rugged by a memecoin" },
          { name: "Vitalik Jr.", mile: 290, day: 19, epitaph: "RIP Vitalik Jr. — Day 19, Mile 290 — lost in a flash loan attack" },
          { name: "Based Chad", mile: 380, day: 25, epitaph: "RIP Based Chad — Day 25, Mile 380 — rekt by a rug pull" },
          { name: "Anon Dev", mile: 412, day: 28, epitaph: "RIP Anon Dev — Day 28, Mile 412 — liquidated on leverage" },
        ]);
        setDeathNftMintState("idle");
        setDeathNftImage(null);
        setPhase("gameover");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Submit score on victory/gameover
  useEffect(() => {
    if ((phase === "victory" || phase === "gameover") && !scoreSubmitted) {
      setScoreSubmitted(true);
      const score = calcScore();
      const entry = {
        name: partyNames[0] || "Anon",
        score,
        day,
        miles: milesTraveled,
        survived: phase === "victory",
        timestamp: Date.now(),
      };
      // Keep localStorage leaderboard as local fallback
      loadLeaderboard().then((lb: any[]) => {
        const updated = [...lb, entry].sort((a, b) => b.score - a.score).slice(0, 20);
        saveLeaderboard(updated);
        setLeaderboard(updated);
      });
      // Submit to global leaderboard (fire-and-forget)
      if (address) {
        submitScore({
          wallet: address,
          score,
          classId: playerClass?.id || "dev",
          survivors: party.filter((p) => p.alive).length,
          days: day,
          miles: milesTraveled,
          survived: phase === "victory",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Event animation sequence
  useEffect(() => {
    if (phase === "event" || phase === "bridge" || phase === "landmark") {
      setEventAnimPhase(0);
      const t1 = setTimeout(() => setEventAnimPhase(1), 400);
      const t2 = setTimeout(() => setEventAnimPhase(2), 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase, currentEvent, currentLandmark]);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-50), { text: msg, day }]);
  }, [day]);

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  };

  const triggerFlash = (color: string) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 300);
  };

  const applyEffect = (effectFn: (g: GameState) => GameState) => {
    const next = effectFn({ eth, stables, tokens, morale });
    setEth(next.eth);
    setStables(next.stables);
    setTokens(next.tokens);
    setMorale(next.morale);
  };

  // ── GAME ACTIONS ──

  // Handle payment success → start game
  useEffect(() => {
    if (gamePayment.paymentState === "success" && phase === "title") {
      setPhase("class_select");
    }
  }, [gamePayment.paymentState, phase]);

  // Auto-trigger payment after wallet connects from "CONNECT & PLAY"
  const pendingPayRef = useRef(false);
  useEffect(() => {
    if (isConnected && pendingPayRef.current && phase === "title" && gamePayment.paymentState === "idle") {
      pendingPayRef.current = false;
      // Check for free play first
      if (freePlay.hasFreePlay) {
        freePlay.consume().then((ok) => {
          if (ok) setPhase("class_select");
          else gamePayment.pay();
        });
      } else {
        gamePayment.pay();
      }
    }
  }, [isConnected, phase, gamePayment, freePlay]);

  const startGame = () => {
    if (!isConnected) {
      pendingPayRef.current = true;
      connectWallet();
      return;
    }
    // Check for free play before requiring payment
    if (freePlay.hasFreePlay) {
      freePlay.consume().then((ok) => {
        if (ok) setPhase("class_select");
        else gamePayment.pay(); // Fallback to payment if consume fails
      });
      return;
    }
    // Initiate $1 USD payment
    gamePayment.pay();
  };

  const selectClass = (cls: typeof CLASSES[0]) => {
    setPlayerClass(cls);
    setEth(cls.startETH);
    setStables(cls.startStables);
    setTokens(cls.startTokens);
    setPhase("name_party");
  };

  const confirmParty = () => {
    if (partyNames.some((n) => n.trim() === "")) return;
    const p = partyNames.map((name, i) => ({ id: i, name: name.trim(), health: 100, affliction: null, alive: true }));
    setParty(p);
    setPhase("shop");
  };

  const buyItem = (item: string, cost: number) => {
    if (eth < cost) return;
    setEth((e) => e - cost);
    setShopItems((prev) => ({ ...prev, [item]: (prev as Record<string, number>)[item] + 1 }));
  };

  const leaveShop = () => {
    addLog("You leave Genesis Block and begin your journey across the crypto frontier. Your AI agent hums to life...");
    setPhase("trail");
  };

  // ── ADVANCE DAY ──
  const advanceDay = () => {
    if (phase !== "trail") return;

    const milesPerDay = paceMap[pace] + rng(-3, 3);
    const newMiles = Math.min(totalMiles, milesTraveled + milesPerDay);
    const newDay = day + 1;
    const risk = paceRiskMap[pace];

    let newStables = stables - Math.ceil(party.filter((p) => p.alive).length * 2.5 * paceStableMult[pace]);
    let newMorale = morale + paceMoraleCost[pace];
    const newEth = eth;
    let updatedParty = [...party];

    if (newStables <= 0) {
      newStables = 0;
      newMorale -= 15;
      addLog("Out of stablecoins! Your party is starving for liquidity!");
    }

    // Difficulty scales with distance — the frontier gets harsher
    const progress = newMiles / totalMiles;
    const dangerScale = 1 + progress * 0.6;

    updatedParty = updatedParty.map((member) => {
      if (!member.alive) return member;
      let hp = member.health;

      // Passive attrition — the trail wears everyone down
      if (Math.random() < 0.08 * dangerScale) {
        hp -= rng(1, 4);
      }

      if (member.affliction) {
        hp -= member.affliction.severity * 5;
        // Recovery gets harder the further you go
        if (Math.random() < 0.18 / dangerScale) {
          addLog(`${member.name} recovered from ${member.affliction.name}!`);
          return { ...member, health: Math.max(1, hp), affliction: null };
        }
      }

      if (!member.affliction && Math.random() < 0.07 * risk * dangerScale) {
        const aff = pick(AFFLICTIONS);
        addLog(`${aff.emoji} ${member.name} has contracted ${aff.name}!`);
        return { ...member, health: hp, affliction: aff };
      }

      if (pace === "slow" && !member.affliction) hp = Math.min(100, hp + 2);

      // Low morale saps health
      if (newMorale < 25) hp -= rng(1, 3);

      if (hp <= 0) {
        const deathMsg = pick(DEATH_MESSAGES);
        addLog(`${member.name} ${deathMsg}.`);
        setTombstones((prev) => [...prev, { name: member.name, mile: newMiles, day: newDay, epitaph: pick(EPITAPHS).replace("{name}", member.name) }]);
        triggerShake();
        triggerFlash("#ff0000");
        return { ...member, health: 0, alive: false };
      }

      return { ...member, health: hp };
    });

    if (updatedParty.every((p) => !p.alive)) {
      setParty(updatedParty);
      setPhase("gameover");
      return;
    }

    const nextLandmark = LANDMARKS.find((l) => l.miles > milesTraveled && l.miles <= newMiles);

    if (newMiles >= totalMiles || (nextLandmark && nextLandmark.type === "end")) {
      setParty(updatedParty);
      setDay(newDay);
      setMilesTraveled(totalMiles);
      setStables(Math.max(0, newStables));
      setMorale(clamp(newMorale, 0, 100));
      setPhase("victory");
      return;
    }

    if (nextLandmark && nextLandmark.type === "bridge") {
      setCurrentLandmark(nextLandmark);
      setParty(updatedParty);
      setDay(newDay);
      setMilesTraveled(newMiles);
      setStables(Math.max(0, newStables));
      setMorale(clamp(newMorale, 0, 100));
      setPhase("bridge");
      return;
    }

    if (Math.random() < (0.35 + progress * 0.1) * risk) {
      // Events skew toward bad outcomes as the trail gets harder
      let eventPool = TRAIL_EVENTS;
      if (Math.random() < progress * 0.25) {
        const badEvents = TRAIL_EVENTS.filter((e) => e.type === "bad");
        eventPool = badEvents.length > 0 ? badEvents : TRAIL_EVENTS;
      }
      const event = pick(eventPool);
      setCurrentEvent(event);
      setParty(updatedParty);
      setDay(newDay);
      setMilesTraveled(newMiles);
      setStables(Math.max(0, newStables));
      setMorale(clamp(newMorale, 0, 100));
      setPhase("event");
      return;
    }

    if (nextLandmark) {
      setCurrentLandmark(nextLandmark);
      setParty(updatedParty);
      setDay(newDay);
      setMilesTraveled(newMiles);
      setStables(Math.max(0, newStables));
      setMorale(clamp(newMorale, 0, 100));
      setPhase("landmark");
      return;
    }

    setParty(updatedParty);
    setDay(newDay);
    setMilesTraveled(newMiles);
    setStables(Math.max(0, newStables));
    setEth(newEth);
    setMorale(clamp(newMorale, 0, 100));
  };

  const resolveEvent = () => {
    if (currentEvent) {
      applyEffect(currentEvent.effect);
      if (currentEvent.title === "JESSE POLLAK APED IN") {
        setParty((prev) => prev.map((p) => p.alive ? { ...p, health: Math.min(100, p.health + (100 - p.health) * 0.5) } : p));
      }
      if (currentEvent.title === "PIZZA PARTY FOR VETS") {
        setParty((prev) => prev.map((p) => p.alive ? { ...p, health: Math.min(100, p.health + (100 - p.health) * 0.5) } : p));
      }
      if (currentEvent.type === "good") triggerFlash("#00ff88");
      if (currentEvent.type === "bad") { triggerShake(); triggerFlash("#ff4444"); }
      addLog(`${currentEvent.title} -- ${currentEvent.message}`);
    }
    setCurrentEvent(null);
    setPhase("trail");
  };

  const attemptBridge = (method: string) => {
    const roll = Math.random();
    let event;
    if (method === "official") {
      event = roll < 0.5 ? BRIDGE_EVENTS[0] : roll < 0.8 ? BRIDGE_EVENTS[1] : BRIDGE_EVENTS[2];
    } else if (method === "sketchy") {
      event = roll < 0.3 ? BRIDGE_EVENTS[0] : roll < 0.5 ? BRIDGE_EVENTS[2] : BRIDGE_EVENTS[3];
    } else {
      event = { title: "Patience Pays", message: "You waited for a safe window and bridged successfully.", outcome: "safe" as const };
    }

    if (event.outcome === "exploit") {
      const loss = Math.floor(eth * 0.4);
      setEth((e) => Math.max(0, e - loss));
      addLog(`Bridge exploit! Lost ${loss} ETH in transit.`);
      triggerShake();
      triggerFlash("#ff4444");
    } else if (event.outcome === "fee") {
      const fee = Math.floor(eth * 0.1);
      setEth((e) => Math.max(0, e - fee));
      addLog(`Bridge fee: ${fee} ETH`);
    } else if ("penalty" in event && event.outcome === "delay") {
      setDay((d) => d + (event.penalty || 3));
      addLog(`Stuck in bridge for ${event.penalty || 3} days.`);
    }

    setBridgeState(event as typeof BRIDGE_EVENTS[0]);
    setTimeout(() => {
      setBridgeState(null);
      setPhase("trail");
    }, 2500);
  };

  const startTrade = () => {
    const token = pick(TRADE_TOKENS);
    const basePrice = rng(10, 200);
    setTradeState({ token, price: basePrice, bought: 0, rounds: 0, maxRounds: 5 });
    setPhase("trade");
  };

  const tradeBuy = (amount: number) => {
    if (!tradeState || eth < tradeState.price * amount) return;
    setEth((e) => e - tradeState.price * amount);
    setTradeState((ts) => ts ? ({ ...ts, bought: ts.bought + amount }) : ts);
    addLog(`Bought ${amount} ${tradeState.token.name} @ ${tradeState.price} ETH`);
  };

  const tradeHodl = () => {
    if (!tradeState) return;
    const vol = tradeState.token.volatility;
    const change = 1 + (Math.random() - 0.45) * vol;
    const newPrice = Math.max(1, Math.floor(tradeState.price * change));
    const isUp = newPrice > tradeState.price;
    addLog(`${isUp ? "UP" : "DOWN"} ${tradeState.token.name}: ${tradeState.price} -> ${newPrice} ETH`);
    if (isUp) triggerFlash("#00ff88"); else triggerFlash("#ff4444");
    setTradeState((ts) => ts ? ({ ...ts, price: newPrice, rounds: ts.rounds + 1 }) : ts);
  };

  const tradeSell = () => {
    if (!tradeState) return;
    const proceeds = tradeState.bought * tradeState.price;
    setEth((e) => e + proceeds);
    addLog(`Sold ${tradeState.bought} ${tradeState.token.name} for ${proceeds} ETH!`);
    setTradeState(null);
    setPhase("trail");
  };

  const useHardwareWallet = (memberId: number) => {
    if (shopItems.hardwareWallets <= 0) return;
    setShopItems((prev) => ({ ...prev, hardwareWallets: prev.hardwareWallets - 1 }));
    setParty((prev) => prev.map((p) => p.id === memberId ? { ...p, affliction: null, health: Math.min(100, p.health + 20) } : p));
    addLog(`Used hardware wallet to secure ${party.find((p) => p.id === memberId)?.name}!`);
  };

  const market = getMarketCondition(day);
  const progressPct = (milesTraveled / totalMiles) * 100;
  const nextLandmarkInfo = LANDMARKS.find((l) => l.miles > milesTraveled) || LANDMARKS[LANDMARKS.length - 1];
  const milesToNext = nextLandmarkInfo.miles - milesTraveled;
  const aliveMemberCount = party.filter((p) => p.alive).length;

  const calcScore = () => {
    const survivalBonus = aliveMemberCount * 500;
    const wealthScore = eth + stables + tokens;
    const speedBonus = Math.max(0, 1000 - day * 10);
    const moraleBonus = morale * 5;
    return survivalBonus + wealthScore + speedBonus + moraleBonus;
  };

  const generateNFT = useCallback(() => {
    setNftMintState("generating");
    setTimeout(async () => {
      try {
        const gameData = {
          classId: playerClass?.id || "dev",
          playerClass,
          score: calcScore(),
          survivors: party.filter((p) => p.alive).length,
          totalParty: 4,
          days: day,
          eth, stables, tokens, morale,
          partyNames: party.map((p) => p.name),
          tombstones: tombstones.map((t) => t.name),
        };
        const imgDataUrl = await generateNFTImage(gameData);
        setNftImage(imgDataUrl);
        setNftMintState("ready");
      } catch {
        setNftMintState("error");
      }
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerClass, party, day, eth, stables, tokens, morale, tombstones]);

  useEffect(() => {
    if (phase === "victory" && !nftImage && nftMintState === "idle") {
      generateNFT();
    }
  }, [phase, nftImage, nftMintState, generateNFT]);

  const generateDeathNFT = useCallback(() => {
    setDeathNftMintState("generating");
    setTimeout(async () => {
      try {
        const gameData = {
          classId: playerClass?.id || "dev",
          playerClass,
          score: calcScore(),
          days: day,
          miles: milesTraveled,
          eth, stables, tokens, morale,
          tombstones,
        };
        const imgDataUrl = await generateDeathNFTImage(gameData);
        setDeathNftImage(imgDataUrl);
        setDeathNftMintState("ready");
      } catch {
        setDeathNftMintState("error");
      }
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerClass, day, milesTraveled, eth, stables, tokens, morale, tombstones]);

  useEffect(() => {
    if (phase === "gameover" && !deathNftImage && deathNftMintState === "idle") {
      generateDeathNFT();
    }
  }, [phase, deathNftImage, deathNftMintState, generateDeathNFT]);

  const downloadNFT = () => {
    if (!nftImage) return;
    // Convert data URL to blob for reliable download across browsers
    fetch(nftImage).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `crypto-trail-nft-${calcScore()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const downloadDeathNFT = () => {
    if (!deathNftImage) return;
    fetch(deathNftImage).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `crypto-trail-death-nft.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // Wait for client mount to avoid hydration mismatch (React error #418)
  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "#0a0a0f" }} />;
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e0e0e0",
    fontFamily: "'Courier New', 'Lucida Console', monospace",
    position: "relative",
    overflow: "hidden",
    transform: screenShake ? `translate(${rng(-4, 4)}px, ${rng(-4, 4)}px)` : "none",
    transition: "transform 0.05s",
  };

  const flashOverlay = flashColor ? (
    <div style={{
      position: "fixed", inset: 0, background: flashColor, opacity: 0.15,
      pointerEvents: "none", zIndex: 999, transition: "opacity 0.3s",
    }} />
  ) : null;

  const scanlines = (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 998,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
    }} />
  );

  // ── TITLE SCREEN ──
  if (phase === "title") {
    const isPaying = gamePayment.paymentState === "paying" || gamePayment.paymentState === "confirming";
    const payError = gamePayment.paymentState === "error";

    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", textAlign: "center" }}>

          <h1 style={{
            fontSize: "clamp(48px, 12vw, 96px)", fontWeight: "900", margin: "0 0 4px",
            color: "#7c3aed",
            textShadow: "3px 3px 0px #06b6d4, 6px 6px 0px #10b981",
            lineHeight: 1.1,
            letterSpacing: "4px",
            fontFamily: "'Courier New', monospace",
          }}>
            CRYPTO TRAIL
          </h1>
          <div style={{
            fontSize: "10px", color: "#f59e0b", letterSpacing: "6px", marginBottom: "24px",
            textTransform: "uppercase",
          }}>
            8-BIT DEGEN EDITION
          </div>
          <div style={{
            fontSize: "clamp(12px, 2.5vw, 15px)", color: "#fff", marginBottom: "32px", maxWidth: "450px",
            lineHeight: "1.6",
          }}>
            The year is 2026. AI took your job, your portfolio is rekt, and you are heading to Mainnet.
            Can you survive rug pulls, rogue AI agents, and bridge exploits?
          </div>

          <div style={{ width: "100%", maxWidth: "500px", marginBottom: "32px" }}>
            <PixelTitleCanvas animFrame={animFrame} />
          </div>

          {/* Entry fee info */}
          <div style={{
            fontSize: "10px", color: freePlay.hasFreePlay ? "#10b981" : "#fff", marginBottom: "12px", letterSpacing: "2px",
          }}>
            {freePlay.hasFreePlay
              ? "★ FREE PLAY AVAILABLE ★"
              : <>
                ENTRY: ${gamePayment.entryFeeUsd.toFixed(2)} USD
                {gamePayment.entryFeeEth && (
                  <span style={{ color: "#fff" }}>
                    {" "}({gamePayment.entryFeeEth.toFixed(6)} ETH)
                  </span>
                )}
                <br />
                <span style={{ color: "#fff", fontSize: "10px" }}>PAID ENTRY GIVES A DEATH OR VICTORY NFT</span>
              </>
            }
          </div>

          <PixelBtn
            onClick={() => {
              if (payError) gamePayment.reset();
              startGame();
            }}
            color={isPaying ? "#333" : "#7c3aed"}
            size="lg"
            disabled={isPaying}
          >
            {!isConnected
              ? "> CONNECT & PLAY <"
              : isPaying
                ? "PROCESSING..."
                : freePlay.hasFreePlay
                  ? "> FREE PLAY <"
                  : "> BEGIN JOURNEY <"
            }
          </PixelBtn>

          {/* Payment status messages */}
          {isPaying && (
            <div style={{ marginTop: "12px", fontSize: "10px", color: "#f59e0b", letterSpacing: "1px" }}>
              {gamePayment.paymentState === "paying" ? "CONFIRM IN YOUR WALLET..." : "CONFIRMING ON BASE..."}
            </div>
          )}

          {payError && (
            <div style={{ marginTop: "12px", fontSize: "10px", color: "#ef4444", letterSpacing: "1px", maxWidth: "350px" }}>
              {gamePayment.errorMsg || "TRANSACTION FAILED"}
              <br />
              <span style={{ color: "#fff", fontSize: "9px" }}>TAP ABOVE TO TRY AGAIN</span>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "16px", width: "100%", maxWidth: "500px" }}>
            <div style={{ flex: 1 }}>
              <PixelBtn
                onClick={() => shareGameCast(
                  `The year is 2026. AI took your job. Your portfolio is rekt. Now you must lead 4 degens from Genesis Block to Mainnet.\n\nDodge rug pulls. Cross sketchy bridges. Fight rogue AI agents.\n\nCan you survive the Crypto Trail? 👇`,
                  null,
                  `${APP_URL}/images/share/homepageShare.png`
                )}
                color="#06b6d4"
                fullWidth
              >
                SHARE
              </PixelBtn>
            </div>
            <div style={{ flex: 1 }}>
              <PixelBtn
                onClick={() => {
                  fetchLeaderboard();
                  setPhase("leaderboard");
                }}
                color="#06b6d4"
                fullWidth
              >
                LEADERBOARD
              </PixelBtn>
            </div>
          </div>

          <div style={{
            marginTop: "24px", fontSize: "9px", color: "#fff", maxWidth: "400px", letterSpacing: "2px",
          }}>
            INSPIRED BY THE OREGON TRAIL (1971) * BUILT FOR FARCASTER * BASE MAINNET * CREATED BY VMFCOIN
          </div>
        </div>
      </div>
    );
  }

  // ── LEADERBOARD SCREEN ──
  if (phase === "leaderboard") {
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 16px 120px" }}>

          {/* Header with back button */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "16px", borderBottom: "2px solid #1a1a2e", paddingBottom: "12px",
          }}>
            <PixelBtn
              onClick={() => {
                setSelectedPlayer(null);
                clearProfile();
                setPhase("title");
              }}
              color="#333"
              textColor="#888"
              size="sm"
            >
              BACK
            </PixelBtn>
            <div style={{
              fontSize: "18px", fontWeight: "900", color: "#06b6d4",
              letterSpacing: "3px", textAlign: "center",
            }}>
              LEADERBOARD
            </div>
            <div style={{ width: "60px" }} />
          </div>

          {/* Player Profile View */}
          {selectedPlayer && (
            <div style={{
              marginBottom: "16px", padding: "16px", background: "#0a0a12",
              border: "2px solid #1a1a2e",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <PixelBtn onClick={() => { setSelectedPlayer(null); clearProfile(); }} color="#333" textColor="#888" size="sm">
                  CLOSE
                </PixelBtn>
              </div>

              {profileLoading ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#fff", fontSize: "11px", letterSpacing: "2px" }}>
                  LOADING PROFILE...
                </div>
              ) : playerProfile ? (
                <div>
                  {/* Profile header: pfp + name — clickable to open Farcaster profile */}
                  <div
                    onClick={async () => {
                      if (playerProfile.stats.fc_fid) {
                        const sdk = await farcasterSdkPromise;
                        if (sdk?.actions?.viewProfile) {
                          sdk.actions.viewProfile({ fid: Number(playerProfile.stats.fc_fid) }).catch(() => {});
                        }
                      }
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px",
                      cursor: playerProfile.stats.fc_fid ? "pointer" : "default",
                    }}
                  >
                    {playerProfile.stats.fc_pfp ? (
                      <img
                        src={playerProfile.stats.fc_pfp}
                        alt=""
                        style={{
                          width: "48px", height: "48px", borderRadius: "50%",
                          border: `2px solid ${TIER_COLORS[playerProfile.stats.best_tier] || "#888"}`,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "50%",
                        background: "#1a1a2e", border: "2px solid #333",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "18px", color: "#fff",
                      }}>
                        ?
                      </div>
                    )}
                    <div>
                      <div style={{
                        fontSize: "14px", fontWeight: "900", color: "#fff",
                        letterSpacing: "1px",
                      }}>
                        {playerProfile.stats.fc_display_name || playerProfile.stats.fc_username || "ANON"}
                      </div>
                      {playerProfile.stats.fc_username && (
                        <div style={{ fontSize: "10px", color: "#fff", letterSpacing: "1px" }}>
                          @{playerProfile.stats.fc_username}
                        </div>
                      )}
                      <div style={{ fontSize: "9px", color: "#fff", marginTop: "2px", letterSpacing: "0.5px" }}>
                        {selectedPlayer.slice(0, 6)}...{selectedPlayer.slice(-4)}
                      </div>
                      {playerProfile.stats.fc_fid && (
                        <div style={{ fontSize: "8px", color: "#06b6d4", marginTop: "2px", letterSpacing: "1px" }}>
                          TAP TO VIEW PROFILE
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px",
                    marginBottom: "16px",
                  }}>
                    <div style={{ padding: "8px", background: "#0a0a0f", border: "1px solid #1a1a2e", textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "#fff", letterSpacing: "2px", marginBottom: "4px" }}>BEST SCORE</div>
                      <div style={{
                        fontSize: "16px", fontWeight: "900",
                        color: TIER_COLORS[playerProfile.stats.best_tier] || "#fff",
                      }}>
                        {playerProfile.stats.best_score.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: "8px", background: "#0a0a0f", border: "1px solid #1a1a2e", textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "#fff", letterSpacing: "2px", marginBottom: "4px" }}>BEST TIER</div>
                      <div style={{
                        fontSize: "12px", fontWeight: "900",
                        color: TIER_COLORS[playerProfile.stats.best_tier] || "#fff",
                        letterSpacing: "2px",
                      }}>
                        {TIER_LABELS[playerProfile.stats.best_tier] || "NONE"}
                      </div>
                    </div>
                    <div style={{ padding: "8px", background: "#0a0a0f", border: "1px solid #1a1a2e", textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "#fff", letterSpacing: "2px", marginBottom: "4px" }}>GAMES</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#fff" }}>
                        {playerProfile.stats.games_played}
                      </div>
                    </div>
                    <div style={{ padding: "8px", background: "#0a0a0f", border: "1px solid #1a1a2e", textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "#fff", letterSpacing: "2px", marginBottom: "4px" }}>RANK</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#ffd700" }}>
                        {playerProfile.rank ? `#${playerProfile.rank}` : "\u2014"}
                      </div>
                    </div>
                  </div>

                  {/* Game history */}
                  {playerProfile.games.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: "10px", color: "#fff", letterSpacing: "2px",
                        marginBottom: "8px", textAlign: "center",
                      }}>
                        GAME HISTORY
                      </div>
                      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {playerProfile.games.map((g, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 8px",
                            background: i % 2 === 0 ? "#0a0a0f" : "#0d0d16",
                            borderBottom: "1px solid #1a1a2e",
                            fontSize: "10px",
                          }}>
                            <div>
                              <span style={{ color: TIER_COLORS[g.tier] || "#fff", fontWeight: "700" }}>
                                {g.score.toLocaleString()}
                              </span>
                              <span style={{ color: "#fff", marginLeft: "6px" }}>
                                {g.survived ? "\u2713" : "\uD83D\uDC80"}
                              </span>
                            </div>
                            <div style={{ color: "#fff", fontSize: "9px" }}>
                              {g.days}d {"\u00B7"} {g.miles}mi {"\u00B7"} {g.survivors}/4
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px", color: "#ef4444", fontSize: "11px" }}>
                  PLAYER NOT FOUND
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Table */}
          {!selectedPlayer && (
            <>
              {lbLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "11px", letterSpacing: "2px" }}>
                  LOADING LEADERBOARD...
                </div>
              ) : lbError ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ color: "#ef4444", fontSize: "11px", letterSpacing: "1px", marginBottom: "12px" }}>
                    {lbError}
                  </div>
                  <PixelBtn onClick={fetchLeaderboard} color="#333" textColor="#888" size="sm">
                    RETRY
                  </PixelBtn>
                </div>
              ) : globalLeaderboard.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "11px", letterSpacing: "2px" }}>
                  NO GAMES PLAYED YET
                  <div style={{ marginTop: "8px", fontSize: "10px", color: "#555" }}>
                    BE THE FIRST TO CONQUER THE TRAIL
                  </div>
                </div>
              ) : (
                <div>
                  {/* Column headers */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "28px 32px 1fr 70px 50px",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 8px",
                    borderBottom: "2px solid #1a1a2e",
                    fontSize: "9px",
                    color: "#555",
                    letterSpacing: "1px",
                  }}>
                    <span>#</span>
                    <span></span>
                    <span>PLAYER</span>
                    <span style={{ textAlign: "right" }}>SCORE</span>
                    <span style={{ textAlign: "right" }}>GAMES</span>
                  </div>

                  {/* Player rows */}
                  <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                    {globalLeaderboard.map((row, i) => (
                      <div
                        key={row.wallet}
                        onClick={() => {
                          setSelectedPlayer(row.wallet);
                          fetchProfile(row.wallet);
                        }}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 32px 1fr 70px 50px",
                          alignItems: "center",
                          gap: "4px",
                          padding: "8px",
                          cursor: "pointer",
                          background: i === 0 ? "#1a1a0a" : i % 2 === 0 ? "#0a0a0f" : "#0d0d16",
                          borderBottom: "1px solid #1a1a2e",
                        }}
                      >
                        {/* Rank */}
                        <span style={{
                          fontSize: "11px", fontWeight: "900",
                          color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#555",
                        }}>
                          {row.rank}
                        </span>

                        {/* PFP */}
                        {row.fc_pfp ? (
                          <img
                            src={row.fc_pfp}
                            alt=""
                            loading="lazy"
                            style={{
                              width: "24px", height: "24px", borderRadius: "50%",
                              border: `1px solid ${TIER_COLORS[row.best_tier] || "#333"}`,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "24px", height: "24px", borderRadius: "50%",
                            background: "#1a1a2e", border: "1px solid #333",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "10px", color: "#555",
                          }}>
                            ?
                          </div>
                        )}

                        {/* Name + tier badge */}
                        <div style={{ overflow: "hidden" }}>
                          <div style={{
                            fontSize: "11px", fontWeight: "700", color: "#fff",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {row.fc_display_name || row.fc_username || `${row.wallet.slice(0, 6)}...${row.wallet.slice(-4)}`}
                          </div>
                          <div style={{
                            fontSize: "8px", fontWeight: "900",
                            color: TIER_COLORS[row.best_tier] || "#888",
                            letterSpacing: "1px",
                          }}>
                            {TIER_LABELS[row.best_tier] || ""}
                          </div>
                        </div>

                        {/* Score */}
                        <div style={{
                          fontSize: "11px", fontWeight: "700", textAlign: "right",
                          color: TIER_COLORS[row.best_tier] || "#fff",
                        }}>
                          {row.best_score.toLocaleString()}
                        </div>

                        {/* Games played */}
                        <div style={{
                          fontSize: "10px", textAlign: "right", color: "#888",
                        }}>
                          {row.games_played}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── CLASS SELECT ──
  if (phase === "class_select") {
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
          <h2 style={{ textAlign: "center", color: "#7c3aed", fontSize: "22px", marginBottom: "4px", letterSpacing: "3px" }}>
            SELECT YOUR CLASS
          </h2>
          <div style={{ textAlign: "center", fontSize: "10px", color: "#fff", marginBottom: "28px", letterSpacing: "2px" }}>
            EACH CLASS STARTS WITH DIFFERENT RESOURCES AND A UNIQUE BONUS
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {CLASSES.map((cls, i) => (
              <button key={cls.id} onClick={() => selectClass(cls)} style={{
                padding: "16px", background: "#0a0a12", border: "2px solid #1a1a2e",
                cursor: "pointer", textAlign: "left",
                fontFamily: "'Courier New', monospace", color: "#e0e0e0", transition: "all 0.15s",
                animation: `pixelSlideUp 0.3s ease-out ${i * 0.1}s both`,
                borderBottom: "4px solid #111",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "#0f0f1a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.background = "#0a0a12"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "24px" }}>{cls.emoji}</span>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff", letterSpacing: "1px" }}>{cls.name.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#06b6d4", marginBottom: "6px", letterSpacing: "1px" }}>{cls.bonus}</div>
                <div style={{ fontSize: "10px", color: "#fff", display: "flex", gap: "16px", letterSpacing: "1px" }}>
                  <span>ETH:{cls.startETH}</span>
                  <span>USDC:{cls.startStables}</span>
                  <span>TKN:{cls.startTokens}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── NAME PARTY ──
  if (phase === "name_party") {
    const allFilled = partyNames.every((n) => n.trim() !== "");
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px" }}>
          <h2 style={{ textAlign: "center", color: "#7c3aed", fontSize: "22px", marginBottom: "4px", letterSpacing: "3px" }}>
            NAME YOUR SQUAD
          </h2>
          <div style={{ textAlign: "center", fontSize: "10px", color: "#fff", marginBottom: "28px", letterSpacing: "2px" }}>
            THESE BRAVE DEGENS WILL ACCOMPANY YOU
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: "14px", animation: `pixelSlideUp 0.3s ease-out ${i * 0.1}s both` }}>
              <label style={{ fontSize: "10px", color: "#fff", display: "block", marginBottom: "4px", letterSpacing: "2px", textTransform: "uppercase" }}>
                {i === 0 ? "> PARTY LEADER (YOU)" : `> DEGEN #${i + 1}`}
              </label>
              <input
                value={partyNames[i]}
                onChange={(e) => {
                  const next = [...partyNames];
                  next[i] = e.target.value;
                  setPartyNames(next);
                }}
                placeholder="ENTER NAME..."
                maxLength={20}
                style={{
                  width: "100%", padding: "10px 12px", background: "#0a0a12",
                  border: `2px solid ${partyNames[i].trim() ? "#10b981" : "#1a1a2e"}`,
                  color: "#fff", fontFamily: "'Courier New', monospace", fontSize: "14px",
                  outline: "none", boxSizing: "border-box", letterSpacing: "1px",
                }}
                onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                onBlur={(e) => e.target.style.borderColor = partyNames[i].trim() ? "#10b981" : "#1a1a2e"}
              />
            </div>
          ))}
          <div style={{ marginTop: "20px" }}>
            <PixelBtn onClick={confirmParty} disabled={!allFilled} color="#7c3aed" fullWidth size="lg">
              {allFilled ? "> LFG! <" : "NAME ALL 4 DEGENS TO CONTINUE"}
            </PixelBtn>
          </div>
        </div>
      </div>
    );
  }

  // ── SHOP ──
  if (phase === "shop") {
    const shopItemsList = [
      { key: "audits", name: "Smart Contract Audit", emoji: "🔍", cost: 100, desc: "Reduces chance of exploits" },
      { key: "hardwareWallets", name: "Hardware Wallet", emoji: "🔐", cost: 80, desc: "Cures afflictions & heals" },
      { key: "vpn", name: "VPN Subscription", emoji: "🛡️", cost: 50, desc: "Protects against phishing" },
      { key: "aiAgent", name: "AI Trading Agent", emoji: "🤖", cost: 120, desc: "Autonomous bot (risky)" },
    ];
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "550px", margin: "0 auto", padding: "40px 20px" }}>
          <h2 style={{ textAlign: "center", color: "#f59e0b", fontSize: "22px", marginBottom: "4px", letterSpacing: "3px" }}>
            GENESIS BLOCK STORE
          </h2>
          <div style={{ textAlign: "center", fontSize: "10px", color: "#fff", marginBottom: "6px", letterSpacing: "2px" }}>
            STOCK UP BEFORE YOU HIT THE CHAIN
          </div>
          <div style={{ textAlign: "center", fontSize: "13px", color: "#10b981", marginBottom: "6px" }}>
            WALLET: {eth} ETH
          </div>
          <div style={{ textAlign: "center", color: "#fff", marginBottom: "24px", fontSize: "10px", letterSpacing: "1px" }}>
            CLASS: {playerClass?.emoji} {playerClass?.name?.toUpperCase()}
          </div>
          <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
            {shopItemsList.map((item, i) => (
              <div key={item.key} style={{
                padding: "14px", background: "#0a0a12", border: "2px solid #1a1a2e",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                animation: `pixelSlideUp 0.3s ease-out ${i * 0.08}s both`,
              }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "1px" }}>{item.emoji} {item.name.toUpperCase()}</div>
                  <div style={{ fontSize: "10px", color: "#fff", letterSpacing: "1px" }}>{item.desc}</div>
                  <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>
                    OWNED:{(shopItems as Record<string, number>)[item.key]} | COST:{item.cost} ETH
                  </div>
                </div>
                <PixelBtn onClick={() => buyItem(item.key, item.cost)} disabled={eth < item.cost} color="#10b981" size="sm">
                  BUY
                </PixelBtn>
              </div>
            ))}
          </div>
          <div style={{
            padding: "10px", background: "#0a0a18", border: "2px solid #1a1a3e",
            marginBottom: "20px", fontSize: "10px", color: "#06b6d4", textAlign: "center", letterSpacing: "1px",
          }}>
            TIP: HW WALLETS CURE AFFLICTIONS. AI AGENTS ARE POWERFUL BUT UNPREDICTABLE.
          </div>
          <PixelBtn onClick={leaveShop} color="#10b981" fullWidth size="lg">
            {'>'} HIT THE CHAIN {'<'}
          </PixelBtn>
        </div>
      </div>
    );
  }

  // ── EVENT SCREEN ──
  if (phase === "event" && currentEvent) {
    const colorMap: Record<string, string> = { good: "#10b981", bad: "#ef4444", neutral: "#f59e0b" };
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}{flashOverlay}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <EventPrompt type={currentEvent.type}>
            {/* Animated pixel art header */}
            <PixelEventIcon eventTitle={currentEvent.title} animFrame={animFrame} />
            <div style={{ marginBottom: "16px" }}>
              <PixelEventCanvas animFrame={animFrame} eventType={currentEvent.type} />
            </div>

            <div style={{
              fontSize: "11px", color: "#fff", letterSpacing: "4px", marginBottom: "8px",
              animation: eventAnimPhase >= 1 ? "pixelFadeIn 0.3s ease-out" : "none",
              opacity: eventAnimPhase >= 1 ? 1 : 0,
              textTransform: "uppercase",
            }}>
              {currentEvent.type === "good" ? "// INCOMING TRANSMISSION //" : currentEvent.type === "bad" ? "!! ALERT !!" : ">> STATUS UPDATE <<"}
            </div>

            <h2 style={{
              color: colorMap[currentEvent.type], fontSize: "20px", marginBottom: "12px",
              letterSpacing: "2px",
              animation: eventAnimPhase >= 1 ? "eventBounce 0.5s ease-out" : "none",
              opacity: eventAnimPhase >= 1 ? 1 : 0,
              textShadow: `0 0 20px ${colorMap[currentEvent.type]}44`,
            }}>
              {currentEvent.title}
            </h2>

            <p style={{
              color: "#aaa", fontSize: "13px", marginBottom: "24px", lineHeight: "1.7",
              animation: eventAnimPhase >= 2 ? "pixelFadeIn 0.4s ease-out" : "none",
              opacity: eventAnimPhase >= 2 ? 1 : 0,
            }}>
              {currentEvent.message}
            </p>

            <div style={{
              animation: eventAnimPhase >= 2 ? "pixelSlideUp 0.3s ease-out" : "none",
              opacity: eventAnimPhase >= 2 ? 1 : 0,
            }}>
              <PixelBtn onClick={resolveEvent} color={colorMap[currentEvent.type]} textColor={currentEvent.type === "neutral" ? "#000" : "white"}>
                {'>'} CONTINUE {'<'}
              </PixelBtn>
            </div>
          </EventPrompt>
        </div>
      </div>
    );
  }

  // ── BRIDGE SCREEN ──
  if (phase === "bridge") {
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}{flashOverlay}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
          <EventPrompt type="neutral">
            <div style={{ marginBottom: "16px" }}>
              <PixelBridgeCanvas animFrame={animFrame} />
            </div>
            <h2 style={{
              color: "#06b6d4", fontSize: "22px", marginBottom: "8px", letterSpacing: "3px",
              animation: eventAnimPhase >= 1 ? "eventBounce 0.5s ease-out" : "none",
              opacity: eventAnimPhase >= 1 ? 1 : 0,
            }}>
              {currentLandmark?.name?.toUpperCase() || "THE BRIDGE"}
            </h2>
            <p style={{
              color: "#fff", fontSize: "12px", marginBottom: "24px", letterSpacing: "1px",
              animation: eventAnimPhase >= 2 ? "pixelFadeIn 0.3s ease-out" : "none",
              opacity: eventAnimPhase >= 2 ? 1 : 0,
            }}>
              {currentLandmark?.description || "A cross-chain bridge stands before you. How will you cross?"}
            </p>
            {bridgeState ? (
              <div style={{
                padding: "16px", background: "#0a0a18", border: `2px solid ${bridgeState.outcome === "safe" ? "#10b981" : "#ef4444"}`,
                animation: "eventBounce 0.4s ease-out",
              }}>
                <h3 style={{ color: bridgeState.outcome === "safe" ? "#10b981" : "#ef4444", marginBottom: "6px", letterSpacing: "2px", fontSize: "14px" }}>
                  {bridgeState.title.toUpperCase()}
                </h3>
                <p style={{ color: "#888", fontSize: "12px" }}>{bridgeState.message}</p>
              </div>
            ) : (
              <div style={{
                display: "grid", gap: "8px",
                animation: eventAnimPhase >= 2 ? "pixelSlideUp 0.3s ease-out" : "none",
                opacity: eventAnimPhase >= 2 ? 1 : 0,
              }}>
                <PixelBtn onClick={() => attemptBridge("official")} color="#10b981" fullWidth>
                  {'>'} OFFICIAL BRIDGE (SAFER) {'<'}
                </PixelBtn>
                <PixelBtn onClick={() => attemptBridge("sketchy")} color="#ef4444" fullWidth>
                  {'>'} SKETCHY BRIDGE (FAST) {'<'}
                </PixelBtn>
                <PixelBtn onClick={() => attemptBridge("wait")} color="#f59e0b" textColor="#000" fullWidth>
                  {'>'} WAIT AND WATCH (+2 DAYS) {'<'}
                </PixelBtn>
              </div>
            )}
          </EventPrompt>
        </div>
      </div>
    );
  }

  // ── LANDMARK SCREEN ──
  if (phase === "landmark" && currentLandmark) {
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
          <EventPrompt type="good">
            <div style={{
              fontSize: "48px", marginBottom: "12px",
              animation: "eventBounce 0.6s ease-out",
            }}>{currentLandmark.emoji}</div>
            <h2 style={{
              color: "#f59e0b", fontSize: "22px", marginBottom: "8px", letterSpacing: "3px",
              animation: eventAnimPhase >= 1 ? "pixelFadeIn 0.3s ease-out" : "none",
              opacity: eventAnimPhase >= 1 ? 1 : 0,
            }}>
              {currentLandmark.name.toUpperCase()}
            </h2>
            <p style={{
              color: "#888", fontSize: "12px", marginBottom: "24px", lineHeight: "1.6", letterSpacing: "0.5px",
              animation: eventAnimPhase >= 2 ? "pixelFadeIn 0.3s ease-out" : "none",
              opacity: eventAnimPhase >= 2 ? 1 : 0,
            }}>
              {currentLandmark.description}
            </p>
            <div style={{
              display: "grid", gap: "8px",
              animation: eventAnimPhase >= 2 ? "pixelSlideUp 0.3s ease-out" : "none",
              opacity: eventAnimPhase >= 2 ? 1 : 0,
            }}>
              {currentLandmark.type === "dex" && (
                <PixelBtn onClick={startTrade} color="#7c3aed" fullWidth>
                  {'>'} OPEN DEGEN TERMINAL {'<'}
                </PixelBtn>
              )}
              <PixelBtn onClick={() => {
                setMorale((m) => Math.min(100, m + 10));
                setParty(party.map((p) => p.alive ? { ...p, health: Math.min(100, p.health + 15) } : p));
                addLog(`Rested at ${currentLandmark.name}. Party recovered.`);
                setPhase("trail");
              }} color="#10b981" fullWidth>
                {'>'} REST AND RECOVER {'<'}
              </PixelBtn>
              <PixelBtn onClick={() => setPhase("trail")} color="#333" textColor="#888" fullWidth>
                {'>'} KEEP MOVING {'<'}
              </PixelBtn>
            </div>
          </EventPrompt>
        </div>
      </div>
    );
  }

  // ── TRADE SCREEN ──
  if (phase === "trade" && tradeState) {
    const isMaxRounds = tradeState.rounds >= tradeState.maxRounds;
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}{flashOverlay}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px" }}>
          <EventPrompt type="neutral">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#fff", letterSpacing: "4px", marginBottom: "8px" }}>
                // DEGEN TRADING TERMINAL //
              </div>
              <div style={{ fontSize: "10px", color: "#fff", marginBottom: "20px", letterSpacing: "2px" }}>
                ROUND {tradeState.rounds + 1}/{tradeState.maxRounds} | {market.emoji} {market.name.toUpperCase()}
              </div>
              <div style={{
                padding: "16px", background: "#050510", border: "2px solid #1a1a2e",
                marginBottom: "16px",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "6px" }}>{tradeState.token.emoji}</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff", letterSpacing: "2px" }}>{tradeState.token.name}</div>
                <div style={{
                  fontSize: "28px", fontWeight: "900", color: "#f59e0b", margin: "10px 0",
                  textShadow: "0 0 20px #f59e0b33",
                }}>
                  {tradeState.price} ETH
                </div>
                <div style={{ fontSize: "10px", color: "#fff", letterSpacing: "1px" }}>
                  HOLDING: {tradeState.bought} | WALLET: {eth} ETH
                </div>
              </div>
              <div style={{ display: "grid", gap: "6px", gridTemplateColumns: "1fr 1fr", marginBottom: "8px" }}>
                <PixelBtn onClick={() => tradeBuy(1)} disabled={eth < tradeState.price || isMaxRounds} color="#10b981" size="sm">
                  BUY 1
                </PixelBtn>
                <PixelBtn onClick={() => tradeBuy(5)} disabled={eth < tradeState.price * 5 || isMaxRounds} color="#10b981" size="sm">
                  BUY 5
                </PixelBtn>
              </div>
              <div style={{ display: "grid", gap: "6px", gridTemplateColumns: "1fr 1fr" }}>
                <PixelBtn onClick={tradeHodl} disabled={isMaxRounds} color="#f59e0b" textColor="#000" size="sm">
                  HODL
                </PixelBtn>
                <PixelBtn onClick={tradeSell} color="#ef4444" size="sm">
                  {tradeState.bought > 0 ? `SELL (${tradeState.bought * tradeState.price} ETH)` : "EXIT"}
                </PixelBtn>
              </div>
              {isMaxRounds && (
                <div style={{ color: "#ef4444", fontSize: "10px", marginTop: "10px", letterSpacing: "2px", animation: "pixelFlicker 0.5s infinite" }}>
                  !! MARKET CLOSING - SELL OR EXIT !!
                </div>
              )}
            </div>
          </EventPrompt>
        </div>
      </div>
    );
  }

  // ── GAME OVER ──
  if (phase === "gameover") {
    const deathScore = calcScore();
    const deathIsMinting = nftMint.mintState === "minting" || nftMint.mintState === "confirming";
    const deathMintSuccess = nftMint.mintState === "success";
    const deathMintError = nftMint.mintState === "error";

    const handleMintDeathNft = async () => {
      if (!deathNftImage) return;
      if (deathMintError) nftMint.reset();
      // Upload image + metadata and use returned metadata URL as tokenURI
      const result = await uploadNftImage(deathNftImage, {
        type: "death",
        score: deathScore,
        classId: playerClass?.id || "dev",
        survivors: 0,
        days: day,
        miles: milesTraveled,
      });
      nftMint.mint({
        score: deathScore,
        classId: playerClass?.id || "dev",
        survivors: 0,
        days: day,
        tokenURI: result?.metadataUrl || deathNftImage,
      });
    };

    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px 120px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px", animation: "eventBounce 0.6s ease-out" }}>
            💀
          </div>
          <h1 style={{
            color: "#ef4444", fontSize: "32px", marginBottom: "8px", letterSpacing: "6px",
            textShadow: "3px 3px 0px #991111",
          }}>REKT</h1>
          <p style={{ color: "#fff", fontSize: "13px", marginBottom: "6px", letterSpacing: "1px" }}>
            YOUR ENTIRE PARTY HAS BEEN WIPED OUT.
          </p>
          <p style={{ color: "#fff", fontSize: "11px", marginBottom: "24px", letterSpacing: "1px" }}>
            {milesTraveled} MILES IN {day} DAYS
          </p>

          {/* Death NFT Preview */}
          <div style={{
            position: "relative", margin: "0 auto 24px", maxWidth: "320px",
            overflow: "hidden",
            border: "3px solid #ef4444",
            boxShadow: "0 0 30px #ef444466",
            background: "#0a0a0f",
          }}>
            {(deathNftMintState === "idle" || deathNftMintState === "generating") && (
              <div style={{
                width: "100%", aspectRatio: "1/1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", background: "#0a0a12",
              }}>
                <div style={{ fontSize: "36px", marginBottom: "12px", animation: "spin 2s linear infinite" }}>💀</div>
                <div style={{ color: "#fff", fontSize: "11px", letterSpacing: "2px" }}>GENERATING DEATH NFT...</div>
                <div style={{
                  marginTop: "12px", width: "100px", height: "4px", background: "#1a1a2e", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", background: "#ef4444",
                    animation: "loading 1.5s ease-in-out infinite",
                    width: "60%",
                  }} />
                </div>
              </div>
            )}

            {deathNftImage && deathNftMintState !== "idle" && deathNftMintState !== "generating" && (
              <div style={{ animation: "nftReveal 0.6s ease-out" }}>
                <img src={deathNftImage} alt="Crypto Trail Death NFT" style={{ width: "100%", display: "block", imageRendering: "pixelated" }} />
              </div>
            )}

            {deathNftImage && deathNftMintState !== "generating" && (
              <div style={{
                position: "absolute", top: "6px", right: "6px",
                padding: "2px 8px",
                background: "#ef444422",
                border: "2px solid #ef4444",
                color: "#ef4444",
                fontSize: "9px", fontWeight: "900", textTransform: "uppercase",
                letterSpacing: "2px",
              }}>
                REKT
              </div>
            )}

            {/* Minted badge overlay */}
            {deathMintSuccess && (
              <div style={{
                position: "absolute", bottom: "6px", left: "6px",
                padding: "2px 8px",
                background: "#ef444433",
                border: "2px solid #ef4444",
                color: "#ef4444",
                fontSize: "9px", fontWeight: "900", letterSpacing: "2px",
              }}>
                MINTED ON BASE
              </div>
            )}
          </div>

          {/* Mint Death NFT Button */}
          {deathNftImage && deathNftMintState === "ready" && !deathMintSuccess && (
            <div style={{ marginBottom: "16px" }}>
              {isConnected ? (
                <PixelBtn
                  onClick={handleMintDeathNft}
                  color={deathIsMinting ? "#333" : "#ef4444"}
                  size="lg"
                  fullWidth
                  disabled={deathIsMinting}
                >
                  {deathIsMinting
                    ? (nftMint.mintState === "minting" ? "CONFIRM IN WALLET..." : "MINTING ON BASE...")
                    : nftMint.nftContractConfigured
                      ? "> MINT DEATH NFT <"
                      : "> MINT NFT (CONTRACT PENDING) <"
                  }
                </PixelBtn>
              ) : (
                <PixelBtn onClick={() => connectWallet()} color="#7c3aed" size="lg" fullWidth>
                  {'>'} CONNECT WALLET TO MINT {'<'}
                </PixelBtn>
              )}
              <div style={{ fontSize: "9px", color: "#fff", marginTop: "6px", letterSpacing: "1px" }}>
                FREE MINT — GAS ONLY (~$0.01 ON BASE)
              </div>
            </div>
          )}

          {/* Mint success + Share Mint button */}
          {deathMintSuccess && (
            <>
              <div style={{
                padding: "10px", background: "#1a0a0a", border: "2px solid #ef4444",
                marginBottom: "12px", fontSize: "11px", color: "#ef4444", letterSpacing: "1px",
              }}>
                DEATH NFT MINTED ON BASE L2
                {nftMint.txHash && (
                  <div style={{ marginTop: "4px" }}>
                    <a
                      href={`https://basescan.org/tx/${nftMint.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#06b6d4", fontSize: "9px", letterSpacing: "1px" }}
                    >
                      VIEW ON BASESCAN
                    </a>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <PixelBtn
                  onClick={async () => {
                    setSharing(true);
                    await shareGameCast(
                      `I got REKT on Crypto Trail and minted my Death NFT on Base 💀 ${milesTraveled} miles in ${day} days. Score: ${deathScore.toLocaleString()}.\n\nThink you can make it to Mainnet?`,
                      deathNftImage
                    );
                    setSharing(false);
                  }}
                  color="#7c3aed"
                  size="lg"
                  fullWidth
                  disabled={sharing}
                >
                  {sharing ? "UPLOADING NFT..." : "> SHARE DEATH NFT ON FARCASTER <"}
                </PixelBtn>
              </div>
            </>
          )}

          {/* Mint error */}
          {deathMintError && (
            <div style={{
              padding: "8px", background: "#1a0a0a", border: "2px solid #ef4444",
              marginBottom: "16px", fontSize: "10px", color: "#ef4444", letterSpacing: "1px",
            }}>
              {nftMint.errorMsg || "MINT FAILED"}
              <div style={{ marginTop: "4px" }}>
                <span
                  onClick={handleMintDeathNft}
                  style={{ color: "#fff", fontSize: "9px", cursor: "pointer", textDecoration: "underline" }}
                >
                  TAP TO RETRY
                </span>
              </div>
            </div>
          )}

          {/* Download button */}
          {deathNftImage && deathNftMintState === "ready" && (
            <div style={{ marginBottom: "16px" }}>
              <PixelBtn onClick={downloadDeathNFT} color="#333" textColor="#888" fullWidth size="sm">
                {'>'} DOWNLOAD IMAGE {'<'}
              </PixelBtn>
            </div>
          )}

          {/* Score panel */}
          <div style={{
            padding: "14px", background: "#0a0a12", border: "2px solid #1a1a2e",
            marginBottom: "16px", textAlign: "left",
          }}>
            <div style={{
              fontSize: "13px", fontWeight: "700", marginBottom: "10px", textAlign: "center",
              color: "#ef4444", letterSpacing: "2px",
            }}>
              SCORE: {deathScore.toLocaleString()} -- REKT
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11px" }}>
              <div style={{ color: "#fff" }}>ETH: <span style={{ color: "#ef4444" }}>{eth}</span></div>
              <div style={{ color: "#fff" }}>USDC: <span style={{ color: "#ef4444" }}>{stables}</span></div>
              <div style={{ color: "#fff" }}>TOKENS: <span style={{ color: "#ef4444" }}>{tokens}</span></div>
              <div style={{ color: "#fff" }}>MORALE: <span style={{ color: "#ef4444" }}>{morale}</span></div>
              <div style={{ color: "#fff" }}>MILES: <span style={{ color: "#ef4444" }}>{milesTraveled}</span></div>
              <div style={{ color: "#fff" }}>DAYS: <span style={{ color: "#06b6d4" }}>{day}</span></div>
            </div>
          </div>

          {tombstones.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#fff", marginBottom: "6px", letterSpacing: "2px" }}>FALLEN DEGENS</div>
              {tombstones.map((t, i) => (
                <div key={i} style={{ fontSize: "9px", color: "#fff", marginBottom: "2px", letterSpacing: "0.5px" }}>
                  {t.epitaph}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <PixelBtn
              onClick={async () => {
                setSharing(true);
                await shareGameCast(
                  `Crypto Trail just REKT me 💀 ${milesTraveled} miles in ${day} days before I got rugged. Think you can make it to Mainnet? 👇`,
                  deathNftImage,
                  `${APP_URL}/images/share/defeat.png`
                );
                setSharing(false);
              }}
              color="#7c3aed"
              fullWidth
              disabled={sharing}
            >
              {sharing ? "UPLOADING..." : "SHARE"}
            </PixelBtn>
            <PixelBtn onClick={() => window.location.reload()} color="#333" textColor="#888" fullWidth>
              TRY AGAIN
            </PixelBtn>
          </div>
          {leaderboard.length > 0 && (
            <div style={{ marginTop: "12px", textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "#fff", marginBottom: "8px", letterSpacing: "2px", textAlign: "center" }}>LEADERBOARD</div>
              {leaderboard.slice(0, 5).map((e, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "4px 8px",
                  background: i === 0 ? "#1a1a0a" : "#0a0a12", borderBottom: "1px solid #1a1a2e",
                  fontSize: "10px", color: i === 0 ? "#ffd700" : "#fff",
                }}>
                  <span>{i + 1}. {e.name}</span>
                  <span>{e.score?.toLocaleString()} {e.survived ? "✓" : "💀"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── VICTORY ──
  if (phase === "victory") {
    const score = calcScore();
    const rarity = getRarityTier(score);
    const rarityColors: Record<string, string> = { legendary: "#ffd700", epic: "#a855f7", rare: "#06b6d4", common: "#10b981" };
    const rarityGlows: Record<string, string> = { legendary: "0 0 40px #ffd70066", epic: "0 0 30px #a855f766", rare: "0 0 20px #06b6d466", common: "none" };
    const isMinting = nftMint.mintState === "minting" || nftMint.mintState === "confirming";
    const mintSuccess = nftMint.mintState === "success";
    const mintError = nftMint.mintState === "error";

    const handleMintNft = async () => {
      if (!nftImage) return;
      if (mintError) nftMint.reset();
      // Upload image + metadata and use returned metadata URL as tokenURI
      const result = await uploadNftImage(nftImage, {
        type: "victory",
        score,
        classId: playerClass?.id || "dev",
        survivors: aliveMemberCount,
        days: day,
        miles: milesTraveled,
      });
      nftMint.mint({
        score,
        classId: playerClass?.id || "dev",
        survivors: aliveMemberCount,
        days: day,
        tokenURI: result?.metadataUrl || nftImage,
      });
    };

    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px 120px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "#fff", letterSpacing: "4px", marginBottom: "12px" }}>// TRANSMISSION RECEIVED //</div>
          <h1 style={{
            fontSize: "26px", marginBottom: "4px", fontWeight: "900", letterSpacing: "3px",
            color: "#10b981",
            textShadow: "2px 2px 0px #06b6d4, 4px 4px 0px #7c3aed",
          }}>
            YOU MADE IT TO MAINNET!
          </h1>
          <p style={{ color: "#fff", fontSize: "11px", marginBottom: "24px", letterSpacing: "2px" }}>
            {day} DAYS ACROSS THE CRYPTO FRONTIER
          </p>

          {/* NFT Preview */}
          <div style={{
            position: "relative", margin: "0 auto 24px", maxWidth: "320px",
            overflow: "hidden",
            border: `3px solid ${rarityColors[rarity]}`,
            boxShadow: rarityGlows[rarity],
            background: "#0a0a0f",
          }}>
            {(nftMintState === "idle" || nftMintState === "generating") && (
              <div style={{
                width: "100%", aspectRatio: "1/1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", background: "#0a0a12",
              }}>
                <div style={{ fontSize: "36px", marginBottom: "12px", animation: "spin 2s linear infinite" }}>⛓️</div>
                <div style={{ color: "#fff", fontSize: "11px", letterSpacing: "2px" }}>GENERATING 8-BIT NFT...</div>
                <div style={{
                  marginTop: "12px", width: "100px", height: "4px", background: "#1a1a2e", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", background: rarityColors[rarity],
                    animation: "loading 1.5s ease-in-out infinite",
                    width: "60%",
                  }} />
                </div>
              </div>
            )}

            {nftImage && nftMintState !== "idle" && nftMintState !== "generating" && (
              <div style={{ animation: "nftReveal 0.6s ease-out" }}>
                <img src={nftImage} alt="Crypto Trail NFT" style={{ width: "100%", display: "block", imageRendering: "pixelated" }} />
              </div>
            )}

            {nftImage && nftMintState !== "generating" && (
              <div style={{
                position: "absolute", top: "6px", right: "6px",
                padding: "2px 8px",
                background: rarityColors[rarity] + "22",
                border: `2px solid ${rarityColors[rarity]}`,
                color: rarityColors[rarity],
                fontSize: "9px", fontWeight: "900", textTransform: "uppercase",
                letterSpacing: "2px",
              }}>
                {rarity}
              </div>
            )}

            {/* Minted badge overlay */}
            {mintSuccess && (
              <div style={{
                position: "absolute", bottom: "6px", left: "6px",
                padding: "2px 8px",
                background: "#10b98133",
                border: "2px solid #10b981",
                color: "#10b981",
                fontSize: "9px", fontWeight: "900", letterSpacing: "2px",
              }}>
                MINTED ON BASE
              </div>
            )}
          </div>

          {/* Mint NFT Button */}
          {nftImage && nftMintState === "ready" && !mintSuccess && (
            <div style={{ marginBottom: "16px" }}>
              {isConnected ? (
                <PixelBtn
                  onClick={handleMintNft}
                  color={isMinting ? "#333" : "#10b981"}
                  size="lg"
                  fullWidth
                  disabled={isMinting}
                >
                  {isMinting
                    ? (nftMint.mintState === "minting" ? "CONFIRM IN WALLET..." : "MINTING ON BASE...")
                    : nftMint.nftContractConfigured
                      ? "> MINT NFT TO WALLET (BASE) <"
                      : "> MINT NFT (CONTRACT PENDING) <"
                  }
                </PixelBtn>
              ) : (
                <PixelBtn onClick={() => connectWallet()} color="#7c3aed" size="lg" fullWidth>
                  {'>'} CONNECT WALLET TO MINT {'<'}
                </PixelBtn>
              )}
              <div style={{ fontSize: "9px", color: "#fff", marginTop: "6px", letterSpacing: "1px" }}>
                FREE MINT — GAS ONLY (~$0.01 ON BASE)
              </div>
            </div>
          )}

          {/* Mint success + Share Mint button */}
          {mintSuccess && (
            <>
              <div style={{
                padding: "10px", background: "#0a1a0f", border: "2px solid #10b981",
                marginBottom: "12px", fontSize: "11px", color: "#10b981", letterSpacing: "1px",
              }}>
                NFT MINTED SUCCESSFULLY ON BASE L2
                {nftMint.txHash && (
                  <div style={{ marginTop: "4px" }}>
                    <a
                      href={`https://basescan.org/tx/${nftMint.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#06b6d4", fontSize: "9px", letterSpacing: "1px" }}
                    >
                      VIEW ON BASESCAN
                    </a>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <PixelBtn
                  onClick={async () => {
                    setSharing(true);
                    await shareGameCast(
                      `I survived the crypto frontier and minted my Crypto Trail NFT on Base! Score: ${score.toLocaleString()} (${rarity.toUpperCase()}) in ${day} days.\n\nCan you make it to Mainnet?`,
                      nftImage
                    );
                    setSharing(false);
                  }}
                  color="#7c3aed"
                  size="lg"
                  fullWidth
                  disabled={sharing}
                >
                  {sharing ? "UPLOADING NFT..." : "> SHARE MINT ON FARCASTER <"}
                </PixelBtn>
              </div>
            </>
          )}

          {/* Mint error */}
          {mintError && (
            <div style={{
              padding: "8px", background: "#1a0a0a", border: "2px solid #ef4444",
              marginBottom: "16px", fontSize: "10px", color: "#ef4444", letterSpacing: "1px",
            }}>
              {nftMint.errorMsg || "MINT FAILED"}
              <div style={{ marginTop: "4px" }}>
                <span
                  onClick={handleMintNft}
                  style={{ color: "#fff", fontSize: "9px", cursor: "pointer", textDecoration: "underline" }}
                >
                  TAP TO RETRY
                </span>
              </div>
            </div>
          )}

          {/* Download button */}
          {nftImage && nftMintState === "ready" && (
            <div style={{ marginBottom: "16px" }}>
              <PixelBtn onClick={downloadNFT} color="#333" textColor="#888" fullWidth size="sm">
                {'>'} DOWNLOAD IMAGE {'<'}
              </PixelBtn>
            </div>
          )}

          {/* Score panel */}
          <div style={{
            padding: "14px", background: "#0a0a12", border: "2px solid #1a1a2e",
            marginBottom: "16px", textAlign: "left",
          }}>
            <div style={{
              fontSize: "13px", fontWeight: "700", marginBottom: "10px", textAlign: "center",
              color: rarityColors[rarity], letterSpacing: "2px",
            }}>
              SCORE: {score.toLocaleString()} -- {rarity.toUpperCase()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11px" }}>
              <div style={{ color: "#fff" }}>ETH: <span style={{ color: "#10b981" }}>{eth}</span></div>
              <div style={{ color: "#fff" }}>USDC: <span style={{ color: "#10b981" }}>{stables}</span></div>
              <div style={{ color: "#fff" }}>TOKENS: <span style={{ color: "#10b981" }}>{tokens}</span></div>
              <div style={{ color: "#fff" }}>MORALE: <span style={{ color: "#10b981" }}>{morale}</span></div>
              <div style={{ color: "#fff" }}>SURVIVORS: <span style={{ color: aliveMemberCount >= 3 ? "#10b981" : "#ef4444" }}>{aliveMemberCount}/4</span></div>
              <div style={{ color: "#fff" }}>DAYS: <span style={{ color: "#06b6d4" }}>{day}</span></div>
            </div>
          </div>

          {tombstones.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#fff", marginBottom: "6px", letterSpacing: "2px" }}>FALLEN DEGENS</div>
              {tombstones.map((t, i) => (
                <div key={i} style={{ fontSize: "9px", color: "#fff", marginBottom: "2px", letterSpacing: "0.5px" }}>
                  {t.epitaph}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <PixelBtn
              onClick={async () => {
                setSharing(true);
                await shareGameCast(
                  `Made it to Mainnet on Crypto Trail! Score: ${score.toLocaleString()} (${rarity.toUpperCase()}) in ${day} days. Can you beat my score?`,
                  nftImage
                );
                setSharing(false);
              }}
              color="#7c3aed"
              fullWidth
              disabled={sharing}
            >
              {sharing ? "UPLOADING..." : "SHARE"}
            </PixelBtn>
            <PixelBtn onClick={() => window.location.reload()} color="#333" textColor="#888" fullWidth>
              PLAY AGAIN
            </PixelBtn>
          </div>

          {leaderboard.length > 0 && (
            <div style={{ textAlign: "left", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#fff", marginBottom: "8px", letterSpacing: "2px", textAlign: "center" }}>LEADERBOARD</div>
              {leaderboard.slice(0, 5).map((e, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "4px 8px",
                  background: i === 0 ? "#1a1a0a" : "#0a0a12", borderBottom: "1px solid #1a1a2e",
                  fontSize: "10px", color: i === 0 ? "#ffd700" : "#fff",
                }}>
                  <span>{i + 1}. {e.name}</span>
                  <span>{e.score?.toLocaleString()} {e.survived ? "✓" : "💀"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN TRAIL SCREEN
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={containerStyle}>
      <style>{CSS}</style>
      {scanlines}{flashOverlay}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "12px 16px 120px" }}>

        {/* HEADER BAR */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 0", borderBottom: "2px solid #1a1a2e", marginBottom: "10px",
        }}>
          <div style={{ fontSize: "14px", fontWeight: "900", color: "#7c3aed", letterSpacing: "2px" }}>CRYPTO TRAIL</div>
          <div style={{ fontSize: "10px", color: "#fff", letterSpacing: "1px" }}>
            DAY {day} | {market.emoji} <span style={{ color: market.color }}>{market.name.toUpperCase()}</span>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#fff", marginBottom: "4px", letterSpacing: "1px",
          }}>
            <span>MILE {milesTraveled}/{totalMiles}</span>
            <span>NEXT: {nextLandmarkInfo.emoji} {nextLandmarkInfo.name.toUpperCase()} ({milesToNext}MI)</span>
          </div>
          <div style={{ height: "8px", background: "#0a0a12", border: "1px solid #1a1a2e", overflow: "hidden", position: "relative" }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: "#7c3aed",
              transition: "width 0.5s ease",
            }} />
            {LANDMARKS.filter((l) => l.miles > 0).map((l) => (
              <div key={l.miles} style={{
                position: "absolute", top: 0, bottom: 0, left: `${(l.miles / totalMiles) * 100}%`,
                width: "2px",
                background: milesTraveled >= l.miles ? "#10b981" : "#222",
              }} />
            ))}
          </div>
        </div>

        {/* TRAIL ANIMATION - PIXEL ART CANVAS */}
        <div style={{ marginBottom: "12px" }}>
          <PixelTrailCanvas
            animFrame={animFrame}
            milesTraveled={milesTraveled}
            totalMiles={totalMiles}
            tombstones={tombstones}
            nextLandmarkEmoji={nextLandmarkInfo.emoji}
            lamboColor="red"
          />
        </div>

        {/* RESOURCES */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "12px",
        }}>
          {[
            { label: "ETH", value: eth, color: "#627eea" },
            { label: "USDC", value: stables, color: "#2775ca" },
            { label: "TKN", value: tokens, color: "#f59e0b" },
            { label: "MORALE", value: morale, color: morale > 50 ? "#10b981" : morale > 25 ? "#f59e0b" : "#ef4444" },
          ].map((r) => (
            <div key={r.label} style={{
              padding: "8px 4px", background: "#0a0a12", border: "2px solid #1a1a2e",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: "900", color: r.color, fontFamily: "monospace" }}>{r.value}</div>
              <div style={{ fontSize: "8px", color: "#fff", textTransform: "uppercase", letterSpacing: "2px", marginTop: "2px" }}>{r.label}</div>
            </div>
          ))}
        </div>

        {/* ITEMS */}
        <div style={{
          display: "flex", gap: "8px", marginBottom: "12px", fontSize: "9px", color: "#fff",
          padding: "6px", background: "#0a0a12", border: "1px solid #1a1a2e",
          justifyContent: "center", flexWrap: "wrap", letterSpacing: "1px",
        }}>
          <span>AUDIT:{shopItems.audits}</span>
          <span style={{ color: "#fff" }}>|</span>
          <span>HW:{shopItems.hardwareWallets}</span>
          <span style={{ color: "#fff" }}>|</span>
          <span>VPN:{shopItems.vpn}</span>
          <span style={{ color: "#fff" }}>|</span>
          <span>AI:{shopItems.aiAgent}</span>
        </div>

        {/* PARTY */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#fff", marginBottom: "6px", fontWeight: "700", letterSpacing: "2px" }}>
            DEGEN SQUAD
          </div>
          <div style={{ display: "grid", gap: "4px" }}>
            {party.map((member) => (
              <div key={member.id} style={{
                padding: "8px 10px", background: member.alive ? "#0a0a12" : "#050508",
                border: `2px solid ${member.alive ? (member.health > 50 ? "#0a2e0a" : member.health > 25 ? "#2e2a0a" : "#2e0a0a") : "#111"}`,
                opacity: member.alive ? 1 : 0.4,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <span style={{ fontWeight: "700", color: member.alive ? "#ccc" : "#444", fontSize: "12px", letterSpacing: "1px" }}>
                    {member.alive ? ">" : "X"} {member.name.toUpperCase()}
                  </span>
                  {member.affliction && (
                    <span style={{ fontSize: "10px", color: "#ef4444", marginLeft: "8px", letterSpacing: "1px" }}>
                      [{member.affliction.name.toUpperCase()}]
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {member.alive && (
                    <div style={{ width: "50px", height: "6px", background: "#111", overflow: "hidden", border: "1px solid #222" }}>
                      <div style={{
                        height: "100%",
                        width: `${member.health}%`,
                        background: member.health > 50 ? "#10b981" : member.health > 25 ? "#f59e0b" : "#ef4444",
                        transition: "width 0.3s",
                      }} />
                    </div>
                  )}
                  {member.alive && member.affliction && shopItems.hardwareWallets > 0 && (
                    <button onClick={() => useHardwareWallet(member.id)} style={{
                      padding: "2px 6px", fontSize: "8px", background: "#7c3aed",
                      color: "white", border: "none", cursor: "pointer",
                      fontFamily: "'Courier New', monospace", letterSpacing: "1px",
                    }}>HEAL</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PACE */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#fff", marginBottom: "4px", letterSpacing: "2px" }}>PACE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
            {(["slow", "normal", "fast", "degen"] as const).map((p) => (
              <button key={p} onClick={() => setPace(p)} style={{
                padding: "6px 2px", fontSize: "9px", fontWeight: pace === p ? "700" : "400",
                background: pace === p ? "#7c3aed" : "#0a0a12",
                color: pace === p ? "white" : "#555",
                border: `2px solid ${pace === p ? "#7c3aed" : "#1a1a2e"}`,
                borderBottom: pace === p ? "2px solid #5b21b6" : "4px solid #111",
                cursor: "pointer", fontFamily: "'Courier New', monospace",
                textTransform: "uppercase", letterSpacing: "1px",
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* LOG */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#fff", marginBottom: "4px", letterSpacing: "2px" }}>TRAIL LOG</div>
          <div ref={logRef} style={{
            height: "80px", overflow: "auto", background: "#050508",
            border: "2px solid #1a1a2e", padding: "6px",
            fontSize: "10px", lineHeight: "1.6",
          }}>
            {log.length === 0 ? (
              <div style={{ color: "#fff", letterSpacing: "1px" }}>{'>'} AWAITING INPUT...</div>
            ) : (
              log.map((entry, i) => (
                <div key={i} style={{ color: "#fff" }}>
                  <span style={{ color: "#fff" }}>[D{entry.day}]</span> {entry.text}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "12px 16px",
          background: "linear-gradient(transparent, #0a0a0f 20%)",
        }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <PixelBtn onClick={advanceDay} color="#7c3aed" fullWidth size="lg">
              {'>'} ADVANCE TRAIL ({paceMap[pace]} MI/DAY) {'<'}
            </PixelBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
