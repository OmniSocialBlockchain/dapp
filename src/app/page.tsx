'use client'

import { ConnectButton } from "@/components/ConnectButton"
import { PersonaSwitcher } from "@/components/persona/PersonaSelector"
import { Feed } from "@/components/Feed"
import { useAccount } from "wagmi"

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex justify-between items-center mb-8">
          <ConnectButton />
          {isConnected && <PersonaSwitcher />}
        </div>
        {isConnected && <Feed />}
      </div>
    </main>
  )
} 