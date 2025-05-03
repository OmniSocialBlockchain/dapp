import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { usePublicClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Proposal {
  id: string;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  votes: Record<string, number>;
}

const mockProposal: Proposal = {
  id: '1',
  title: 'Proposal #1',
  description: 'This is a test proposal for voting demonstration.',
  options: ['For', 'Against', 'Abstain'],
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  votes: {
    For: 100,
    Against: 50,
    Abstain: 25,
  },
};

export function VoteProposal() {
  const { address } = useUser();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const handleVote = async () => {
    try {
      if (!selectedOption) {
        throw new Error('Please select an option');
      }

      // In a real implementation, you would call your DAO contract here
      console.log('Voting:', selectedOption);
      
      toast({
        title: 'Success',
        description: 'Vote submitted successfully',
      });
      
      setSelectedOption('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit vote',
        variant: 'destructive',
      });
    }
  };

  const totalVotes = Object.values(mockProposal.votes).reduce((a, b) => a + b, 0);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Vote on Proposal</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mockProposal.title}</DialogTitle>
            <DialogDescription>{mockProposal.description}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <RadioGroup
              value={selectedOption}
              onValueChange={setSelectedOption}
              className="space-y-2"
            >
              {mockProposal.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option}>
                    {option} ({((mockProposal.votes[option] / totalVotes) * 100).toFixed(1)}%)
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVote} disabled={!selectedOption}>
              Submit Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 