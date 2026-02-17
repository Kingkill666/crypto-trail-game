import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import { SPONSORED_TOKENS } from "@/lib/sponsored-tokens";
import {
  TokenBalanceStatus,
  calculateClaimsRemaining,
  getBalanceStatus,
  hasRecentAlert,
  recordAlert,
  clearAlert,
  sendOnChainAlert,
  getAlertMessage,
  recordBalanceCheck,
  getLastBalanceCheck,
} from "@/lib/alert-helpers";

const REWARDS_CONTRACT = (process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS || "") as `0x${string}`;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const ALERT_WALLET = "0x257Cbe89968495C3aE8C81BccB8BE7f257CD5f66";

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// GET /api/admin/token-balances?secret=xxx
// Returns current balance status for all sponsored tokens
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const checkOnly = req.nextUrl.searchParams.get("checkOnly") === "true";

  // Require admin secret for security
  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!REWARDS_CONTRACT || REWARDS_CONTRACT.length < 10) {
    return NextResponse.json({ error: "Rewards contract not configured" }, { status: 503 });
  }

  try {
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });

    const balances: TokenBalanceStatus[] = [];
    const alerts: string[] = [];

    // Check each sponsored token
    for (const token of SPONSORED_TOKENS) {
      if (token.rewardAmount === 0n) {
        // Skip tokens not yet configured
        continue;
      }

      // Get balance from contract
      const balance = await client.readContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [REWARDS_CONTRACT],
      });

      const claimsRemaining = calculateClaimsRemaining(balance, token.rewardAmount);
      const status = getBalanceStatus(claimsRemaining);

      const tokenStatus: TokenBalanceStatus = {
        symbol: token.symbol,
        address: token.address,
        balance: balance.toString(),
        claimsRemaining,
        rewardAmount: token.rewardAmount.toString(),
        status,
        lastChecked: Date.now(),
      };

      balances.push(tokenStatus);

      // Send alerts if needed (unless checkOnly mode)
      if (!checkOnly && (status === "critical" || status === "warning")) {
        const alertLevel = status as "warning" | "critical";
        const alreadyAlerted = await hasRecentAlert(token.address, alertLevel);

        if (!alreadyAlerted) {
          // Send on-chain notification
          const success = await sendOnChainAlert(token.address, token.symbol, claimsRemaining, alertLevel);
          if (success) {
            const alertMsg = getAlertMessage(token.symbol, claimsRemaining, alertLevel);
            alerts.push(alertMsg);
            await recordAlert(token.address, token.symbol, claimsRemaining, alertLevel);
          }
        }
      }

      // Clear alert if balance is now healthy
      if (status === "healthy") {
        await clearAlert(token.address);
      }
    }

    // Record that we checked balances
    await recordBalanceCheck();
    const lastCheck = await getLastBalanceCheck();

    return NextResponse.json({
      success: true,
      rewardsContract: REWARDS_CONTRACT,
      alertWallet: ALERT_WALLET,
      balances,
      alerts: alerts.length > 0 ? alerts : null,
      summary: {
        total: balances.length,
        healthy: balances.filter((b) => b.status === "healthy").length,
        warning: balances.filter((b) => b.status === "warning").length,
        critical: balances.filter((b) => b.status === "critical").length,
        empty: balances.filter((b) => b.status === "empty").length,
      },
      lastCheck,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Token balance check error:", message);
    return NextResponse.json({ error: "Failed to check balances", details: message }, { status: 500 });
  }
}

// POST /api/admin/token-balances
// Manually trigger a balance check and send alerts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret } = body;

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trigger a GET request internally
    const url = new URL("/api/admin/token-balances", req.url);
    url.searchParams.set("secret", secret);
    url.searchParams.set("checkOnly", "false");

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to trigger check", details: message }, { status: 500 });
  }
}
