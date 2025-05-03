import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { usePublicClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Token {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  name: string;
}

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
];

export function CustomToken() {
  const { address } = useUser();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>('0x');
  const [tokens, setTokens] = useState<Token[]>([]);

  const addToken = async () => {
    try {
      if (!tokenAddress) {
        throw new Error('Please enter a token address');
      }

      // Fetch token details
      const [symbol, decimals, name] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'name',
        }),
      ]);

      const newToken: Token = {
        address: tokenAddress,
        symbol: symbol as string,
        decimals: decimals as number,
        name: name as string,
      };

      setTokens([...tokens, newToken]);
      setTokenAddress('0x');
      setIsOpen(false);

      toast({
        title: 'Success',
        description: `Added ${newToken.symbol} token`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add token',
        variant: 'destructive',
      });
    }
  };

  const removeToken = (address: `0x${string}`) => {
    setTokens(tokens.filter((token) => token.address !== address));
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Add Custom Token</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Token</DialogTitle>
            <DialogDescription>
              Add a custom ERC-20 token to your wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Token Address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
            />
            
            <Button onClick={addToken} className="w-full">
              Add Token
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Decimals</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.address}>
                <TableCell>{token.symbol}</TableCell>
                <TableCell>{token.name}</TableCell>
                <TableCell>{token.address}</TableCell>
                <TableCell>{token.decimals}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeToken(token.address)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 