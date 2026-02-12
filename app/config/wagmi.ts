"use client";

import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { base } from "@reown/appkit/networks";
import type { CreateConnectorFn } from "wagmi";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

export const networks = [base];

const connectors: CreateConnectorFn[] = [
  coinbaseWallet({
    appName: "Crypto Trail",
    preference: "all",
  }),
  injected({ shimDisconnect: true }),
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  connectors,
});

export const config = wagmiAdapter.wagmiConfig;
