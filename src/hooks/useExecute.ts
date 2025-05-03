import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { useWalletError } from '@/components/wallet/WalletErrorBoundary';
import Wallet from '@/abi/OmniWallet.json';

interface ExecuteParams {
  target: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
}

export function useExecute(wallet: `0x${string}`, params?: ExecuteParams) {
  const { toast } = useToast();
  const { handleError } = useWalletError();

  const { config, error: prepareError } = usePrepareContractWrite({
    address: wallet,
    abi: Wallet.abi,
    functionName: 'execute',
    args: params ? [params.target, params.value, params.data] : undefined,
    enabled: !!params
  });

  const { 
    write: execute,
    isLoading,
    isSuccess,
    error: writeError 
  } = useContractWrite(config);

  const executeTransaction = async () => {
    try {
      if (!execute) {
        throw new Error('Failed to prepare transaction');
      }

      if (prepareError) {
        handleError(prepareError, 'prepare execute');
        return;
      }

      await execute();

      if (writeError) {
        handleError(writeError, 'execute transaction');
        return;
      }

      if (isSuccess) {
        toast({
          title: 'Success',
          description: 'Transaction executed successfully',
        });
      }
    } catch (error) {
      handleError(error as Error, 'execute transaction');
    }
  };

  return {
    executeTransaction,
    isLoading,
    isSuccess,
    error: writeError || prepareError
  };
} 