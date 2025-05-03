import { useQuery, ApolloError } from '@apollo/client';
import { useToast } from '@/components/ui/use-toast';
import { useWalletError } from '@/components/wallet/WalletErrorBoundary';
import { PROFILE_AND_REPUTATION_QUERY } from '@/graphql/queries';
import type { ProfileQueryResponse, ProfileQueryVariables } from '@/graphql/types';

export function useProfile(wallet: string, domain: string) {
  const { toast } = useToast();
  const { handleError } = useWalletError();

  const { 
    data,
    loading: isLoading,
    error,
    refetch
  } = useQuery<ProfileQueryResponse, ProfileQueryVariables>(
    PROFILE_AND_REPUTATION_QUERY,
    {
      variables: { wallet, domain },
      onError: (error: ApolloError) => {
        handleError(error, 'fetch profile');
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      }
    }
  );

  return {
    profile: data?.wallet,
    reputation: data?.reputation,
    isLoading,
    error,
    refetch
  };
} 