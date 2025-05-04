import { useState } from "react";
import { useAccount, useContractWrite, useWatchContractEvent } from "wagmi";
import { daoFactory } from "@/contracts/DAOFactory";
import { Address } from "viem";
import { toast } from "sonner";
import { Log } from "viem";

interface DAOCreatedLog extends Log {
  args: {
    creator: Address;
    dao: Address;
    name: string;
  };
}

export function DAOManager() {
  const { address } = useAccount();
  const [name, setName] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<Address>("0x0000000000000000000000000000000000000000" as Address);
  const [quorumPercent, setQuorumPercent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [createdDAOs, setCreatedDAOs] = useState<{ address: Address; name: string }[]>([]);

  const { writeContract: createDAO, isPending: isCreatePending } = useContractWrite();

  useWatchContractEvent({
    address: daoFactory.address,
    abi: daoFactory.abi,
    eventName: "DAOCreated",
    onLogs: (logs: DAOCreatedLog[]) => {
      logs.forEach((log: DAOCreatedLog) => {
        if (log.args.creator === address) {
          setCreatedDAOs((prev) => [...prev, { 
            address: log.args.dao, 
            name: log.args.name 
          }]);
          toast.success(`DAO ${log.args.name} created successfully`);
        }
      });
    },
  });

  const handleCreateDAO = async () => {
    if (!name || !tokenAddress || !quorumPercent) {
      setError("Please fill in all fields");
      return;
    }

    const quorum = BigInt(quorumPercent);
    if (quorum <= 0n || quorum > 100n) {
      setError("Quorum percentage must be between 1 and 100");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await createDAO({
        address: daoFactory.address,
        abi: daoFactory.abi,
        functionName: "createDAO",
        args: [name, tokenAddress, quorum],
      });
    } catch (error) {
      console.error("Error creating DAO:", error);
      setError("Failed to create DAO");
      toast.error("Failed to create DAO");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">DAO Management</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Create DAO Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Create New DAO</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="DAO Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <input
            type="text"
            placeholder="Token Address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value as Address)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <input
            type="number"
            placeholder="Quorum Percentage (1-100)"
            value={quorumPercent}
            onChange={(e) => setQuorumPercent(e.target.value)}
            min="1"
            max="100"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <button
            onClick={handleCreateDAO}
            disabled={isLoading || isCreatePending}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading || isCreatePending ? "Creating..." : "Create DAO"}
          </button>
        </div>
      </div>

      {/* Created DAOs List */}
      {createdDAOs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Your DAOs</h3>
          <div className="space-y-4">
            {createdDAOs.map((dao) => (
              <div
                key={dao.address}
                className="p-4 border rounded dark:border-gray-700"
              >
                <h4 className="font-medium">{dao.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {dao.address}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 