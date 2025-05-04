import { useCallback, useEffect, useState } from 'react';
import { useAccount, useContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import Factory from '@/abi/OmniWalletFactory.json';
import { CONTRACT_ADDRESSES } from '@/config/addresses';

// Type definitions
interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: bigint;
  transactionHash: string;
  logIndex: number;
  blockHash: string;
}

interface TransactionReceipt {
  transactionHash: string;
  blockHash: string;
  blockNumber: bigint;
  logs: Log[];
  status: 'success' | 'reverted';
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

interface CreateWalletResponse {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  createWallet: () => void;
  walletAddress: string | null;
  estimatedGas: bigint | null;
  isPreparing: boolean;
  prepareError: Error | null;
  transactionHash: string | null;
}

export function useCreateWallet(): CreateWalletResponse {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { writeContract: createWallet, isPending: isLoading, isSuccess } = useContractWrite();

  const createWalletHandler = useCallback(async () => {
    try {
      if (!address) {
        throw new Error('Please connect your wallet');
      }

      const result = await createWallet({
        address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniWalletFactory as `0x${string}`,
        abi: Factory.abi,
        functionName: 'createWallet',
        args: [address],
      });

      setTransactionHash(result);
      toast({
        title: 'Success',
        description: 'Wallet creation transaction sent',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [address, createWallet, toast]);

  useEffect(() => {
    if (isSuccess && transactionHash) {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({
        title: 'Success',
        description: 'Wallet created successfully',
      });
    }
  }, [isSuccess, transactionHash, queryClient, toast]);

  return {
    isLoading,
    isSuccess,
    isError: !!error,
    error,
    createWallet: createWalletHandler,
    walletAddress,
    estimatedGas,
    isPreparing: false,
    prepareError: null,
    transactionHash,
  };
}

// Example usage in a component:
/*
import { useCreateWallet } from '@/hooks/useCreateWallet';

export function CreateWalletButton() {
  const { 
    isLoading, 
    isSuccess, 
    isError, 
    error, 
    createWallet,
    walletAddress 
  } = useCreateWallet();

  return (
    <div>
      <Button 
        onClick={createWallet}
        disabled={isLoading}
      >
        {isLoading ? 'Creating...' : 'Create Wallet'}
      </Button>
      
      {isSuccess && walletAddress && (
        <div>
          <p>Wallet created: {walletAddress}</p>
          <Button onClick={() => window.open(`/wallet/${walletAddress}`)}>
            View Wallet
          </Button>
        </div>
      )}
      
      {isError && (
        <p className="text-red-500">
          Error: {error?.message}
        </p>
      )}
    </div>
  );
}
*/ 