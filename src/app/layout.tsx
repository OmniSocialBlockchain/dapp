import './globals.css'
import { Inter } from 'next/font/google'
import { WagmiConfig } from "wagmi"
import { config } from "@/config/wagmi"
import { UserProvider } from "@/context/UserContext"
import { Layout } from "@/components/Layout"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'OmniSocial - Decentralized Social Media',
  description: 'A decentralized social media platform built on Polygon zkEVM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WagmiConfig config={config}>
          <UserProvider>
            <Layout>{children}</Layout>
          </UserProvider>
        </WagmiConfig>
      </body>
    </html>
  )
} 