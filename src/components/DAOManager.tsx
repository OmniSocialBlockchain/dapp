import { useState } from "react";
import { useAccount, useContractWrite, useContractEvent } from "wagmi";
import { daoFactory } from "@/contracts/DAOFactory";
import { Address } from "viem";

export function DAOManager() {
  const { address } = useAccount();
  const [name, setName] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<Address>("0x0000000000000000000000000000000000000000" as Address);
  const [quorumPercent, setQuorumPercent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [createdDAOs, setCreatedDAOs] = useState<{ address: Address; name: string }[]>([]);

  const { write: createDAO } = useContractWrite({
    ...daoFactory,
    functionName: "createDAO",
  });

  useContractEvent({
    ...daoFactory,
    eventName: "DAOCreated",
    listener: (logs) => {
      logs.forEach((log) => {
        if (log.args.creator === address) {
          setCreatedDAOs((prev) => [...prev, { 
            address: log.args.dao as Address, 
            name: log.args.name as string 
          }]);
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
        args: [name, tokenAddress, quorum],
      });
    } catch (error) {
      console.error("Error creating DAO:", error);
      setError("Failed to create DAO");
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
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? "Creating DAO..." : "Create DAO"}
          </button>
        </div>
      </div>

      {/* Created DAOs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Your DAOs</h3>
        {createdDAOs.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No DAOs created yet</p>
        ) : (
          <div className="space-y-4">
            {createdDAOs.map((dao) => (
              <div
                key={dao.address}
                className="flex items-center justify-between p-4 border rounded dark:border-gray-700"
              >
                <div>
                  <h4 className="font-medium">{dao.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {dao.address}
                  </p>
                </div>
                <a
                  href={`/dao/${dao.address}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  View DAO
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 