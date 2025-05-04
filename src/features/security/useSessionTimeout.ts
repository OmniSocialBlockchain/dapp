import { useEffect, useCallback, useRef, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useDisconnect } from 'wagmi';

interface SessionTimeoutOptions {
  timeoutInMinutes?: number;
  warningInMinutes?: number;
  onTimeout?: () => void;
}

const DEFAULT_TIMEOUT = 15; // 15 minutes
const DEFAULT_WARNING = 5; // 5 minutes

export function useSessionTimeout({
  timeoutInMinutes = DEFAULT_TIMEOUT,
  warningInMinutes = DEFAULT_WARNING,
  onTimeout,
}: SessionTimeoutOptions = {}) {
  const { walletAddress } = useUser();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const [showWarning, setShowWarning] = useState(false);

  const handleTimeout = useCallback(() => {
    if (walletAddress) {
      disconnect();
    }
    if (onTimeout) {
      onTimeout();
    }
    toast({
      title: 'Session Timeout',
      description: walletAddress 
        ? 'Your session has expired. Please reconnect your wallet.'
        : 'Your session has expired. Please log in again.',
      variant: 'destructive',
    });
  }, [disconnect, onTimeout, toast, walletAddress]);

  const handleWarning = useCallback(() => {
    setShowWarning(true);
    toast({
      title: 'Session Expiring Soon',
      description: `Your session will expire in ${warningInMinutes} minutes.`,
      duration: warningInMinutes * 60 * 1000,
    });
  }, [toast, warningInMinutes]);

  const resetTimeout = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Reset warning state
    setShowWarning(false);

    // Set new timers
    const warningTime = (timeoutInMinutes - warningInMinutes) * 60 * 1000;
    const timeoutTime = timeoutInMinutes * 60 * 1000;

    warningRef.current = setTimeout(handleWarning, warningTime);
    timeoutRef.current = setTimeout(handleTimeout, timeoutTime);
  }, [handleWarning, handleTimeout, timeoutInMinutes, warningInMinutes]);

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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout]);

  return {
    showWarning,
    resetTimeout,
  };
} 