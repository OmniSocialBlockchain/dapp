import { useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useSessionTimeout() {
  const { disconnect } = useUser();
  const { toast } = useToast();
  let timeoutId: NodeJS.Timeout;

  const resetTimeout = useCallback(() => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      disconnect();
      toast({
        title: 'Session Timeout',
        description: 'Your session has expired. Please reconnect your wallet.',
        variant: 'destructive',
      });
    }, SESSION_TIMEOUT);
  }, [disconnect, toast]);

  useEffect(() => {
    // Set up event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout]);
} 