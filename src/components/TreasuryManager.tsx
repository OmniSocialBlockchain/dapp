import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useContractRead, useContractWrite, useBalance, useToken, useWatchContractEvent } from "wagmi";
import { Address, Log } from "viem";
import { omniDAO } from "@/contracts/OmniDAO";
import { publicClient } from "@/lib/wagmi";
import { toast } from "sonner";

interface TreasuryManagerProps {
  daoAddress: Address;
}

interface TokenBalance {
  address: Address;
  symbol: string;
  balance: string;
}

interface TreasuryProposal {
  id: bigint;
  title: string;
  description: string;
  amount: string;
  recipient: Address;
  status: "pending" | "approved" | "rejected" | "executed";
  votesFor: bigint;
  votesAgainst: bigint;
}

interface Transaction {
  hash: string;
  timestamp: number;
  type: "deposit" | "withdrawal";
  amount: string;
  token: string;
  from: Address;
  to: Address;
}

interface TokenInfo {
  symbol: string;
  decimals: number;
}

type ProposalData = [
  string, // title
  string, // description
  string, // amount
  Address, // recipient
  "pending" | "approved" | "rejected" | "executed", // status
  bigint, // votesFor
  bigint // votesAgainst
];

export function TreasuryManager({ daoAddress }: TreasuryManagerProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<Address>("0x0000000000000000000000000000000000000000" as Address);
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<Address>("0x0000000000000000000000000000000000000000" as Address);
  const [proposalFilter, setProposalFilter] = useState<"all" | "pending" | "approved" | "rejected" | "executed">("all");
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [proposals, setProposals] = useState<TreasuryProposal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [selectedToken, setSelectedToken] = useState<string>("all");
  const [tokenInfoCache, setTokenInfoCache] = useState<Record<Address, TokenInfo>>({});

  // ETH Balance
  const { data: treasuryBalance } = useBalance({
    address: daoAddress,
  });

  // Voting Power
  const { data: votingPower } = useContractRead({
    address: daoAddress,
    abi: omniDAO.abi,
    functionName: "getVotingPower",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Token Info
  const { data: tokenInfo } = useToken({
    address: tokenAddress,
  });

  // Contract Writes
  const { writeContract: createProposal, isPending: isCreatePending } = useContractWrite();
  const { writeContract: castVote, isPending: isVotePending } = useContractWrite();
  const { writeContract: executeProposal, isPending: isExecutePending } = useContractWrite();

  // Contract Events
  useWatchContractEvent({
    address: daoAddress,
    abi: omniDAO.abi,
    eventName: "EmergencyProposalCreated",
    onLogs: (logs: Log[]) => {
      loadProposals();
      toast.success("New proposal created");
    },
  });

  useWatchContractEvent({
    address: daoAddress,
    abi: omniDAO.abi,
    eventName: "EmergencyProposalExecuted",
    onLogs: (logs: Log[]) => {
      loadProposals();
      toast.success("Proposal executed successfully");
    },
  });

  const loadProposals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const proposalCount = await publicClient.readContract({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "state",
        args: [BigInt(0)],
      });

      const proposalData = await publicClient.readContract({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "tokenBalances",
        args: [tokenAddress],
      });

      const formattedProposals: TreasuryProposal[] = [{
        id: BigInt(0),
        title: "Treasury Proposal",
        description: "Manage treasury funds",
        amount: proposalData.toString(),
        recipient: daoAddress,
        status: "pending",
        votesFor: BigInt(0),
        votesAgainst: BigInt(0),
      }];

      setProposals(formattedProposals);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load proposals";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [daoAddress, publicClient, tokenAddress]);

  const handleCreateWithdrawalProposal = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!amount || !recipient || !description) {
        throw new Error("Please fill in all fields");
      }

      await createProposal({
        address: daoAddress,
        abi: omniDAO.abi,
        functionName: "createEmergencyProposal",
        args: [[recipient], [BigInt(amount)], ["0x"], description],
      });

      toast.success("Proposal created successfully");
      setAmount("");
      setRecipient("0x0000000000000000000000000000000000000000" as Address);
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
        functionName: "enableReputationVoting",
        args: [support],
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
        args: [proposalId, [recipient], [BigInt(amount)], ["0x"], "0x"],
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

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Create Withdrawal Proposal</h2>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value as Address)}
          placeholder="Recipient address"
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
          onClick={handleCreateWithdrawalProposal}
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
            <p>Amount: {proposal.amount}</p>
            <p>Recipient: {proposal.recipient}</p>
            <p>Status: {proposal.status}</p>
            <p>Votes For: {proposal.votesFor.toString()}</p>
            <p>Votes Against: {proposal.votesAgainst.toString()}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleVote(proposal.id, true)}
                disabled={isLoading || isVotePending}
                className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
              >
                Vote For
              </button>
              <button
                onClick={() => handleVote(proposal.id, false)}
                disabled={isLoading || isVotePending}
                className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
              >
                Vote Against
              </button>
              {proposal.status === "approved" && (
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