import { useState, useEffect, useMemo } from "react";
import { useAccount, useContractRead, useContractWrite, useBalance, useToken, useContractEvent } from "wagmi";
import { Address, parseAbiItem, Log } from "viem";
import { omniDAO } from "@/contracts/OmniDAO";
import { publicClient } from "@/lib/wagmi";

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
    ...omniDAO,
    address: daoAddress,
    functionName: "getVotingPower",
    args: [address || "0x0000000000000000000000000000000000000000"],
    enabled: !!address,
  });

  // Token Info
  const { data: tokenInfo } = useToken({
    address: tokenAddress,
    enabled: tokenAddress !== "0x0000000000000000000000000000000000000000",
  });

  // Contract Writes
  const { write: createProposal } = useContractWrite({
    ...omniDAO,
    address: daoAddress,
    functionName: "createProposal",
  });

  const { write: castVote } = useContractWrite({
    ...omniDAO,
    address: daoAddress,
    functionName: "castVote",
  });

  const { write: executeProposal } = useContractWrite({
    ...omniDAO,
    address: daoAddress,
    functionName: "executeProposal",
  });

  // Load token info and cache it
  const loadTokenInfo = async (tokenAddress: Address) => {
    if (tokenInfoCache[tokenAddress]) return tokenInfoCache[tokenAddress];

    try {
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: [
            {
              inputs: [],
              name: "symbol",
              outputs: [{ name: "", type: "string" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: [
            {
              inputs: [],
              name: "decimals",
              outputs: [{ name: "", type: "uint8" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "decimals",
        }),
      ]);

      const info = { symbol: symbol as string, decimals: Number(decimals) };
      setTokenInfoCache((prev) => ({ ...prev, [tokenAddress]: info }));
      return info;
    } catch (error) {
      console.error("Error loading token info:", error);
      return { symbol: "UNKNOWN", decimals: 18 };
    }
  };

  // Load token balances with caching
  useEffect(() => {
    const loadTokenBalances = async () => {
      try {
        const supportedTokens = await publicClient.readContract({
          ...omniDAO,
          address: daoAddress,
          functionName: "getSupportedTokens",
        }) as Address[];

        const balances = await Promise.all(
          supportedTokens.map(async (tokenAddress) => {
            const balance = await publicClient.readContract({
              ...omniDAO,
              address: daoAddress,
              functionName: "getTokenBalance",
              args: [tokenAddress],
            });

            const info = await loadTokenInfo(tokenAddress);
            const formattedBalance = formatTokenAmount(balance, info.decimals);

            return {
              address: tokenAddress,
              symbol: info.symbol,
              balance: formattedBalance,
            };
          })
        );

        setTokenBalances(balances);
      } catch (error) {
        console.error("Error loading token balances:", error);
        setError("Failed to load token balances");
      }
    };

    loadTokenBalances();
  }, [daoAddress]);

  // Format token amount with decimals
  const formatTokenAmount = (amount: bigint, decimals: number): string => {
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    return `${whole}.${fraction.toString().padStart(decimals, "0")}`;
  };

  // Filter and paginate transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => selectedToken === "all" || tx.token === selectedToken)
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [transactions, selectedToken, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(
    transactions.filter((tx) => selectedToken === "all" || tx.token === selectedToken).length / itemsPerPage
  );

  // Load proposals
  useEffect(() => {
    const loadProposals = async () => {
      try {
        // Get proposal count
        const count = await publicClient.readContract({
          ...omniDAO,
          address: daoAddress,
          functionName: "proposalCount",
        });

        // Load each proposal
        const loadedProposals = await Promise.all(
          Array.from({ length: Number(count) }, (_, i) => i).map(async (id) => {
            const proposal = await publicClient.readContract({
              ...omniDAO,
              address: daoAddress,
              functionName: "proposals",
              args: [BigInt(id)],
            });

            const votes = await publicClient.readContract({
              ...omniDAO,
              address: daoAddress,
              functionName: "getProposalVotes",
              args: [BigInt(id)],
            });

            return {
              id: BigInt(id),
              title: proposal[0],
              description: proposal[1],
              amount: proposal[2],
              recipient: proposal[3],
              status: proposal[4] as "pending" | "approved" | "rejected" | "executed",
              votesFor: votes[0],
              votesAgainst: votes[1],
            };
          })
        );

        setProposals(loadedProposals);
      } catch (error) {
        console.error("Error loading proposals:", error);
        setError("Failed to load proposals");
      }
    };

    loadProposals();
  }, [daoAddress]);

  // Load transactions with proper typing
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const depositLogs = await publicClient.getLogs({
          address: daoAddress,
          event: parseAbiItem("event Deposit(address indexed from, uint256 amount)"),
          fromBlock: 0n,
        });

        const withdrawalLogs = await publicClient.getLogs({
          address: daoAddress,
          event: parseAbiItem("event Withdrawal(address indexed to, uint256 amount)"),
          fromBlock: 0n,
        });

        const tokenTransferLogs = await publicClient.getLogs({
          address: daoAddress,
          event: parseAbiItem("event TokenTransfer(address indexed token, address indexed from, address indexed to, uint256 amount)"),
          fromBlock: 0n,
        });

        const processedTransactions = [
          ...depositLogs.map((log) => ({
            hash: log.transactionHash || "",
            timestamp: Number(log.blockNumber),
            type: "deposit" as const,
            amount: (log.args as any).amount?.toString() || "0",
            token: "ETH",
            from: (log.args as any).from || "0x0000000000000000000000000000000000000000",
            to: daoAddress,
          })),
          ...withdrawalLogs.map((log) => ({
            hash: log.transactionHash || "",
            timestamp: Number(log.blockNumber),
            type: "withdrawal" as const,
            amount: (log.args as any).amount?.toString() || "0",
            token: "ETH",
            from: daoAddress,
            to: (log.args as any).to || "0x0000000000000000000000000000000000000000",
          })),
          ...tokenTransferLogs.map((log) => ({
            hash: log.transactionHash || "",
            timestamp: Number(log.blockNumber),
            type: (log.args as any).from === daoAddress ? "withdrawal" : "deposit",
            amount: (log.args as any).amount?.toString() || "0",
            token: (log.args as any).token || "0x0000000000000000000000000000000000000000",
            from: (log.args as any).from || "0x0000000000000000000000000000000000000000",
            to: (log.args as any).to || "0x0000000000000000000000000000000000000000",
          })),
        ].sort((a, b) => b.timestamp - a.timestamp);

        setTransactions(processedTransactions);
      } catch (error) {
        console.error("Error loading transactions:", error);
        setError("Failed to load transaction history");
      }
    };

    loadTransactions();

    // Listen for new events
    useContractEvent({
      ...omniDAO,
      address: daoAddress,
      eventName: "Deposit",
      listener: () => {
        loadTransactions();
      },
    });

    useContractEvent({
      ...omniDAO,
      address: daoAddress,
      eventName: "Withdrawal",
      listener: () => {
        loadTransactions();
      },
    });

    useContractEvent({
      ...omniDAO,
      address: daoAddress,
      eventName: "TokenTransfer",
      listener: () => {
        loadTransactions();
        loadTokenBalances();
      },
    });
  }, [daoAddress]);

  const handleCreateWithdrawalProposal = async () => {
    if (!amount || !recipient || !description) {
      setError("Please fill in all fields");
      return;
    }

    const amountWei = BigInt(amount) * BigInt(1e18);
    if (amountWei <= 0n) {
      setError("Amount must be greater than 0");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await createProposal({
        args: [
          `Withdraw ${amount} ${tokenAddress === "0x0000000000000000000000000000000000000000" ? "ETH" : tokenInfo?.symbol || "TOKEN"} to ${recipient}`,
          description,
        ],
      });
    } catch (error) {
      console.error("Error creating withdrawal proposal:", error);
      setError("Failed to create withdrawal proposal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (proposalId: bigint, support: boolean) => {
    setIsLoading(true);
    setError("");
    try {
      await castVote({
        args: [proposalId, support],
      });
    } catch (error) {
      console.error("Error casting vote:", error);
      setError("Failed to cast vote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteProposal = async (proposalId: bigint) => {
    setIsLoading(true);
    setError("");
    try {
      await executeProposal({
        args: [proposalId],
      });
    } catch (error) {
      console.error("Error executing proposal:", error);
      setError("Failed to execute proposal");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal => 
    proposalFilter === "all" || proposal.status === proposalFilter
  );

  return (
    <div className="space-y-6">
      {/* Treasury Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Treasury Overview</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                ETH Balance: {treasuryBalance?.formatted || "0"} ETH
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Your Voting Power: {votingPower?.toString() || "0"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Token Balances</h4>
              {tokenBalances.map((token) => (
                <p key={token.address} className="text-gray-600 dark:text-gray-400">
                  {token.symbol}: {token.balance}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Withdrawal Proposal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Create Withdrawal Proposal</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.000000000000000001"
              min="0"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="Token Address (0x... for ETH)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value as Address)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <input
            type="text"
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value as Address)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <textarea
            placeholder="Proposal Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <button
            onClick={handleCreateWithdrawalProposal}
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? "Creating Proposal..." : "Create Withdrawal Proposal"}
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Treasury Proposals</h3>
          <select
            value={proposalFilter}
            onChange={(e) => setProposalFilter(e.target.value as any)}
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">All Proposals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="executed">Executed</option>
          </select>
        </div>
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
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
                    disabled={isLoading}
                    className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    For ({proposal.votesFor.toString()})
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={isLoading}
                    className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Against ({proposal.votesAgainst.toString()})
                  </button>
                </div>
                {proposal.status === "approved" && (
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    disabled={isLoading}
                    className="bg-primary-600 text-white py-1 px-3 rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    Execute
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History with Pagination and Filtering */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Transaction History</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedToken}
              onChange={(e) => {
                setSelectedToken(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All Tokens</option>
              <option value="ETH">ETH</option>
              {tokenBalances.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Token</th>
                <th className="text-left py-2">From</th>
                <th className="text-left py-2">To</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.hash} className="border-b dark:border-gray-700">
                  <td className="py-2">{tx.type}</td>
                  <td className="py-2">{tx.amount}</td>
                  <td className="py-2">
                    {tx.token === "ETH"
                      ? "ETH"
                      : tokenInfoCache[tx.token as Address]?.symbol || "UNKNOWN"}
                  </td>
                  <td className="py-2">{tx.from}</td>
                  <td className="py-2">{tx.to}</td>
                  <td className="py-2">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 