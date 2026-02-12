"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PixelTrailCanvas, PixelTitleCanvas, PixelEventCanvas, PixelBridgeCanvas } from "./pixel-canvas";

// ═══════════════════════════════════════════════════════════════
// CRYPTO TRAIL — A Degen Oregon Trail for Farcaster (8-BIT EDITION)
// ═══════════════════════════════════════════════════════════════

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

const CLASS_SPRITES: Record<string, { pixels: number[][]; colors: Record<string, string>; label: string }> = {
  dev: {
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [0,1,0,1,1,0,1,0],
      [0,1,1,1,1,1,1,0],
      [0,0,1,0,0,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,0,1,0,0,1,0,0],
    ],
    colors: { hair: "#4a4a4a", skin: "#ffcc99", shirt: "#3b82f6", pants: "#1e3a5f", acc: "#00ff88" },
    label: "DEV"
  },
  trader: {
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [0,1,0,1,1,0,1,0],
      [0,1,1,1,1,1,1,0],
      [0,0,0,1,1,0,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1],
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,0,1,0,0,1,0,0],
    ],
    colors: { hair: "#ffd700", skin: "#ffcc99", shirt: "#ef4444", pants: "#333", acc: "#ffd700" },
    label: "TRADER"
  },
  influencer: {
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [0,1,0,1,1,0,1,0],
      [0,1,1,1,1,1,1,0],
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,0,1,0,0,1,0,0],
    ],
    colors: { hair: "#f472b6", skin: "#ffe0bd", shirt: "#8b5cf6", pants: "#4a2080", acc: "#06b6d4" },
    label: "INFLUENCER"
  },
  vc: {
    pixels: [
      [0,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,0],
      [0,1,0,1,1,0,1,0],
      [0,1,1,1,1,1,1,0],
      [0,0,0,1,1,0,0,0],
      [0,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,0],
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,0,1,0,0,1,0,0],
    ],
    colors: { hair: "#333", skin: "#ffcc99", shirt: "#1a1a1a", pants: "#1a1a1a", acc: "#ffd700" },
    label: "VC"
  },
};

const NFT_PALETTES: Record<string, Record<string, string>> = {
  legendary: { sky1: "#1a0a2e", sky2: "#2d1b69", ground: "#0f0f23", accent: "#ffd700", stars: "#fff8dc", frame: "#ffd700", title: "#ffd700" },
  epic:      { sky1: "#0a1628", sky2: "#1a2d5f", ground: "#0f1a0f", accent: "#a855f7", stars: "#e0d0ff", frame: "#a855f7", title: "#c084fc" },
  rare:      { sky1: "#0a1a1a", sky2: "#1a3a3a", ground: "#0f1a12", accent: "#06b6d4", stars: "#b0e0e6", frame: "#06b6d4", title: "#22d3ee" },
  common:    { sky1: "#111118", sky2: "#1a1a2e", ground: "#121212", accent: "#10b981", stars: "#c0c0c0", frame: "#444", title: "#10b981" },
};

const ETH_DIAMOND = [
  [0,0,0,1,0,0,0],
  [0,0,1,1,1,0,0],
  [0,1,0,1,0,1,0],
  [1,0,0,1,0,0,1],
  [0,1,0,1,0,1,0],
  [0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0],
];

const TOMBSTONE_SPRITE = [
  [0,1,1,1,0],
  [1,1,1,1,1],
  [1,0,1,0,1],
  [1,1,1,1,1],
  [1,1,1,1,1],
  [0,1,1,1,0],
];

const MINI_SURVIVOR = [
  [0,1,1,1,0],
  [0,1,1,1,0],
  [0,0,1,0,0],
  [0,1,1,1,0],
  [1,0,1,0,1],
  [0,0,1,0,0],
  [0,1,0,1,0],
];

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

