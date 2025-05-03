import React from 'react';
import { toast } from 'react-hot-toast';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class WalletErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Wallet Error:', error, errorInfo);
    toast.error('An error occurred with your wallet. Please try again.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-4">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please refresh the page and try again
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling wallet errors
export function useWalletError() {
  const { toast } = useToast();

  const handleError = (error: Error, context: string) => {
    console.error(`Wallet Error (${context}):`, error);
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  };

  const handleRetry = (action: () => void) => {
    try {
      action();
    } catch (error) {
      handleError(error as Error, 'retry');
    }
  };

  return {
    handleError,
    handleRetry,
  };
} 