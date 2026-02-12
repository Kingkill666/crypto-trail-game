"use client";

import { wagmiAdapter, projectId } from "./config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || "PLACEHOLDER",
  networks: [base],
  defaultNetwork: base,
  metadata: {
    name: "Crypto Trail",
    description:
      "A degen Oregon Trail for Farcaster. Survive rug pulls, rogue AI agents, and bridge exploits on your journey to Mainnet.",
    url: "https://crypto-trail.vercel.app",
    icons: ["/icon.svg"],
  },
  features: { analytics: true },
});

export default function Web3Provider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
