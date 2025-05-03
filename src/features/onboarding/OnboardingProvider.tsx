import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  endOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OmniSocial',
    description: 'Let us guide you through the main features of your web3 social platform.',
    target: '#welcome-section',
    placement: 'bottom',
  },
  {
    id: 'wallet-connect',
    title: 'Connect Your Wallet',
    description: 'Connect your wallet to start interacting with the platform.',
    target: '#connect-wallet-button',
    placement: 'right',
  },
  {
    id: 'persona-create',
    title: 'Create Your Persona',
    description: 'Set up your digital identity with a unique persona.',
    target: '#create-persona-button',
    placement: 'right',
  },
  {
    id: 'send-tokens',
    title: 'Send Tokens',
    description: 'Learn how to send tokens to other users.',
    target: '#send-tokens-section',
    placement: 'top',
  },
  {
    id: 'dao-participation',
    title: 'DAO Participation',
    description: 'Discover how to participate in DAO governance.',
    target: '#dao-section',
    placement: 'left',
  },
];

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useUser();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(defaultSteps);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    if (!hasCompletedOnboarding) {
      setIsOnboarding(true);
    }
  }, []);

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep(0);
  };

  const endOnboarding = () => {
    setIsOnboarding(false);
    localStorage.setItem('hasCompletedOnboarding', 'true');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        steps,
        startOnboarding,
        endOnboarding,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 