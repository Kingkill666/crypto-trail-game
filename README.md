# CRYPTO TRAIL - 8-Bit Degen Edition

### A Farcaster Mini App inspired by The Oregon Trail (1971)

> *The year is 2026. AI took your job, your portfolio is rekt, and you're heading to Mainnet. Can you survive rug pulls, rogue AI agents, and bridge exploits?*

---

## What Is Crypto Trail?

Crypto Trail is a survival strategy game built as a **Farcaster Mini App**. You lead a party of 4 crypto degens on a dangerous 900-mile journey across the blockchain -- from **Genesis Block** to **Mainnet (The Promised Chain)**. Along the way you'll face random events, deadly afflictions, cross-chain bridges, DEX trading terminals, and the constant threat of losing everything.

The game features full **8-bit pixel art** rendered on HTML5 Canvas -- including a driveable Lamborghini sprite, scrolling cityscapes, animated event screens, CRT monitor effects, and a generative NFT system that creates a unique 8-bit neon cyberpunk commemorative image of your run.

It is designed to run inside the Farcaster client at **424x695px** (web) or full-screen on mobile, with Farcaster SDK integration for sharing scores as casts.

---

## How to Play

### Phase 1: Choose Your Class

You pick one of four starting classes. Each class determines your starting resources and gives you a unique passive bonus.

| Class | Emoji | Starting ETH | Starting USDC | Starting Tokens | Bonus |
|-------|-------|-------------|---------------|-----------------|-------|
| **Solidity Developer** | dev | 800 | 400 | 200 | AI audits cost 50% less |
| **Degen Trader** | trader | 1,200 | 200 | 100 | Trading gains +30% |
| **CT Influencer** | influencer | 600 | 600 | 300 | Party morale decays 50% slower |
| **Crypto VC** | vc | 2,000 | 300 | 50 | Start with more capital |

**Strategy tip:** The VC starts rich but has almost no tokens. The Influencer has balanced resources and morale protection -- great for beginners. The Trader is high-risk/high-reward with a big ETH stack.

### Phase 2: Name Your Squad

You name all 4 party members. The first is your **Party Leader** (you). The other 3 are your fellow degens. Each one has their own health bar and can contract afflictions, get healed, or die during the journey.

### Phase 3: Genesis Block Store

Before setting off, you can buy supplies with your starting ETH:

| Item | Cost | Effect |
|------|------|--------|
| **Smart Contract Audit** | 100 ETH | Reduces chance of exploits on the trail |
| **Hardware Wallet** | 80 ETH | **Cures afflictions** and heals +20 HP (consumable) |
| **VPN Subscription** | 50 ETH | Protects against phishing events |
| **AI Trading Agent** | 120 ETH | Autonomous trading bot -- powerful but unpredictable |

**Key tip:** Hardware Wallets are the only way to cure afflictions mid-journey. Buy at least 2-3.

### Phase 4: The Trail

This is the main gameplay loop. Each day you press **ADVANCE** to travel forward. Here's what happens every day:

1. **Miles traveled** -- Based on your pace setting (see below)
2. **Stablecoin drain** -- Your party consumes USDC each day (more at higher pace)
3. **Morale shift** -- Changes based on pace, events, and conditions
4. **Health checks** -- Party members can contract afflictions, recover, or die
5. **Random events** -- Trail events, landmarks, bridge crossings, or trading opportunities

---

## Core Mechanics

### Pace System

Pace is the single most important decision you make each day. It controls your speed, danger level, resource cost, and healing:

| Pace | Miles/Day | Event Chance | Affliction Chance | Morale Effect | USDC Cost | Special |
|------|-----------|-------------|-------------------|---------------|-----------|---------|
| **Slow** | 8 mi | 17% | 3% per member | +1/day | 1x | Heals party +3 HP/day |
| **Normal** | 14 mi | 35% | 6% per member | Neutral | 1x | Balanced |
| **Fast** | 22 mi | 63% | 11% per member | -1/day | 1.5x | -- |
| **Degen** | 30 mi | 100% (guaranteed!) | 18% per member | -3/day | 2x | Maximum chaos |

**Key insight:** Degen pace guarantees a random event every single day. This can be devastating -- or incredibly lucky if you roll good events. Slow pace is the only pace that heals your party.

### Resources

You manage four resources throughout the game:

- **ETH** -- Your main currency. Used for trading, lost in bad events, needed for survival.
- **USDC (Stablecoins)** -- Consumed daily to feed your party. Running out causes -10 morale per day.
- **Tokens** -- Accumulated from airdrops and events. Contribute to your final score.
- **Morale** -- 0-100 scale. Affected by pace, events, and stablecoin availability. Contributes to your final score.

### Afflictions

