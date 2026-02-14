// ── SPONSORED TOKEN REWARDS CONFIG ──
// Maps trail event titles to their ERC-20 token reward info.
// Update addresses and amounts once token contracts are confirmed.

export interface SponsoredToken {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  rewardAmount: bigint;
  eventTitle: string;
  displayAmount: string;
}

// Placeholder addresses — replace with real Base mainnet token addresses
export const SPONSORED_TOKENS: SponsoredToken[] = [
  {
    symbol: "BETR",
    name: "Betrmint",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: 0n,
    eventTitle: "BETR POKER CHAMPION",
    displayAmount: "2,500 BETR",
  },
  {
    symbol: "BRND",
    name: "BRND",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: 0n,
    eventTitle: "BRND MINI APP WINNER",
    displayAmount: "40,000 BRND",
  },
  {
    symbol: "DAU",
    name: "DAU",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: 0n,
    eventTitle: "DAU CO-SPONSOR",
    displayAmount: "1,000 DAU",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    decimals: 6,
    rewardAmount: 0n,
    eventTitle: "FARCASTER MINI APP",
    displayAmount: "$0.01 USDC",
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
