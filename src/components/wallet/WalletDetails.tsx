import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { useBalance } from 'wagmi';
import Factory from '@/abi/OmniWalletFactory.json';
import { useWalletError } from './WalletErrorBoundary';
import { useEffect } from 'react';
import { Address } from 'viem';

interface WalletDetailsProps {
  address: Address;
}

export function WalletDetails({ address }: WalletDetailsProps) {
  const { toast } = useToast();
  const { handleError, handleRetry } = useWalletError();

  const { data: balance, isLoading: isLoadingBalance, error: balanceError } = useBalance({
    address,
  });

  const { data: isActive, isLoading: isLoadingStatus, error: statusError } = useContractRead({
    address: process.env.NEXT_PUBLIC_FACTORY as Address,
    abi: Factory.abi,
    functionName: 'isWalletActive',
    args: [address],
  });

  const isLoading = isLoadingBalance || isLoadingStatus;

  // Handle errors
  useEffect(() => {
    if (balanceError) {
      handleError(balanceError, 'balance');
    }
    if (statusError) {
      handleError(statusError, 'wallet status');
    }
  }, [balanceError, statusError, handleError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Wallet Details</h2>
          <p className="text-sm text-muted-foreground">{address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(address);
              toast({
                title: 'Copied',
                description: 'Wallet address copied to clipboard',
              });
            }}
          >
            Copy Address
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Balance</p>
              <p className="text-2xl font-bold">
                {balance ? formatEther(balance.value) : '0'} ETH
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => window.open(`https://etherscan.io/address/${address}`)}
          >
            View on Etherscan
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`https://etherscan.io/address/${address}#tokentxns`)}
          >
            View Token Transfers
          </Button>
        </div>
      </div>
    </div>
  );
} 