import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import Factory from '@/abi/OmniWalletFactory.json';
import { Address } from 'viem';

interface Transaction {
  hash: string;
  from: Address;
  to: Address;
  value: bigint;
  timestamp: number;
  status: 'success' | 'failed';
}

interface WalletTransactionsProps {
  address: Address;
}

export function WalletTransactions({ address }: WalletTransactionsProps) {
  const { toast } = useToast();

  const { data: transactions, isLoading, isError, error } = useContractRead({
    address: process.env.NEXT_PUBLIC_FACTORY as Address,
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
            description: error?.message || 'Failed to load transactions',
            variant: 'destructive',
          })}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!txList?.length) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
      </div>

      <div className="space-y-2">
        {txList.map((tx) => (
          <div key={tx.hash} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {tx.status === 'success' ? 'Sent' : 'Failed'} {formatEther(tx.value)} ETH
                </p>
                <p className="text-xs text-muted-foreground">
                  To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(tx.timestamp * 1000, { addSuffix: true })}
                </p>
                <p className={`text-xs ${tx.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 