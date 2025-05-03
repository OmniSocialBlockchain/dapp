import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { useToast } from '@/hooks/use-toast';

interface SimulationResult {
  success: boolean;
  gasUsed: bigint;
  error?: string;
}

export function useTransactionSimulation() {
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateTransaction = async (
    to: `0x${string}`,
    value: string,
    data: `0x${string}`
  ): Promise<SimulationResult> => {
    setIsSimulating(true);
    try {
      const result = await publicClient.call({
        to,
        value: parseEther(value),
        data,
      });

      return {
        success: true,
        gasUsed: result.gasUsed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Transaction Simulation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        success: false,
        gasUsed: 0n,
        error: errorMessage,
      };
    } finally {
      setIsSimulating(false);
    }
  };

  return {
    simulateTransaction,
    isSimulating,
  };
} 