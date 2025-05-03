import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { usePublicClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/modal';

interface Proposal {
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
}

export function CreateProposal() {
  const { address } = useUser();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [proposal, setProposal] = useState<Proposal>({
    title: '',
    description: '',
    options: ['For', 'Against', 'Abstain'],
    startTime: Math.floor(Date.now() / 1000),
    endTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
  });

  const handleCreate = async () => {
    try {
      if (!proposal.title || !proposal.description) {
        throw new Error('Please fill in all required fields');
      }

      // In a real implementation, you would call your DAO contract here
      console.log('Creating proposal:', proposal);
      
      toast({
        title: 'Success',
        description: 'Proposal created successfully',
      });
      
      setProposal({
        title: '',
        description: '',
        options: ['For', 'Against', 'Abstain'],
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create proposal',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create Proposal</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Proposal</DialogTitle>
            <DialogDescription>
              Create a new proposal for the DAO to vote on
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Proposal Title"
                value={proposal.title}
                onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
              />
              <Textarea
                placeholder="Proposal Description"
                value={proposal.description}
                onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                className="min-h-[100px]"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="datetime-local"
                  value={new Date(proposal.startTime * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setProposal({ ...proposal, startTime: Math.floor(new Date(e.target.value).getTime() / 1000) })}
                />
                <Input
                  type="datetime-local"
                  value={new Date(proposal.endTime * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setProposal({ ...proposal, endTime: Math.floor(new Date(e.target.value).getTime() / 1000) })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 