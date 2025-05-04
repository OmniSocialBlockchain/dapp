import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Factory from '@/abi/OmniWalletFactory.json';
import { useContractRead } from 'wagmi';
import { useWalletError } from './WalletErrorBoundary';
import { useEffect } from 'react';
import { Address } from 'viem';

interface Wallet {
  address: Address;
  balance: string;
  isActive: boolean;
}

export function WalletList() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { handleError, handleRetry } = useWalletError();

  // Fetch wallet count
  const { data: walletCount, isLoading: isLoadingCount, error: countError } = useContractRead({
    address: process.env.NEXT_PUBLIC_FACTORY as Address,
    abi: Factory.abi,
    functionName: 'getWalletCount',
    args: [address || '0x0000000000000000000000000000000000000000'],
    enabled: !!address,
  });

  // Fetch all wallets
  const { data: wallets, isLoading: isLoadingWallets, error: walletsError } = useContractRead({
    address: process.env.NEXT_PUBLIC_FACTORY as Address,
    abi: Factory.abi,
    functionName: 'getAllWallets',
    args: [address || '0x0000000000000000000000000000000000000000'],
    enabled: !!address,
  });

  const isLoading = isLoadingCount || isLoadingWallets;
  const walletList = wallets as Address[] | undefined;

  // Handle errors
  useEffect(() => {
    if (countError) {
      handleError(countError, 'wallet count');
    }
    if (walletsError) {
      handleError(walletsError, 'wallet list');
    }
  }, [countError, walletsError, handleError]);

  if (!address) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Please connect your wallet to view your wallets</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!walletList?.length) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No wallets found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Wallets</h2>
        <p className="text-sm text-muted-foreground">
          {walletList.length} wallet{walletList.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4">
        {walletList.map((walletAddress) => (
          <div
            key={walletAddress}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div>
                <p className="font-mono text-sm">{walletAddress}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  toast({
                    title: 'Copied',
                    description: 'Wallet address copied to clipboard',
                  });
                }}
              >
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`)}
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 