Party members can contract 16 different crypto-themed afflictions, each with a severity rating (1-4) that determines how much HP they lose per day:

| Severity | HP Loss/Day | Examples |
|----------|------------|---------|
| 1 (Mild) | 5 HP | Gas Fee Fever, FOMO Infection, Governance Fatigue, AI Agent Dependency |
| 2 (Moderate) | 10 HP | Impermanent Loss, Bear Market Depression, Prompt Injection Flu, Replaced-by-Bot Anxiety |
| 3 (Severe) | 15 HP | Rug Pull PTSD, Flash Loan Shock, MEV Poisoning, AI Hallucination Virus, Sentient Contract Paranoia |
| 4 (Critical) | 20 HP | Seed Phrase Amnesia, Overleverage Syndrome, Deepfake Identity Crisis |

- Each day, afflicted members have a **20% chance to recover naturally**
- **Hardware Wallets** instantly cure any affliction and heal +20 HP
- If a member's HP reaches 0, they **die** with a random death message and a tombstone is placed on the trail
- Slow pace heals non-afflicted members by +3 HP/day

### Death

When a party member dies, you'll see a screen shake, red flash, and one of 19 unique death messages like:
- *"was replaced by an AI agent that traded better"*
- *"got prompt-injected into approving a drain transaction"*
- *"argued with a sentient smart contract and lost"*

A tombstone is placed at the mile they died, visible as pixel crosses in the trail canvas. If **all 4 members die**, the game ends.

### Market Conditions

The market cycles between three states based on a sine wave tied to the day counter:

- **Bull Market** -- Appears when cycle > 0.7
- **Crab Market** -- Appears when cycle is 0.3-0.7
- **Bear Market** -- Appears when cycle < 0.3

Market condition is displayed in the trail header and affects the mood of the trail.

---

## Trail Events

