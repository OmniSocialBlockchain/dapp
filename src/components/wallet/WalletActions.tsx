import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import Factory from '@/abi/OmniWalletFactory.json';
import { useWalletError } from './WalletErrorBoundary';
import { Address } from 'viem';

interface WalletActionsProps {
  address: Address;
}

export function WalletActions({ address }: WalletActionsProps) {
  const { toast } = useToast();
  const { handleError } = useWalletError();
  const [recipient, setRecipient] = useState<Address>('0x0000000000000000000000000000000000000000' as Address);
  const [amount, setAmount] = useState('');

  const { writeContract: sendTokens, isPending: isLoading } = useContractWrite();

  const handleSend = async () => {
    try {
      if (!recipient || !amount) {
        toast({
          title: 'Error',
          description: 'Please enter recipient address and amount',
          variant: 'destructive',
        });
        return;
      }

      await sendTokens({
        address,
        abi: Factory.abi,
        functionName: 'sendTokens',
        args: [recipient, parseEther(amount || '0')],
      });

      toast({
        title: 'Success',
        description: 'Tokens sent successfully',
      });
      setRecipient('0x0000000000000000000000000000000000000000' as Address);
      setAmount('');
    } catch (error) {
      handleError(error as Error, 'send tokens');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Wallet Actions</h2>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-sm font-medium mb-4">Send Tokens</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Recipient Address</label>
              <Input
                value={recipient}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value as Address)}
                placeholder="0x..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount (ETH)</label>
              <Input
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                placeholder="0.0"
                type="number"
                step="0.0001"
                min="0"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={isLoading || !recipient || !amount}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Tokens'
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-sm font-medium mb-4">Security</h3>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: Implement security settings
                toast({
                  title: 'Coming Soon',
                  description: 'Security settings will be available soon',
                });
              }}
            >
              Manage Permissions
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: Implement recovery settings
                toast({
                  title: 'Coming Soon',
                  description: 'Recovery settings will be available soon',
                });
              }}
            >
              Recovery Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 