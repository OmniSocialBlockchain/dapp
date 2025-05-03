import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useTransactionSimulation } from '@/features/security/useTransactionSimulation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Transaction {
  to: `0x${string}`;
  value: string;
  data: `0x${string}`;
}

export function BatchTransactions() {
  const { address } = useUser();
  const { toast } = useToast();
  const { simulateTransaction } = useTransactionSimulation();
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction>({
    to: '0x',
    value: '0',
    data: '0x',
  });

  const addTransaction = () => {
    if (!currentTransaction.to || !currentTransaction.value) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setTransactions([...transactions, currentTransaction]);
    setCurrentTransaction({ to: '0x', value: '0', data: '0x' });
  };

  const removeTransaction = (index: number) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  const executeBatch = async () => {
    try {
      // Simulate each transaction first
      for (const tx of transactions) {
        const result = await simulateTransaction(tx.to, tx.value, tx.data);
        if (!result.success) {
          throw new Error(`Transaction simulation failed: ${result.error}`);
        }
      }

      // In a real implementation, you would send the batch transaction here
      // using a smart contract that can execute multiple transactions
      console.log('Executing batch transactions:', transactions);
      
      toast({
        title: 'Success',
        description: 'Batch transactions executed successfully',
      });
      
      setTransactions([]);
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute batch transactions',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Batch Transactions</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Transactions</DialogTitle>
            <DialogDescription>
              Create and execute multiple transactions in a single batch
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="To Address"
                value={currentTransaction.to}
                onChange={(e) => setCurrentTransaction({ ...currentTransaction, to: e.target.value as `0x${string}` })}
              />
              <Input
                type="number"
                placeholder="Value (ETH)"
                value={currentTransaction.value}
                onChange={(e) => setCurrentTransaction({ ...currentTransaction, value: e.target.value })}
              />
              <Input
                placeholder="Data (optional)"
                value={currentTransaction.data}
                onChange={(e) => setCurrentTransaction({ ...currentTransaction, data: e.target.value as `0x${string}` })}
              />
              <Button onClick={addTransaction}>Add Transaction</Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx, index) => (
                  <TableRow key={index}>
                    <TableCell>{tx.to}</TableCell>
                    <TableCell>{tx.value} ETH</TableCell>
                    <TableCell>{tx.data}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTransaction(index)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeBatch} disabled={transactions.length === 0}>
              Execute Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 