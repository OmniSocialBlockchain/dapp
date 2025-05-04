'use client'

import { ReactNode } from 'react'
import { WagmiConfig } from 'wagmi'
import { config } from '@/config/wagmi'
import { ThemeProvider } from './theme/ThemeProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiConfig config={config}>
      <ThemeProvider
        defaultTheme="system"
        storageKey="omni-social-theme"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </WagmiConfig>
  )
} 