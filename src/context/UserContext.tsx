import { createContext, useContext, useState, ReactNode } from "react"
import { useAccount } from "wagmi"

interface UserContextType {
  walletAddress: string | undefined
  activePersona: any | null
  setActivePersona: (persona: any | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount()
  const [activePersona, setActivePersona] = useState<any | null>(null)

  return (
    <UserContext.Provider
      value={{
        walletAddress: address,
        activePersona,
        setActivePersona,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
} 