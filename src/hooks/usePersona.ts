import { useState, useCallback, useEffect } from 'react';
import { useExecute } from './useExecute';
import { useToast } from '@/components/ui/use-toast';
import { useWalletError } from '@/components/wallet/WalletErrorBoundary';
import { useUser } from '@/context/UserContext';
import { useAccount } from "wagmi";
import { useContractRead } from "wagmi";
import { personaContract } from "@/config/contracts";

interface CreatePersonaParams {
  username: string;
  image: File;
}

interface Persona {
  id: string;
  name: string;
  image?: string;
}

export function usePersona() {
  const { toast } = useToast();
  const { handleError } = useWalletError();
  const { walletAddress, activePersona } = useUser();
  const { address } = useAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);

  const { data: personaCount } = useContractRead({
    ...personaContract,
    functionName: "balanceOf",
    args: [address],
    enabled: !!address,
  });

  useEffect(() => {
    if (personaCount) {
      // Fetch personas for the connected address
      // This is a placeholder - implement actual fetching logic
      setPersonas([
        { id: "1", name: "Default Persona" },
        { id: "2", name: "Work Persona" },
      ]);
    }
  }, [personaCount]);

  const createPersona = useCallback(async ({ username, image }: CreatePersonaParams) => {
    try {
      setIsUploading(true);

      // Upload image to IPFS
      const formData = new FormData();
      formData.append('file', image);
      
      const ipfsResponse = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!ipfsResponse.ok) {
        throw new Error('Failed to upload image to IPFS');
      }

      const { hash: imageHash } = await ipfsResponse.json();

      // Prepare persona data
      const personaData = {
        username,
        image: `ipfs://${imageHash}`,
      };

      // Upload persona metadata to IPFS
      const metadataResponse = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });

      if (!metadataResponse.ok) {
        throw new Error('Failed to upload persona metadata to IPFS');
      }

      const { hash: metadataHash } = await metadataResponse.json();

      // Execute transaction to create persona
      setIsExecuting(true);
      const { executeTransaction } = useExecute(
        walletAddress as `0x${string}`,
        {
          target: process.env.NEXT_PUBLIC_PERSONA_NFT as `0x${string}`,
          value: BigInt(0),
          data: `0x${Buffer.from(metadataHash).toString('hex')}`,
        }
      );

      await executeTransaction();

      toast({
        title: 'Success',
        description: 'Persona created successfully',
      });
    } catch (error) {
      handleError(error as Error, 'create persona');
    } finally {
      setIsUploading(false);
      setIsExecuting(false);
    }
  }, [walletAddress, handleError, toast]);

  const linkPersona = useCallback(async (personaId: string) => {
    try {
      if (!walletAddress) {
        throw new Error('No wallet connected');
      }

      setIsExecuting(true);
      const { executeTransaction } = useExecute(
        walletAddress as `0x${string}`,
        {
          target: process.env.NEXT_PUBLIC_WALLET as `0x${string}`,
          value: BigInt(0),
          data: `0x${Buffer.from(personaId).toString('hex')}`,
        }
      );

      await executeTransaction();

      toast({
        title: 'Success',
        description: 'Persona linked successfully',
      });
    } catch (error) {
      handleError(error as Error, 'link persona');
    } finally {
      setIsExecuting(false);
    }
  }, [walletAddress, handleError, toast]);

  const switchPersona = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    if (persona) {
      setCurrentPersona(persona);
    }
  };

  return {
    createPersona,
    linkPersona,
    isUploading,
    isExecuting,
    activePersona,
    personas,
    currentPersona,
    switchPersona,
  };
} 