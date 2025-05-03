import { useCreateWallet } from '@/hooks/useCreateWallet';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { formatEther } from 'viem';

export function CreateWalletButton() {
  const { 
    isLoading, 
    isSuccess, 
    isError, 
    error, 
    createWallet,
    walletAddress,
    estimatedGas,
    isPreparing,
    prepareError
  } = useCreateWallet();

  return (
    <div className="flex flex-col gap-4">
      <Button 
        onClick={createWallet}
        disabled={isLoading || isPreparing}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Wallet...
          </>
        ) : isPreparing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing...
          </>
        ) : (
          'Create Wallet'
        )}
      </Button>

      {estimatedGas && (
        <div className="text-sm text-muted-foreground">
          Estimated gas: {formatEther(estimatedGas)} ETH
        </div>
      )}

      {isSuccess && walletAddress && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-green-600">
            Wallet created successfully!
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono">
              {walletAddress}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/wallet/${walletAddress}`)}
            >
              View Wallet
            </Button>
          </div>
        </div>
      )}

      {isError && (
        <div className="text-sm text-red-600">
          {error?.message || 'Failed to create wallet'}
        </div>
      )}

      {prepareError && (
        <div className="text-sm text-yellow-600">
          {prepareError.message}
        </div>
      )}
    </div>
  );
} 