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
// Reward amounts: $0.01 worth for most, $0.10 for PIZZA
export const SPONSORED_TOKENS: SponsoredToken[] = [
  {
    symbol: "BETR",
    name: "Betrmint",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: BigInt(0), // TODO: Set to $0.01 worth once token price known
    eventTitle: "BETR POKER CHAMPION",
    displayAmount: "$0.01 BETR",
  },
  {
    symbol: "BRND",
    name: "BRND",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: BigInt(0), // TODO: Set to $0.01 worth once token price known
    eventTitle: "BRND MINI APP WINNER",
    displayAmount: "$0.01 BRND",
  },
  {
    symbol: "DAU",
    name: "DAU",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: BigInt(0), // TODO: Set to $0.01 worth once token price known
    eventTitle: "DAU CO-SPONSOR",
    displayAmount: "$0.01 DAU",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    decimals: 6,
    rewardAmount: BigInt(10000), // 0.01 USDC = 10000 (6 decimals)
    eventTitle: "FARCASTER MINI APP",
    displayAmount: "$0.01 USDC",
  },
  {
    symbol: "PIZZA",
    name: "PizzaParty",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: BigInt(0), // TODO: Set to $0.10 worth once token price known
    eventTitle: "PIZZA PARTY FOR VETS",
    displayAmount: "$0.10 PIZZA",
  },
  {
    symbol: "QR",
    name: "QR Token",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    rewardAmount: BigInt(0), // TODO: Set to $0.01 worth once token price known
    eventTitle: "QR ONCHAIN ATTENTION",
    displayAmount: "$0.01 QR",
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
