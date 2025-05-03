import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt } from "wagmi";
import { Address } from "viem";
import { omniDAO } from "@/contracts/OmniDAO";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Proposal {
  id: bigint;
  title: string;
  description: string;
  proposer: Address;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  executed: boolean;
}

interface ProposalManagerProps {
  daoAddress: Address;
}

type ProposalData = [
  string, // title
  string, // description
  Address, // proposer
  bigint, // startBlock
  bigint, // endBlock
  bigint, // forVotes
  bigint, // againstVotes
  boolean // executed
];

export function ProposalManager({ daoAddress }: ProposalManagerProps) {
  const { address } = useAccount();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const { data: proposalCount } = useContractRead({
    address: daoAddress,
    abi: omniDAO.abi,
    functionName: "proposalCount",
  });

  const { data: tokenBalance } = useContractRead({
    address: daoAddress,
    abi: omniDAO.abi,
    functionName: "getVotingPower",
    args: [address],
  });

  const { data: createProposalHash, writeContract: createProposal } = useContractWrite();

  const { data: castVoteHash, writeContract: castVote } = useContractWrite();

  const { data: executeProposalHash, writeContract: executeProposal } = useContractWrite();

  const { isLoading: isCreateLoading } = useWaitForTransactionReceipt({
    hash: createProposalHash,
  });

  const { isLoading: isVoteLoading } = useWaitForTransactionReceipt({
    hash: castVoteHash,
  });

  const { isLoading: isExecuteLoading } = useWaitForTransactionReceipt({
    hash: executeProposalHash,
  });

  useEffect(() => {
    const fetchProposals = async () => {
      if (!proposalCount) return;

      const proposalPromises = Array.from(
        { length: Number(proposalCount) },
        async (_, i) => {
          const { data: proposalData } = await useContractRead({
            address: daoAddress,
            abi: omniDAO.abi,
            functionName: "proposals",
            args: [BigInt(i)],
          }) as { data: ProposalData };

          if (!proposalData) {
            throw new Error(`Failed to fetch proposal ${i}`);
          }

          return {
            id: BigInt(i),
            title: proposalData[0],
            description: proposalData[1],
            proposer: proposalData[2],
            startBlock: proposalData[3],
            endBlock: proposalData[4],
            forVotes: proposalData[5],
            againstVotes: proposalData[6],
            executed: proposalData[7],
          };
        }
      );

      const fetchedProposals = await Promise.all(proposalPromises);
      setProposals(fetchedProposals);
    };

    fetchProposals();
  }, [proposalCount, daoAddress]);

  const handleCreateProposal = async () => {
    if (!title || !description) {
      setError("Please fill in all fields");
      return;
    }

    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await createProposal({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "createProposal",
        args: [title, description],
      });
      toast.success("Proposal created successfully");
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error creating proposal:", error);
      setError("Failed to create proposal");
      toast.error("Failed to create proposal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (proposalId: bigint, support: boolean) => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await castVote({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "castVote",
        args: [proposalId, support],
      });
      toast.success(`Vote cast ${support ? "for" : "against"} proposal`);
    } catch (error) {
      console.error("Error casting vote:", error);
      setError("Failed to cast vote");
      toast.error("Failed to cast vote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteProposal = async (proposalId: bigint) => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await executeProposal({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "executeProposal",
        args: [proposalId],
      });
      toast.success("Proposal executed successfully");
    } catch (error) {
      console.error("Error executing proposal:", error);
      setError("Failed to execute proposal");
      toast.error("Failed to execute proposal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Proposal Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Create New Proposal</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Proposal Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <textarea
            placeholder="Proposal Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Voting Power: {tokenBalance?.toString() || "0"}
            </p>
            <button
              onClick={handleCreateProposal}
              disabled={isLoading || isCreateLoading}
              className="bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading || isCreateLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Proposal"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Active Proposals</h3>
        {proposals.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No active proposals</p>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id.toString()}
                className="border rounded dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{proposal.title}</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    #{proposal.id.toString()}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {proposal.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="space-x-4">
                    <button
                      onClick={() => handleVote(proposal.id, true)}
                      disabled={isLoading || isVoteLoading}
                      className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading || isVoteLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      For ({proposal.forVotes.toString()})
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, false)}
                      disabled={isLoading || isVoteLoading}
                      className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading || isVoteLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Against ({proposal.againstVotes.toString()})
                    </button>
                  </div>
                  {!proposal.executed && (
                    <button
                      onClick={() => handleExecuteProposal(proposal.id)}
                      disabled={isLoading || isExecuteLoading}
                      className="bg-primary-600 text-white py-1 px-3 rounded hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading || isExecuteLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Execute
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 