function generateNFTImage(gameData: {
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
}) {
  const { classId, score, survivors, totalParty, days, eth, stables, tokens, morale, partyNames, tombstones: deadNames, playerClass } = gameData;
  const canvas = document.createElement("canvas");
  const W = 400, H = 400;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const rarity = getRarityTier(score);
  const pal = NFT_PALETTES[rarity];
  const sprite = CLASS_SPRITES[classId] || CLASS_SPRITES.dev;
  const seed = hashStats(`${classId}-${score}-${survivors}-${days}-${partyNames.join("")}`);
  const rand = seededRng(seed);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  skyGrad.addColorStop(0, pal.sky1);
  skyGrad.addColorStop(1, pal.sky2);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, H * 0.65, W, H * 0.35);
  ctx.fillStyle = pal.accent + "30";
  ctx.fillRect(0, H * 0.65, W, 2);

  const numStars = 30 + Math.floor(rand() * 40);
  for (let i = 0; i < numStars; i++) {
    const sx = Math.floor(rand() * W);
    const sy = Math.floor(rand() * H * 0.6);
    const ss = rand() > 0.85 ? 3 : rand() > 0.5 ? 2 : 1;
    ctx.fillStyle = pal.stars;
    ctx.globalAlpha = 0.2 + rand() * 0.6;
    ctx.fillRect(sx, sy, ss, ss);
  }
  ctx.globalAlpha = 1;

  if (rarity === "legendary" || rarity === "epic") {
    const px = 4;
    const ox = (W - ETH_DIAMOND[0].length * px) / 2;
    const oy = 40;
    ctx.globalAlpha = rarity === "legendary" ? 0.5 : 0.3;
    ETH_DIAMOND.forEach((row, ry) => {
      row.forEach((p, rx) => {
        if (p) {
          ctx.fillStyle = pal.accent;
          ctx.fillRect(ox + rx * px, oy + ry * px, px, px);
        }
      });
    });
    ctx.globalAlpha = 1;
  }

  (deadNames || []).forEach((_, i) => {
    const tx = 30 + i * 70;
    const ty = H * 0.65 - TOMBSTONE_SPRITE.length * 4;
    const px = 4;
    TOMBSTONE_SPRITE.forEach((row, ry) => {
      row.forEach((p, rx) => {
        if (p) {
          ctx.fillStyle = "#555";
          ctx.fillRect(tx + rx * px, ty + ry * px, px, px);
        }
      });
    });
    ctx.fillStyle = "#888";
    ctx.font = "bold 6px monospace";
    ctx.fillText("RIP", tx + 2, ty + 10);
  });

  const charPx = 6;
  const charX = (W - sprite.pixels[0].length * charPx) / 2;
  const charY = H * 0.65 - sprite.pixels.length * charPx - 4;
  sprite.pixels.forEach((row, ry) => {
    row.forEach((p, rx) => {
      if (p) {
        let color;
        if (ry <= 1) color = sprite.colors.hair;
        else if (ry <= 3) color = sprite.colors.skin;
        else if (ry <= 6) color = sprite.colors.shirt;
        else color = sprite.colors.pants;
        ctx.fillStyle = color;
        ctx.fillRect(charX + rx * charPx, charY + ry * charPx, charPx, charPx);
      }
    });
  });

  const aliveParty = partyNames.filter((_, i) => i < survivors);
  const survivorColors = ["#10b981", "#06b6d4", "#a855f7", "#f59e0b"];
  aliveParty.forEach((_, i) => {
    if (i === 0) return;
    const offset = i <= 1 ? -60 : i === 2 ? 60 : 90;
    const sx = W / 2 + offset - 10;
    const sy = H * 0.65 - MINI_SURVIVOR.length * 3 - 2;
    const mpx = 3;
    MINI_SURVIVOR.forEach((row, ry) => {
      row.forEach((p, rx) => {
        if (p) {
          ctx.fillStyle = survivorColors[i % survivorColors.length];
          ctx.fillRect(sx + rx * mpx, sy + ry * mpx, mpx, mpx);
        }
      });
    });
  });

  const borderW = rarity === "legendary" ? 4 : rarity === "epic" ? 3 : 2;
  ctx.strokeStyle = pal.frame;
  ctx.lineWidth = borderW;
  ctx.strokeRect(borderW / 2, borderW / 2, W - borderW, H - borderW);
  if (rarity === "legendary") {
    const cs = 12;
    ctx.fillStyle = pal.frame;
    ctx.fillRect(0, 0, cs, cs);
    ctx.fillRect(W - cs, 0, cs, cs);
    ctx.fillRect(0, H - cs, cs, cs);
    ctx.fillRect(W - cs, H - cs, cs, cs);
  }

  ctx.fillStyle = pal.title;
  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("CRYPTO TRAIL", W / 2, 28);

  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillStyle = pal.accent;
  ctx.fillText(`[ ${rarity.toUpperCase()} ]`, W / 2, 42);

  ctx.fillStyle = sprite.colors.acc;
  ctx.font = "bold 9px 'Courier New', monospace";
  ctx.fillText(playerClass?.name?.toUpperCase() || sprite.label, W / 2, charY - 8);

  const panelY = H * 0.75;
  ctx.fillStyle = "#000000aa";
  ctx.fillRect(16, panelY, W - 32, H - panelY - 16);
  ctx.strokeStyle = pal.frame + "80";
  ctx.lineWidth = 1;
  ctx.strokeRect(16, panelY, W - 32, H - panelY - 16);

  ctx.textAlign = "left";
  ctx.font = "bold 11px 'Courier New', monospace";
  const statX = 28;
  const statX2 = W / 2 + 10;
  let sy2 = panelY + 16;

  ctx.fillStyle = "#fff";
  ctx.fillText(`SCORE: ${score.toLocaleString()}`, statX, sy2);
  ctx.fillStyle = pal.accent;
  ctx.fillText(`${rarity.toUpperCase()}`, statX2, sy2);
  sy2 += 16;

  ctx.fillStyle = "#888";
  ctx.font = "10px 'Courier New', monospace";
  ctx.fillText(`Survivors: ${survivors}/${totalParty}`, statX, sy2);
  ctx.fillText(`Days: ${days}`, statX2, sy2);
  sy2 += 14;
  ctx.fillText(`ETH: ${eth}`, statX, sy2);
  ctx.fillText(`USDC: ${stables}`, statX2, sy2);
  sy2 += 14;
  ctx.fillText(`Tokens: ${tokens}`, statX, sy2);
  ctx.fillText(`Morale: ${morale}`, statX2, sy2);
  sy2 += 16;

  ctx.fillStyle = "#10b981";
  ctx.font = "bold 9px 'Courier New', monospace";
  const nameStr = aliveParty.join(" * ");
  ctx.textAlign = "center";
  ctx.fillText(nameStr.length > 50 ? nameStr.slice(0, 47) + "..." : nameStr, W / 2, sy2);

  ctx.textAlign = "right";
  ctx.fillStyle = "#333";
  ctx.font = "8px 'Courier New', monospace";
  ctx.fillText(`#${(seed % 99999).toString().padStart(5, "0")}`, W - 20, H - 6);

  return canvas.toDataURL("image/png");
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
  const [riskLevel] = useState("degen");
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
  const [nftMintTx, setNftMintTx] = useState<string | null>(null);
  const [eventAnimPhase, setEventAnimPhase] = useState(0); // 0 = intro, 1 = content, 2 = ready
  const [shopItems, setShopItems] = useState({ audits: 0, hardwareWallets: 0, vpn: 0, aiAgent: 0 });
  const logRef = useRef<HTMLDivElement>(null);

  const totalMiles = 900;
  const paceMap: Record<string, number> = { slow: 8, normal: 14, fast: 22, degen: 30 };
  const riskMap: Record<string, number> = { conservative: 0.6, moderate: 1.0, aggressive: 1.5, degen: 2.5 };

  // Pixel animation timer - faster for smoother 8-bit feel
  useEffect(() => {
    const t = setInterval(() => setAnimFrame((f) => f + 1), 250);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

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
  const startGame = () => setPhase("class_select");

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
    const risk = riskMap[riskLevel];

    let newStables = stables - Math.ceil(party.filter((p) => p.alive).length * 2 * (pace === "degen" ? 2 : 1));
    let newMorale = morale;
    const newEth = eth;
    let updatedParty = [...party];

    if (pace === "degen") newMorale -= 3;
    if (pace === "fast") newMorale -= 1;
    if (pace === "slow") newMorale += 1;

    if (newStables <= 0) {
      newStables = 0;
      newMorale -= 10;
      addLog("Out of stablecoins! Your party is starving for liquidity!");
    }

    updatedParty = updatedParty.map((member) => {
      if (!member.alive) return member;
      let hp = member.health;

      if (member.affliction) {
        hp -= member.affliction.severity * 5;
        if (Math.random() < 0.2) {
          addLog(`${member.name} recovered from ${member.affliction.name}!`);
          return { ...member, health: Math.max(1, hp), affliction: null };
        }
      }

      if (!member.affliction && Math.random() < 0.06 * risk) {
        const aff = pick(AFFLICTIONS);
        addLog(`${aff.emoji} ${member.name} has contracted ${aff.name}!`);
        return { ...member, health: hp, affliction: aff };
      }

      if (pace === "slow" && !member.affliction) hp = Math.min(100, hp + 3);

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

    if (Math.random() < 0.35 * risk) {
      const event = pick(TRAIL_EVENTS);
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
    setTimeout(() => {
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
        const imgDataUrl = generateNFTImage(gameData);
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

  const downloadNFT = () => {
    if (!nftImage) return;
    const link = document.createElement("a");
    link.download = `crypto-trail-nft-${calcScore()}.png`;
    link.href = nftImage;
    link.click();
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

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
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px", letterSpacing: "8px", textTransform: "uppercase", animation: "pixelFlicker 2s infinite" }}>
            {'<'} A FARCASTER MINI APP {'>'}
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 8vw, 64px)", fontWeight: "900", margin: "0 0 4px",
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
            fontSize: "clamp(12px, 2.5vw, 15px)", color: "#666", marginBottom: "32px", maxWidth: "450px",
            lineHeight: "1.6",
          }}>
            The year is 2026. AI took your job, your portfolio is rekt, and you are heading to Mainnet.
            Can you survive rug pulls, rogue AI agents, and bridge exploits?
          </div>

          <div style={{ width: "100%", maxWidth: "500px", marginBottom: "32px" }}>
            <PixelTitleCanvas animFrame={animFrame} />
          </div>

          <PixelBtn onClick={startGame} color="#7c3aed" size="lg">
            {'>'} BEGIN JOURNEY {'<'}
          </PixelBtn>

          <div style={{ marginTop: "24px", fontSize: "9px", color: "#333", maxWidth: "400px", letterSpacing: "2px" }}>
            INSPIRED BY THE OREGON TRAIL (1971) * BUILT FOR FARCASTER * POWERED BY DEGEN ENERGY
          </div>
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
          <div style={{ textAlign: "center", fontSize: "10px", color: "#555", marginBottom: "28px", letterSpacing: "2px" }}>
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
                <div style={{ fontSize: "10px", color: "#555", display: "flex", gap: "16px", letterSpacing: "1px" }}>
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
          <div style={{ textAlign: "center", fontSize: "10px", color: "#555", marginBottom: "28px", letterSpacing: "2px" }}>
            THESE BRAVE DEGENS WILL ACCOMPANY YOU
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: "14px", animation: `pixelSlideUp 0.3s ease-out ${i * 0.1}s both` }}>
              <label style={{ fontSize: "10px", color: "#666", display: "block", marginBottom: "4px", letterSpacing: "2px", textTransform: "uppercase" }}>
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
          <div style={{ textAlign: "center", fontSize: "10px", color: "#555", marginBottom: "6px", letterSpacing: "2px" }}>
            STOCK UP BEFORE YOU HIT THE CHAIN
          </div>
          <div style={{ textAlign: "center", fontSize: "13px", color: "#10b981", marginBottom: "6px" }}>
            WALLET: {eth} ETH
          </div>
          <div style={{ textAlign: "center", color: "#444", marginBottom: "24px", fontSize: "10px", letterSpacing: "1px" }}>
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
                  <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px" }}>{item.desc}</div>
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
            <div style={{ marginBottom: "16px" }}>
              <PixelEventCanvas animFrame={animFrame} eventType={currentEvent.type} />
            </div>

            <div style={{
              fontSize: "11px", color: "#555", letterSpacing: "4px", marginBottom: "8px",
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
              color: "#666", fontSize: "12px", marginBottom: "24px", letterSpacing: "1px",
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
                party.forEach((p) => { if (p.alive) p.health = Math.min(100, p.health + 15); });
                setParty([...party]);
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
              <div style={{ fontSize: "10px", color: "#555", letterSpacing: "4px", marginBottom: "8px" }}>
                // DEGEN TRADING TERMINAL //
              </div>
              <div style={{ fontSize: "10px", color: "#666", marginBottom: "20px", letterSpacing: "2px" }}>
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
                <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px" }}>
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
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <EventPrompt type="bad">
            <div style={{ fontSize: "64px", marginBottom: "16px", animation: "eventBounce 0.6s ease-out" }}>
              💀
            </div>
            <h1 style={{
              color: "#ef4444", fontSize: "32px", marginBottom: "8px", letterSpacing: "6px",
              textShadow: "3px 3px 0px #991111",
            }}>REKT</h1>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "6px", letterSpacing: "1px" }}>
              YOUR ENTIRE PARTY HAS BEEN WIPED OUT.
            </p>
            <p style={{ color: "#444", fontSize: "11px", marginBottom: "24px", letterSpacing: "1px" }}>
              {milesTraveled} MILES IN {day} DAYS
            </p>
            {tombstones.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "10px", color: "#555", marginBottom: "10px", letterSpacing: "2px" }}>TOMBSTONES</div>
                {tombstones.map((t, i) => (
                  <div key={i} style={{
                    padding: "8px", background: "#0a0a12", border: "1px solid #1a1a2e",
                    marginBottom: "4px", fontSize: "10px", color: "#666", letterSpacing: "0.5px",
                  }}>
                    {t.epitaph}
                  </div>
                ))}
              </div>
            )}
            <PixelBtn onClick={() => window.location.reload()} color="#7c3aed" fullWidth>
              {'>'} TRY AGAIN {'<'}
            </PixelBtn>
          </EventPrompt>
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
    return (
      <div style={containerStyle}>
        <style>{CSS}</style>
        {scanlines}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px 120px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: "4px", marginBottom: "12px" }}>// TRANSMISSION RECEIVED //</div>
          <h1 style={{
            fontSize: "26px", marginBottom: "4px", fontWeight: "900", letterSpacing: "3px",
            color: "#10b981",
            textShadow: "2px 2px 0px #06b6d4, 4px 4px 0px #7c3aed",
          }}>
            YOU MADE IT TO MAINNET!
          </h1>
          <p style={{ color: "#666", fontSize: "11px", marginBottom: "24px", letterSpacing: "2px" }}>
            {day} DAYS ACROSS THE CRYPTO FRONTIER
          </p>

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
                <div style={{ color: "#666", fontSize: "11px", letterSpacing: "2px" }}>GENERATING 8-BIT NFT...</div>
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
          </div>

          {nftMintState === "ready" && (
            <div style={{ marginBottom: "20px" }}>
              <PixelBtn onClick={downloadNFT} color="#333" textColor="#888" fullWidth size="sm">
                {'>'} DOWNLOAD IMAGE {'<'}
              </PixelBtn>
            </div>
          )}

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
              <div style={{ color: "#666" }}>ETH: <span style={{ color: "#10b981" }}>{eth}</span></div>
              <div style={{ color: "#666" }}>USDC: <span style={{ color: "#10b981" }}>{stables}</span></div>
              <div style={{ color: "#666" }}>TOKENS: <span style={{ color: "#10b981" }}>{tokens}</span></div>
              <div style={{ color: "#666" }}>MORALE: <span style={{ color: "#10b981" }}>{morale}</span></div>
              <div style={{ color: "#666" }}>SURVIVORS: <span style={{ color: aliveMemberCount >= 3 ? "#10b981" : "#ef4444" }}>{aliveMemberCount}/4</span></div>
              <div style={{ color: "#666" }}>DAYS: <span style={{ color: "#06b6d4" }}>{day}</span></div>
            </div>
          </div>

          {tombstones.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#444", marginBottom: "6px", letterSpacing: "2px" }}>FALLEN DEGENS</div>
              {tombstones.map((t, i) => (
                <div key={i} style={{ fontSize: "9px", color: "#333", marginBottom: "2px", letterSpacing: "0.5px" }}>
                  {t.epitaph}
                </div>
              ))}
            </div>
          )}

          <PixelBtn onClick={() => window.location.reload()} color="#333" textColor="#888" fullWidth>
            {'>'} PLAY AGAIN {'<'}
          </PixelBtn>
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
          <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px" }}>
            DAY {day} | {market.emoji} <span style={{ color: market.color }}>{market.name.toUpperCase()}</span>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#555", marginBottom: "4px", letterSpacing: "1px",
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
              <div style={{ fontSize: "8px", color: "#444", textTransform: "uppercase", letterSpacing: "2px", marginTop: "2px" }}>{r.label}</div>
            </div>
          ))}
        </div>

        {/* ITEMS */}
        <div style={{
          display: "flex", gap: "8px", marginBottom: "12px", fontSize: "9px", color: "#555",
          padding: "6px", background: "#0a0a12", border: "1px solid #1a1a2e",
          justifyContent: "center", flexWrap: "wrap", letterSpacing: "1px",
        }}>
          <span>AUDIT:{shopItems.audits}</span>
          <span style={{ color: "#333" }}>|</span>
          <span>HW:{shopItems.hardwareWallets}</span>
          <span style={{ color: "#333" }}>|</span>
          <span>VPN:{shopItems.vpn}</span>
          <span style={{ color: "#333" }}>|</span>
          <span>AI:{shopItems.aiAgent}</span>
        </div>

        {/* PARTY */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "6px", fontWeight: "700", letterSpacing: "2px" }}>
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
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px", letterSpacing: "2px" }}>PACE</div>
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
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px", letterSpacing: "2px" }}>TRAIL LOG</div>
          <div ref={logRef} style={{
            height: "80px", overflow: "auto", background: "#050508",
            border: "2px solid #1a1a2e", padding: "6px",
            fontSize: "10px", lineHeight: "1.6",
          }}>
            {log.length === 0 ? (
              <div style={{ color: "#222", letterSpacing: "1px" }}>{'>'} AWAITING INPUT...</div>
            ) : (
              log.map((entry, i) => (
                <div key={i} style={{ color: "#666" }}>
                  <span style={{ color: "#333" }}>[D{entry.day}]</span> {entry.text}
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
