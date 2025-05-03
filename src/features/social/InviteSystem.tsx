import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/modal';
import { QRCodeSVG } from 'qrcode.react';

export function InviteSystem() {
  const { address } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  const inviteLink = `${window.location.origin}/invite/${address}`;

  const handleInvite = async () => {
    try {
      // In a real implementation, you would send this to your backend
      // and handle the email sending there
      console.log('Sending invite to:', email);
      
      toast({
        title: 'Invite Sent',
        description: `An invite has been sent to ${email}`,
      });
      
      setEmail('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invite. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard',
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Invite Friends</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Friends</DialogTitle>
            <DialogDescription>
              Share your invite link or send an email invitation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={inviteLink} readOnly />
              <Button onClick={copyToClipboard}>Copy</Button>
            </div>
            
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={inviteLink} size={128} />
            </div>
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleInvite} className="w-full">
                Send Email Invite
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 