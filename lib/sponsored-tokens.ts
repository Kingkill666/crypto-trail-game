// ── SPONSORED TOKEN REWARDS CONFIG ──
// Maps trail event titles to their ERC-20 token reward info.
// Update addresses and amounts once token contracts are confirmed.

export interface SponsoredToken {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  rewardAmount: bigint; // Base amount ($0.01 worth)
  eventTitle: string;
  displayAmount: string;
  randomReward?: boolean; // If true, multiply by random 1-5x ($0.01-$0.05)
}

// Reward amounts: Base $0.01 (randomReward: true = $0.01-$0.05), $0.10 for PIZZA
export const SPONSORED_TOKENS: SponsoredToken[] = [
  {
    symbol: "BETR",
    name: "Betrmint",
    address: "0x051024B653E8ec69E72693F776c41C2A9401FB07",
    decimals: 18,
    rewardAmount: BigInt("4572790000000000000000"), // $0.01 worth at $0.000002187 per token (~4,572.79 BETR)
    eventTitle: "BETR POKER CHAMPION",
    displayAmount: "BETR",
    randomReward: true,
  },
  {
    symbol: "BRND",
    name: "BRND",
    address: "0x41Ed0311640A5e489A90940b1c33433501a21B07",
    decimals: 18,
    rewardAmount: BigInt("25252530000000000000000"), // $0.01 worth at $0.000000396 per token (~25,252.53 BRND)
    eventTitle: "BRND MINI APP WINNER",
    displayAmount: "BRND",
    randomReward: true,
  },
  {
    symbol: "DAU",
    name: "DAU",
    address: "0xe3A7766d0361f50a3Dd038C967479673B75f8B34",
    decimals: 18,
    rewardAmount: BigInt("52910000000000000000"), // $0.01 worth at $0.0001890 per token (~52.91 DAU)
    eventTitle: "DAU CO-SPONSOR",
    displayAmount: "DAU",
    randomReward: true,
  },
  {
    symbol: "JESSE",
    name: "Jesse",
    address: "0x50F88fe97f72CD3E75b9Eb4f747F59BcEBA80d59",
    decimals: 18,
    rewardAmount: BigInt("4000000000000000000"), // $0.01 worth at $0.0025 per token (~4 JESSE)
    eventTitle: "JESSE POLLAK APED IN",
    displayAmount: "JESSE",
    randomReward: true,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    decimals: 6,
    rewardAmount: BigInt(10000), // 0.01 USDC = 10000 (6 decimals)
    eventTitle: "FARCASTER MINI APP",
    displayAmount: "USDC",
    randomReward: true,
  },
  {
    symbol: "PIZZA",
    name: "PizzaParty",
    address: "0xa821f2ee19F4f62e404C934D43eB6E5763fbdb07",
    decimals: 18,
    rewardAmount: BigInt("71326530000000000000000"), // $0.10 worth at $0.000001402 per token (~71,326.53 PIZZA)
    eventTitle: "PIZZA PARTY FOR VETS",
    displayAmount: "PIZZA",
    randomReward: false, // Fixed amount, not random
  },
  {
    symbol: "QR",
    name: "QR Token",
    address: "0x2b5050F01d64FBb3e4Ac44dc07f0732BFb5ecadF",
    decimals: 18,
    rewardAmount: BigInt("1108780000000000000000"), // $0.01 worth at $0.000009019 per token (~1,108.78 QR)
    eventTitle: "QR ONCHAIN ATTENTION",
    displayAmount: "QR",
    randomReward: true,
  },
];

export const SPONSORED_EVENT_TITLES = new Set(
  SPONSORED_TOKENS.map((t) => t.eventTitle)
);

export function getSponsoredToken(
  eventTitle: string
): SponsoredToken | undefined {
  return SPONSORED_TOKENS.find((t) => t.eventTitle === eventTitle);
}

/** Apply random 1-5x multiplier for randomReward tokens, or return base amount for fixed (PIZZA). */
export function getRandomizedRewardAmount(token: SponsoredToken): bigint {
  if (!token.randomReward) return token.rewardAmount;
  const multiplier = Math.floor(Math.random() * 5) + 1; // 1-5x
  return token.rewardAmount * BigInt(multiplier);
}
