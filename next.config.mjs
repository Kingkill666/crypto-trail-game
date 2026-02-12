/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Stub out transitive dependencies from @coinbase/cdp-sdk that we don't need.
  // Chain: wagmi/connectors -> @base-org/account -> @coinbase/cdp-sdk -> @solana/kit, axios
  // We only use Base L2, so Solana deps are unnecessary.
  turbopack: {
    resolveAlias: {
      "@solana/kit": { browser: "" },
      "@solana-program/system": { browser: "" },
      "@solana-program/token": { browser: "" },
      "axios": { browser: "" },
      "axios-retry": { browser: "" },
    },
  },
  serverExternalPackages: [
    "@coinbase/cdp-sdk",
    "@solana/kit",
    "@solana-program/system",
    "@solana-program/token",
  ],
}

export default nextConfig
