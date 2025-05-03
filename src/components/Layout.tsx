'use client'

import { ReactNode } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { PersonaSelector } from '@/components/persona/PersonaSelector';
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isConnected } = useAccount();
  const { activePersona } = useUser();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background">
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-primary-600">
                    OmniSocial
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/dashboard"
                    className="text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/explore"
                    className="text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Explore
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isConnected && activePersona && (
                  <PersonaSelector />
                )}
                <ConnectButton />
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
} 