import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

export function ConnectButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = useCallback(async () => {
    try {
      if (!connectors[0]) {
        throw new Error('No wallet connector available');
      }
      await connect({ connector: connectors[0] });
      toast.success('Wallet connected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      toast.error(errorMessage);
      console.error('Connection error:', err);
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      toast.error(errorMessage);
      console.error('Disconnection error:', err);
    }
  }, [disconnect]);

  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return 'Disconnect';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <Button
        variant="outline"
        onClick={handleDisconnect}
        className="min-w-[120px]"
        aria-label="Disconnect wallet"
      >
        {formatAddress(address)}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      onClick={handleConnect}
      className="min-w-[120px]"
      disabled={isPending}
      aria-label="Connect wallet"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
    </Button>
  );
} 