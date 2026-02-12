import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { headers } from 'next/headers'
import Web3Provider from './providers'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crypto-trail-game.vercel.app";

export const metadata: Metadata = {
  title: 'Crypto Trail - 8-Bit Degen Edition',
  description: 'A degen Oregon Trail for Farcaster. Survive rug pulls, rogue AI agents, and bridge exploits on your 900-mile journey to Mainnet.',
  generator: 'v0.app',
  openGraph: {
    title: 'Crypto Trail - 8-Bit Degen Edition',
    description: 'Lead your party of 4 degens from Genesis Block to Mainnet. Trade memecoins, cross sketchy bridges, dodge rug pulls, and fight off rogue AI agents.',
    images: ['https://i.postimg.cc/Y2d3rm4D/Crypto-Trail-share-URL.png'],
  },
  other: {
    'fc:frame': JSON.stringify({
      version: "1",
      imageUrl: "https://i.postimg.cc/Y2d3rm4D/Crypto-Trail-share-URL.png",
      button: {
        title: "Play Crypto Trail",
        action: {
          type: "launch_frame",
          name: "Crypto Trail",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/images/CryptoTrail-Splash.png`,
          splashBackgroundColor: "#0a0a0f",
        },
      },
    }),
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hdrs = await headers()
  const cookies = hdrs.get('cookie')

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Web3Provider cookies={cookies}>
          {children}
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
