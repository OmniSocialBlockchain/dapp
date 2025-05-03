import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from '@/context/UserContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Layout } from '@/components/layout/Layout';
import { DAODashboard } from '@/features/dao/DAODashboard';
import { BatchTransactions } from '@/features/wallet/BatchTransactions';
import { WalletConnect } from '@/features/wallet/WalletConnect';
import { CustomToken } from '@/features/wallet/CustomToken';
import { PortfolioAnalytics } from '@/features/analytics/PortfolioAnalytics';
import { TransactionInsights } from '@/features/analytics/TransactionInsights';
import { ActivityFeed } from '@/features/social/ActivityFeed';
import { ProfileBadges } from '@/features/social/ProfileBadges';
import { InviteSystem } from '@/features/social/InviteSystem';

function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to OmniSocial</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ActivityFeed />
        <ProfileBadges />
        <InviteSystem />
      </div>
    </div>
  );
}

function Wallet() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Wallet</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <BatchTransactions />
        <WalletConnect />
        <CustomToken />
      </div>
    </div>
  );
}

function Analytics() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      <div className="grid gap-6">
        <PortfolioAnalytics />
        <TransactionInsights />
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="omni-social-theme">
      <Router>
        <UserProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/dao" element={<DAODashboard />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Layout>
        </UserProvider>
      </Router>
    </ThemeProvider>
  );
} 