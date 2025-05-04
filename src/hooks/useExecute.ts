import { useContractWrite } from 'wagmi';
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

  const { writeContract: execute, isPending } = useContractWrite();

  const executeTransaction = async () => {
    try {
      if (!params) {
        throw new Error('No transaction parameters provided');
      }

      await execute({
        address: wallet,
        abi: Wallet.abi,
        functionName: 'execute',
        args: [params.target, params.value, params.data],
      });

      toast.success('Transaction executed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute transaction';
      handleError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return {
    executeTransaction,
    isPending,
  };
} 