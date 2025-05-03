import { useCallback, useEffect, useState } from 'react';
import { useAccount, useWaitForTransaction, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import Factory from '@/abi/OmniWalletFactory.json';

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

  // Prepare the contract write
  const { 
    config, 
    error: prepareError,
    isLoading: isPreparing,
    isError: isPrepareError
  } = usePrepareContractWrite({
    address: process.env.NEXT_PUBLIC_FACTORY as `0x${string}`,
    abi: Factory.abi,
    functionName: 'createWallet',
    args: [],
    value: parseEther('0.01'),
  });

  // Execute the contract write
  const { 
    write, 
    isLoading,
    isSuccess,
    isError,
    error,
    data
  } = useContractWrite(config);

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: txReceipt
  } = useWaitForTransaction({
    hash: data?.hash,
    confirmations: 1,
  });

  useEffect(() => {
    if (config?.request?.gas) {
      setEstimatedGas(config.request.gas);
    }
  }, [config?.request?.gas]);

  // Handle wallet creation
  const createWallet = useCallback(() => {
    if (!isConnected) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (isPreparing) {
      toast({
        title: 'Preparing',
        description: 'Please wait while we prepare the transaction',
      });
      return;
    }

    if (prepareError) {
      toast({
        title: 'Error',
        description: prepareError.message,
        variant: 'destructive',
      });
      return;
    }

    if (!write) {
      toast({
        title: 'Error',
        description: 'Failed to prepare wallet creation',
        variant: 'destructive',
      });
      return;
    }

    write();
  }, [isConnected, isPreparing, prepareError, write, toast]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && data?.hash) {
      setTransactionHash(data.hash);
      toast({
        title: 'Transaction Sent',
        description: 'Your wallet creation transaction has been sent',
      });
    }
  }, [isSuccess, data?.hash, toast]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txReceipt) {
      const receipt = txReceipt as TransactionReceipt;
      if (receipt.status === 'success') {
        const walletCreatedLog = receipt.logs.find(
          (log) => log.topics[0] === '0x0000000000000000000000000000000000000000000000000000000000000000'
        );
        if (walletCreatedLog) {
          const newWalletAddress = `0x${walletCreatedLog.data.slice(26)}`;
          setWalletAddress(newWalletAddress);
          queryClient.invalidateQueries({ queryKey: ['userWallets'] });
          toast({
            title: 'Success',
            description: `Wallet created successfully at ${newWalletAddress}`,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Transaction reverted',
          variant: 'destructive',
        });
      }
    }
  }, [isConfirmed, txReceipt, queryClient, toast]);

  // Handle errors
  useEffect(() => {
    if (isError && error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [isError, error, toast]);

  return {
    isLoading: isLoading || isConfirming,
    isSuccess: isConfirmed,
    isError,
    error,
    createWallet,
    walletAddress,
    estimatedGas,
    isPreparing,
    prepareError,
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