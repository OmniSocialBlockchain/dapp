import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isConnected, connect, disconnect } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a href="/" className="transition-colors hover:text-foreground/80">
                Home
              </a>
              <a href="/wallet" className="transition-colors hover:text-foreground/80">
                Wallet
              </a>
              <a href="/dao" className="transition-colors hover:text-foreground/80">
                DAO
              </a>
              <a href="/analytics" className="transition-colors hover:text-foreground/80">
                Analytics
              </a>
            </nav>
          </div>
          <button
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {isConnected ? (
                <Button variant="outline" onClick={disconnect}>
                  Disconnect
                </Button>
              ) : (
                <Button onClick={connect}>Connect Wallet</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
          <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
            <nav className="grid grid-flow-row auto-rows-max text-sm">
              <a href="/" className="flex w-full items-center rounded-md p-2 hover:underline">
                Home
              </a>
              <a href="/wallet" className="flex w-full items-center rounded-md p-2 hover:underline">
                Wallet
              </a>
              <a href="/dao" className="flex w-full items-center rounded-md p-2 hover:underline">
                DAO
              </a>
              <a href="/analytics" className="flex w-full items-center rounded-md p-2 hover:underline">
                Analytics
              </a>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ by OmniSocial
          </p>
        </div>
      </footer>

      {/* Toast Container */}
      <Toaster />
    </div>
  );
} 