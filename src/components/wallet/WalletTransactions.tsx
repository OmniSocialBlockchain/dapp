import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import Factory from '@/abi/OmniWalletFactory.json';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  timestamp: number;
  status: 'success' | 'failed';
}

interface WalletTransactionsProps {
  address: `0x${string}`;
}

export function WalletTransactions({ address }: WalletTransactionsProps) {
  const { toast } = useToast();

  const { data: transactions, isLoading, isError, error } = useContractRead({
    address: process.env.NEXT_PUBLIC_FACTORY as `0x${string}`,
    abi: Factory.abi,
    functionName: 'getWalletTransactions',
    args: [address],
  });

  const txList = transactions as Transaction[] | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Error loading transactions: {error?.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast({
            title: 'Error',
            description: 'Failed to load transactions. Please try again.',
            variant: 'destructive',
          })}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!txList || txList.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No transactions found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <p className="text-sm text-muted-foreground">
          {txList.length} transaction{txList.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4">
        {txList.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm font-medium">
                  {formatEther(tx.value)} ETH
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`)}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(tx.hash);
                  toast({
                    title: 'Copied',
                    description: 'Transaction hash copied to clipboard',
                  });
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 