Every day (based on your pace's event chance), you may encounter one of **27 random events** across three categories:

### Good Events (12 types)
These give you resources, ETH, tokens, or morale boosts:
- **AIRDROP!** -- +150-350 tokens
- **PUMP!** -- +300-700 ETH
- **NFT FLIP** -- +500 ETH
- **BUG BOUNTY** -- +400 ETH, +200 USDC
- **AI AGENT ALPHA** -- +500 ETH, +10 morale
- **GPT PREDICTS THE DIP** -- +600 ETH
- **AI DEV SPEEDRUN** -- +300 ETH, +150 tokens
- **FARCASTER FREN** -- +20 morale, +100 tokens
- **YIELD HARVEST** -- +250 USDC
- **BASED MOMENT** -- +25 morale
- **AI AUDIT SAVES YOU** -- +20 morale
- **AI ART SELLS** -- +300 ETH

### Bad Events (10 types)
These drain your resources and crush morale:
- **RUG PULL!** -- Lose 300-500 ETH, -20 morale
- **LIQUIDATED** -- Lose 50% of ETH, -25 morale
- **AI BOT GONE ROGUE** -- Lose 400 ETH, -20 morale
- **AI FLASH CRASH** -- Lose 50% of ETH, -20 morale
- **WALLET DRAINED!** -- Lose 400 ETH and 200 USDC
- **PROMPT INJECTION ATTACK** -- Lose 350 USDC, -15 morale
- **DEEPFAKE SCAM** -- Lose 300 ETH
- **AI HALLUCINATION** -- Lose 350 ETH and 150 USDC
- **GAS SPIKE!** -- Lose 200 ETH
- **BEAR MARKET** -- Lose 30% of ETH, -15 morale

### Neutral Events (5 types)
Mild effects, sometimes small token gains:
- **CHAIN FORK** -- No effect
- **GOVERNANCE VOTE** -- +50 tokens
- **CT DRAMA** -- +5 morale
- **BOT VS BOT** -- +10 morale
- **AI WRITES A WHITEPAPER** -- +100 tokens

Each event has a unique **pixel art sprite icon** (48x48) and a multi-layered animation canvas -- rising gold diamonds for good events, glitch effects for bad events, data streams for neutral events.

---

## Landmarks

The 900-mile trail has **11 landmarks**. When you reach one, you can rest, trade, or keep moving:

| Mile | Landmark | Type | What Happens |
|------|----------|------|-------------|
| 0 | Genesis Block | Start | Your journey begins |
| 80 | Ethereum Mainnet | DEX | Rest or open trading terminal |
| 160 | Uniswap Pools | DEX | Rest or trade |
| 250 | The Bridge | Bridge | Choose how to cross (see below) |
| 340 | Base Layer 2 | DEX | Rest or trade |
| 430 | AI Agent Hub | Hub | Rest |
| 520 | Farcaster Hub | DEX | Rest or trade |
| 610 | The Neural Network | Hub | Rest |
| 710 | DeFi Yield Farms | DEX | Rest or trade |
| 800 | The Mempool | Bridge | Choose how to cross |
| 900 | Mainnet | End | **YOU WIN!** |

At **DEX landmarks**, you can open the **Degen Trading Terminal** (see Trading below). At all landmarks, **resting** gives +10 morale and heals all living party members +15 HP.

---

## Bridge Crossings

At miles 250 and 800, you face a cross-chain bridge. You choose one of three methods:

| Method | Safe Chance | Delay Chance | Fee Chance | Exploit Chance |
|--------|------------|-------------|-----------|---------------|
| **Official Bridge** (Safer) | 50% | 30% | 20% | 0% |
| **Sketchy Bridge** (Fast) | 30% | 0% | 20% | 50% |
| **Wait and Watch** (+2 days) | 100% | 0% | 0% | 0% |

**Outcomes:**
- **Safe** -- Nothing happens, you cross successfully
- **Delay** -- Stuck for 3 extra days (costs stablecoins)
- **Fee** -- Lose 10% of your ETH
- **Exploit** -- Lose **40% of your ETH** (devastating!)

The bridge screen has its own pixel art canvas showing the bridge structure, data particles crossing, and your Lambo driving across.

---

## Degen Trading Terminal

At DEX landmarks, you can trade memecoins. There are **11 tradeable tokens**, each with different volatility:

| Token | Volatility | Risk Level |
|-------|-----------|-----------|
| $FARCAST | 0.5 | Low |
| $AGENT | 0.6 | Low |
| $HIGHER | 0.6 | Low |
| $BRETT | 0.7 | Medium |
| $CLAUDE | 0.7 | Medium |
| $DEGEN | 0.8 | Medium |
| $GPT | 0.85 | High |
| $PEPE | 0.9 | High |
| $SENTIENT | 0.95 | Very High |
| $RUG | 1.0 | Maximum |
| $SKYNET | 1.0 | Maximum |

**How trading works:**
1. A random token is selected with a random starting price (10-200 ETH)
2. You have **5 rounds** maximum
3. Each round you can: **BUY 1**, **BUY 5**, **HODL** (wait), or **SELL/EXIT**
4. When you HODL, the price changes randomly based on the token's volatility
5. Higher volatility = bigger swings in both directions
6. After 5 rounds, you must sell or exit

**Pro tip:** Low volatility tokens are safer but won't moon. $RUG and $SKYNET can 2x or go to near-zero in a single round.

---

## How to Win

**Reach mile 900 with at least one party member alive.**

When you reach Mainnet, the game calculates your score:

```
Final Score = (Survivors x 500) + ETH + USDC + Tokens + max(0, 1000 - Days x 10) + (Morale x 5)
```

| Component | How to Maximize |
|-----------|----------------|
| **Survival Bonus** | Keep all 4 alive = 2,000 points. Buy Hardware Wallets. Use Slow pace when members are sick. |
| **Wealth Score** | Trade well at DEX landmarks. Hit good events. Avoid bad ones (go slow). |
| **Speed Bonus** | Finish in fewer days. Max 1,000 points at day 0 (impossible), realistically 500-800. Use Fast/Degen pace when healthy. |
| **Morale Bonus** | Keep morale high. Rest at landmarks. Slow pace helps. Max 500 points. |

### Score Rarity Tiers

| Score | Rarity | NFT Theme |
|-------|--------|-----------|
| 6,000+ | **LEGENDARY** | Gold neon glow, corner accents, gold cityscape |
| 4,000+ | **EPIC** | Purple neon glow, corner accents, violet cityscape |
| 2,000+ | **RARE** | Cyan neon glow, blue cityscape |
| Under 2,000 | **COMMON** | Green neon glow, dark cityscape |

---

## Generative NFT

When you win, the game generates a **unique 400x400 8-bit pixel art NFT** with a futuristic neon cyberpunk theme. The image includes:

- **8-bit neon cityscape** -- Procedural pixel skyscrapers with neon-lit windows, rooftop accents, and floating neon signs (WALLET, NFT, GAS, DEFI, BASE, ETH, HODL, GM)
- **Procedural pixel stars** seeded from your game data (every run is different)
- **Your class character sprite** (8x10 pixel art with class-specific neon colors)
- **Pixel survivor sprites** standing beside your character
- **Pixel tombstones** for each fallen party member (neon-tinted)
- **ETH diamond watermark** (Legendary/Epic only)
- **Neon horizon glow line** separating sky from road
- **Road reflections** -- Neon pixel streaks on the ground
- **HUD stats panel** -- Semi-transparent overlay with score, rarity, survivors, days, resources
- **Party names** listed at the bottom
- **Neon frame** with outer glow, crisp inner border, and corner accents (Legendary/Epic)
- **Unique serial number** derived from a hash of your game data
- **Rarity-themed neon palette** -- Gold, purple, cyan, or green depending on score tier

You can download the image as a PNG, mint it on Base L2, or share your score as a Farcaster cast.

---

## Leaderboard

Scores are saved to a persistent leaderboard using Farcaster's shared storage (with localStorage fallback). The leaderboard shows:

- Top 20 scores
- Player name, survival status
- Score values
- Relative timestamps

Access the leaderboard from the victory or gameover screens.

---

## Visual Features

### 8-Bit Pixel Art Canvas System

The game renders multiple HTML5 Canvas animations:

1. **Trail Canvas** (600x120) -- Scrolling parallax cityscape, twinkling stars, road with dashed center lines, Lamborghini sprite with bounce animation and exhaust particles, speed lines, tombstone crosses, next landmark hint, progress bar
2. **Title Canvas** (500x140) -- Lambo driving across a city at night with neon road reflections
3. **Event Canvas** (400x100) -- Multi-layered animations: rising gold diamonds & coin rain (good), glitch scanlines & shockwaves & chromatic aberration (bad), matrix rain & data nodes (neutral)
4. **Event Icon Sprites** (48x48) -- 27 unique pixel art sprites, one per event type (parachute for AIRDROP, rocket for PUMP, bear face for BEAR MARKET, robot for AI BOT GONE ROGUE, etc.)
5. **Bridge Canvas** (400x120) -- Bridge towers and cables, data particles crossing, Lambo driving across, water effects below

### CRT Monitor Aesthetic

- **Scanline overlay** across the entire screen
- **CRT boot animation** on event popups (scaleY 0-1.05-1)
- **Corner brackets** on all event/bridge/trade prompts
- **Border pulse** animation on event frames
- **Screen shake** on deaths and bad events
- **Color flash overlays** (green for good, red for bad)

### Lamborghini Sprite

A 32x12 pixel Lamborghini with 6 color variants (red, yellow, blue, green, purple, neon). The sprite uses a 6-color palette per variant for body, trim, wheels, tires, and headlights. It bounces on the road and trails exhaust particles.

---

## Farcaster Integration

The game is built as a Farcaster Mini App:

- **`sdk.actions.ready()`** -- Called on mount to hide the Farcaster splash screen
- **`sdk.actions.composeCast()`** -- Share your score or defeat as a cast with the game URL embedded
- **Viewport** -- 424x695px on web (Farcaster spec), device-sized on mobile
- **Shared storage** -- Leaderboard persists across all players via `window.storage`
- **Safe degradation** -- Works standalone outside Farcaster (SDK import is optional)

---

## Strategy Guide

### Beginner (Target: Common rarity)
- Pick **CT Influencer** for morale protection
- Buy **3 Hardware Wallets** and **1 VPN**
- Use **Normal pace** throughout
- Rest at every landmark
- Skip trading unless you're desperate

### Intermediate (Target: Rare)
- Pick **Degen Trader** for the ETH stack
- Buy **2 Hardware Wallets**, **1 Audit**, **1 AI Agent**
- Use **Fast pace** when everyone's healthy, **Slow** when someone's sick
- Trade at every DEX (buy low volatility tokens)
- Use Official Bridge always

### Advanced (Target: Epic/Legendary)
- Pick **Crypto VC** for the 2,000 ETH start
- Buy **2 Hardware Wallets**, **2 Audits**
- Alternate between **Fast** and **Degen** pace aggressively
- Trade high-volatility tokens ($SENTIENT, $SKYNET) for massive gains
- Use Sketchy Bridge if your ETH is low (nothing to lose)
- Keep all 4 members alive at all costs (2,000 point survival bonus)

### The Degen Speedrun
- Pick **Degen Trader**
- Buy nothing. Save all ETH
- Set **Degen pace** from day 1
- Pray to the RNG gods
- You'll either get a Legendary score or die on day 3

---

## Technical Details

- **Single-file React component** (~2,600 lines)
- **No external dependencies** beyond React (Canvas rendering is native)
- **Farcaster SDK** loaded dynamically (optional)
- **Persistent storage** via `window.storage` (Farcaster) + `localStorage` (fallback)
- **Pixel-perfect rendering** with `imageRendering: pixelated` on all canvases
- **Animation loop** at 250ms intervals (4 FPS for authentic 8-bit feel)
- **NFT generation** via Canvas API -- 400x400 8-bit neon cyberpunk pixel art
- **27 unique event sprites** -- Each event has a hand-crafted 48x48 pixel icon

---

*Built for Farcaster. Inspired by The Oregon Trail (1971). Powered by degen energy.*
