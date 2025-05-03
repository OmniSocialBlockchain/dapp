import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt } from "wagmi";
import { type WriteContractParameters } from "wagmi/actions";
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

  const { data: createPersonaHash, isPending: isCreatePending, writeContract: createPersona } = useContractWrite();

  const { data: activatePersonaHash, isPending: isActivatePending, writeContract: activatePersona } = useContractWrite();

  const createPersonaWithConfig = (args: unknown[]) => {
    return createPersona({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.personaNFT as Address,
      abi: personaNFTABI,
      functionName: "createPersona",
      args,
    } as WriteContractParameters);
  };

  const activatePersonaWithConfig = (args: unknown[]) => {
    return activatePersona({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.personaNFT as Address,
      abi: personaNFTABI,
      functionName: "activatePersona",
      args,
    } as WriteContractParameters);
  };

  return {
    activePersona,
    personaDetails,
    createPersona: createPersonaWithConfig,
    activatePersona: activatePersonaWithConfig,
    isCreatePending,
    isActivatePending,
    createPersonaHash,
    activatePersonaHash,
  };
}

export function useSocialPost() {
  const { data: createPostHash, isPending: isCreatePending, writeContract: createPost } = useContractWrite();

  const { data: likePostHash, isPending: isLikePending, writeContract: likePost } = useContractWrite();

  const { data: addCommentHash, isPending: isCommentPending, writeContract: addComment } = useContractWrite();

  const createPostWithConfig = (args: unknown[]) => {
    return createPost({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.socialPost as Address,
      abi: socialPostABI,
      functionName: "createPost",
      args,
    } as WriteContractParameters);
  };

  const likePostWithConfig = (args: unknown[]) => {
    return likePost({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.socialPost as Address,
      abi: socialPostABI,
      functionName: "likePost",
      args,
    } as WriteContractParameters);
  };

  const addCommentWithConfig = (args: unknown[]) => {
    return addComment({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.socialPost as Address,
      abi: socialPostABI,
      functionName: "addComment",
      args,
    } as WriteContractParameters);
  };

  return {
    createPost: createPostWithConfig,
    likePost: likePostWithConfig,
    addComment: addCommentWithConfig,
    isCreatePending,
    isLikePending,
    isCommentPending,
    createPostHash,
    likePostHash,
    addCommentHash,
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

  const { data: approveHash, isPending: isApprovePending, writeContract: approve } = useContractWrite();

  const approveWithConfig = (args: unknown[]) => {
    return approve({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniToken as Address,
      abi: omniTokenABI,
      functionName: "approve",
      args,
    } as WriteContractParameters);
  };

  return {
    balance,
    approve: approveWithConfig,
    isApprovePending,
    approveHash,
  };
}

export function useOmniDAO() {
  const { data: proposeHash, isPending: isProposePending, writeContract: propose } = useContractWrite();

  const { data: castVoteHash, isPending: isVotePending, writeContract: castVote } = useContractWrite();

  const proposeWithConfig = (args: unknown[]) => {
    return propose({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniDAO as Address,
      abi: omniDAOABI,
      functionName: "propose",
      args,
    } as WriteContractParameters);
  };

  const castVoteWithConfig = (args: unknown[]) => {
    return castVote({
      address: CONTRACT_ADDRESSES.polygonZkEvmTestnet.omniDAO as Address,
      abi: omniDAOABI,
      functionName: "castVote",
      args,
    } as WriteContractParameters);
  };

  return {
    propose: proposeWithConfig,
    castVote: castVoteWithConfig,
    isProposePending,
    isVotePending,
    proposeHash,
    castVoteHash,
  };
} 