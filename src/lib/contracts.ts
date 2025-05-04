import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/addresses";
import { personaNFTABI, socialPostABI, omniTokenABI, omniDAOABI } from "@/config/abis";
import { type Address } from "viem";

export function usePersonaNFT() {
  const { address } = useAccount();

  const { data: activePersona } = useContractRead({
    address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.personaNFT as Address,
    abi: personaNFTABI,
    functionName: "getActivePersona",
    args: [address],
    enabled: !!address,
  });

  const { data: personaDetails } = useContractRead({
    address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.personaNFT as Address,
    abi: personaNFTABI,
    functionName: "getPersona",
    args: [activePersona],
    enabled: !!activePersona,
  });

  const { writeContract: createPersona, isPending: isCreatePending } = useContractWrite();

  const { writeContract: activatePersona, isPending: isActivatePending } = useContractWrite();

  const createPersonaWithConfig = (args: unknown[]) => {
    return createPersona({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.personaNFT as Address,
      abi: personaNFTABI,
      functionName: "createPersona",
      args,
    });
  };

  const activatePersonaWithConfig = (args: unknown[]) => {
    return activatePersona({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.personaNFT as Address,
      abi: personaNFTABI,
      functionName: "activatePersona",
      args,
    });
  };

  return {
    activePersona,
    personaDetails,
    createPersona: createPersonaWithConfig,
    activatePersona: activatePersonaWithConfig,
    isCreatePending,
    isActivatePending,
  };
}

export function useSocialPost() {
  const { address } = useAccount();

  const { writeContract: createPost, isPending: isCreatePending } = useContractWrite();
  const { writeContract: likePost, isPending: isLikePending } = useContractWrite();
  const { writeContract: addComment, isPending: isCommentPending } = useContractWrite();

  const createPostWithConfig = (args: unknown[]) => {
    return createPost({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.socialPost as Address,
      abi: socialPostABI,
      functionName: "createPost",
      args,
    });
  };

  const likePostWithConfig = (args: unknown[]) => {
    return likePost({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.socialPost as Address,
      abi: socialPostABI,
      functionName: "likePost",
      args,
    });
  };

  const addCommentWithConfig = (args: unknown[]) => {
    return addComment({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.socialPost as Address,
      abi: socialPostABI,
      functionName: "addComment",
      args,
    });
  };

  return {
    createPost: createPostWithConfig,
    likePost: likePostWithConfig,
    addComment: addCommentWithConfig,
    isCreatePending,
    isLikePending,
    isCommentPending,
  };
}

export function useOmniToken() {
  const { address } = useAccount();

  const { data: balance } = useContractRead({
    address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniToken as Address,
    abi: omniTokenABI,
    functionName: "balanceOf",
    args: [address],
    enabled: !!address,
  });

  const { writeContract: approve, isPending: isApprovePending } = useContractWrite();

  const approveWithConfig = (args: unknown[]) => {
    return approve({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniToken as Address,
      abi: omniTokenABI,
      functionName: "approve",
      args,
    });
  };

  return {
    balance,
    approve: approveWithConfig,
    isApprovePending,
  };
}

export function useOmniDAO() {
  const { address } = useAccount();

  const { writeContract: propose, isPending: isProposePending } = useContractWrite();
  const { writeContract: castVote, isPending: isVotePending } = useContractWrite();
  const { writeContract: executeProposal, isPending: isExecutePending } = useContractWrite();

  const proposeWithConfig = (args: unknown[]) => {
    return propose({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniDAO as Address,
      abi: omniDAOABI,
      functionName: "propose",
      args,
    });
  };

  const castVoteWithConfig = (args: unknown[]) => {
    return castVote({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniDAO as Address,
      abi: omniDAOABI,
      functionName: "castVote",
      args,
    });
  };

  const executeProposalWithConfig = (args: unknown[]) => {
    return executeProposal({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniDAO as Address,
      abi: omniDAOABI,
      functionName: "executeProposal",
      args,
    });
  };

  return {
    propose: proposeWithConfig,
    castVote: castVoteWithConfig,
    executeProposal: executeProposalWithConfig,
    isProposePending,
    isVotePending,
    isExecutePending,
  };
} 