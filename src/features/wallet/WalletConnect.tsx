import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/modal';
import { QRCodeSVG } from 'qrcode.react';

export function WalletConnect() {
  const { address } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [uri, setUri] = useState('');

  const handleConnect = async () => {
    try {
      // In a real implementation, you would initialize WalletConnect here
      // and generate a connection URI
      console.log('Connecting with URI:', uri);
      
      toast({
        title: 'Connecting',
        description: 'Please approve the connection in your wallet',
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Connect with WalletConnect</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>WalletConnect</DialogTitle>
            <DialogDescription>
              Scan the QR code with your mobile wallet or enter the connection URI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={uri} size={128} />
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="Enter WalletConnect URI"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
              />
              <Button onClick={handleConnect} className="w-full">
                Connect
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 