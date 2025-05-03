'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async (connectorIndex: number) => {
    try {
      setIsConnecting(true)
      await connect({ connector: connectors[connectorIndex] })
      toast.success("Wallet connected successfully")
    } catch (error) {
      console.error("Connection error:", error)
      toast.error("Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast.success("Wallet disconnected successfully")
    } catch (error) {
      console.error("Disconnection error:", error)
      toast.error("Failed to disconnect wallet")
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`} />
          <AvatarFallback>{address?.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDisconnect}>
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending || isConnecting}>
          {(isPending || isConnecting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {connectors.map((connector, index) => (
          <DropdownMenuItem
            key={connector.uid}
            onClick={() => handleConnect(index)}
            disabled={!connector.ready}
          >
            {connector.name}
            {!connector.ready && " (unsupported)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 