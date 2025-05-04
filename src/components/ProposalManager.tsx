import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite, useWatchContractEvent } from "wagmi";
import { Address, Log } from "viem";
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
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Read all proposals at once
  const { data: proposalData } = useContractRead({
    address: daoAddress,
    abi: omniDAO.abi,
    functionName: "getProposals",
    args: proposalCount ? [BigInt(0), proposalCount] : undefined,
    enabled: !!proposalCount,
  });

  const { writeContract: createProposal, isPending: isCreatePending } = useContractWrite();
  const { writeContract: castVote, isPending: isVotePending } = useContractWrite();
  const { writeContract: executeProposal, isPending: isExecutePending } = useContractWrite();

  useWatchContractEvent({
    address: daoAddress,
    abi: omniDAO.abi,
    eventName: "ProposalCreated",
    onLogs: (logs: Log[]) => {
      toast.success("New proposal created");
    },
  });

  useWatchContractEvent({
    address: daoAddress,
    abi: omniDAO.abi,
    eventName: "VoteCast",
    onLogs: (logs: Log[]) => {
      toast.success("Vote cast successfully");
    },
  });

  useWatchContractEvent({
    address: daoAddress,
    abi: omniDAO.abi,
    eventName: "ProposalExecuted",
    onLogs: (logs: Log[]) => {
      toast.success("Proposal executed successfully");
    },
  });

  useEffect(() => {
    if (proposalData) {
      const formattedProposals = (proposalData as ProposalData[]).map((data, index) => ({
        id: BigInt(index),
        title: data[0],
        description: data[1],
        proposer: data[2],
        startBlock: data[3],
        endBlock: data[4],
        forVotes: data[5],
        againstVotes: data[6],
        executed: data[7],
      }));
      setProposals(formattedProposals);
    }
  }, [proposalData]);

  const handleCreateProposal = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!title || !description) {
        throw new Error("Please fill in all fields");
      }

      await createProposal({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "propose",
        args: [title, description],
      });

      toast.success("Proposal created successfully");
      setTitle("");
      setDescription("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create proposal";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (proposalId: bigint, support: boolean) => {
    try {
      setIsLoading(true);
      setError("");

      await castVote({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "castVote",
        args: [proposalId, support],
      });

      toast.success(`Vote ${support ? "for" : "against"} proposal ${proposalId.toString()} cast successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cast vote";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteProposal = async (proposalId: bigint) => {
    try {
      setIsLoading(true);
      setError("");

      await executeProposal({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "execute",
        args: [proposalId],
      });

      toast.success(`Proposal ${proposalId.toString()} executed successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute proposal";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Create Proposal</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full p-2 border rounded"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 border rounded"
          rows={4}
        />
        <button
          onClick={handleCreateProposal}
          disabled={isLoading || isCreatePending}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading || isCreatePending ? "Creating..." : "Create Proposal"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Proposals</h2>
        {proposals.map((proposal) => (
          <div key={proposal.id.toString()} className="p-4 border rounded space-y-2">
            <h3 className="font-bold">{proposal.title}</h3>
            <p>{proposal.description}</p>
            <p>Proposer: {proposal.proposer}</p>
            <p>Start Block: {proposal.startBlock.toString()}</p>
            <p>End Block: {proposal.endBlock.toString()}</p>
            <p>For Votes: {proposal.forVotes.toString()}</p>
            <p>Against Votes: {proposal.againstVotes.toString()}</p>
            <p>Executed: {proposal.executed ? "Yes" : "No"}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleVote(proposal.id, true)}
                disabled={isLoading || isVotePending || proposal.executed}
                className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
              >
                Vote For
              </button>
              <button
                onClick={() => handleVote(proposal.id, false)}
                disabled={isLoading || isVotePending || proposal.executed}
                className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
              >
                Vote Against
              </button>
              {!proposal.executed && (
                <button
                  onClick={() => handleExecuteProposal(proposal.id)}
                  disabled={isLoading || isExecutePending}
                  className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
                >
                  Execute
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 