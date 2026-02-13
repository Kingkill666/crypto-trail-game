"use client";

import { config } from "./config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

export default function Web3Provider({
  children,
}: {
  children: ReactNode;
  cookies?: string | null;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
