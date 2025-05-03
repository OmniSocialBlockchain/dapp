import { useAccount } from 'wagmi';
import { WalletList } from '@/components/wallet/WalletList';
import { WalletDetails } from '@/components/wallet/WalletDetails';
import { WalletTransactions } from '@/components/wallet/WalletTransactions';
import { WalletActions } from '@/components/wallet/WalletActions';
import { WalletErrorBoundary } from '@/components/wallet/WalletErrorBoundary';
import { useUser } from '@/context/UserContext';

export default function Home() {
  const { isConnected, address } = useAccount();
  const { activePersona } = useUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <WalletErrorBoundary>
        {!isConnected ? (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Welcome to OmniSocial</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Connect your wallet to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <WalletList />
              {activePersona && address && <WalletActions address={address} />}
            </div>
            <div className="lg:col-span-2 space-y-8">
              {address && <WalletDetails address={address} />}
              {address && <WalletTransactions address={address} />}
            </div>
          </div>
        )}
      </WalletErrorBoundary>
    </div>
  );
} 