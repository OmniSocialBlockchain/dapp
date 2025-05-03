import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { type Connector } from 'wagmi';

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      toast.error(errorMessage);
      console.error('Connection error:', err);
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
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
    <div className="relative">
      <Button
        variant="default"
        onClick={handleConnect}
        disabled={isPending || !connectors[0]}
        className="min-w-[120px]"
        aria-label="Connect wallet"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
} 