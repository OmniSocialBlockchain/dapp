import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { repModule } from "@/contracts/RepModule";
import { Address } from "viem";

interface DomainConfig {
  name: string;
  domain: `0x${string}`;
  intervalBlocks: number;
  decayBpPerInterval: number;
}

export function ReputationManager() {
  const { address } = useAccount();
  const [domains, setDomains] = useState<DomainConfig[]>([
    {
      name: "Content Creation",
      domain: "0x636f6e74656e7400000000000000000000000000000000000000000000000000" as `0x${string}`,
      intervalBlocks: 1000,
      decayBpPerInterval: 100, // 1% decay per interval
    },
    {
      name: "Community Moderation",
      domain: "0x6d6f6465726174696f6e00000000000000000000000000000000000000000000" as `0x${string}`,
      intervalBlocks: 2000,
      decayBpPerInterval: 50, // 0.5% decay per interval
    },
  ]);
  const [selectedDomain, setSelectedDomain] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`);
  const [amount, setAmount] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState<Address>("0x0000000000000000000000000000000000000000" as Address);
  const [reputation, setReputation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { write: grantReputation } = useContractWrite({
    ...repModule,
    functionName: "grant",
  });

  const { write: revokeReputation } = useContractWrite({
    ...repModule,
    functionName: "revoke",
  });

  const { write: configureDomain } = useContractWrite({
    ...repModule,
    functionName: "configureDomain",
  });

  const { data: currentReputation } = useContractRead({
    ...repModule,
    functionName: "getReputation",
    args: [targetAddress, selectedDomain],
    watch: true,
  });

  useEffect(() => {
    if (currentReputation) {
      setReputation(Number(currentReputation));
    }
  }, [currentReputation]);

  const handleGrantReputation = async () => {
    if (!selectedDomain || !amount || !targetAddress) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await grantReputation({
        args: [targetAddress, selectedDomain, BigInt(amount)],
      });
    } catch (error) {
      console.error("Error granting reputation:", error);
      setError("Failed to grant reputation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeReputation = async () => {
    if (!selectedDomain || !amount || !targetAddress) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await revokeReputation({
        args: [targetAddress, selectedDomain, BigInt(amount)],
      });
    } catch (error) {
      console.error("Error revoking reputation:", error);
      setError("Failed to revoke reputation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureDomain = async (domain: DomainConfig) => {
    setIsLoading(true);
    setError("");
    try {
      await configureDomain({
        args: [
          domain.domain,
          BigInt(domain.intervalBlocks),
          BigInt(domain.decayBpPerInterval),
        ],
      });
    } catch (error) {
      console.error("Error configuring domain:", error);
      setError("Failed to configure domain");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Reputation Management</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Domain Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Configure Domains</h3>
        <div className="space-y-4">
          {domains.map((domain) => (
            <div
              key={domain.domain}
              className="flex items-center justify-between p-4 border rounded dark:border-gray-700"
            >
              <div>
                <h4 className="font-medium">{domain.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Decay: {domain.decayBpPerInterval / 100}% per{" "}
                  {domain.intervalBlocks} blocks
                </p>
              </div>
              <button
                onClick={() => handleConfigureDomain(domain)}
                disabled={isLoading}
                className="bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? "Configuring..." : "Configure"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reputation Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Manage Reputation</h3>
        <div className="space-y-4">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value as `0x${string}`)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select Domain</option>
            {domains.map((domain) => (
              <option key={domain.domain} value={domain.domain}>
                {domain.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Target Address"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value as Address)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Reputation:
              </p>
              <p className="text-lg font-medium">{reputation}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleGrantReputation}
                disabled={isLoading}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Grant"}
              </button>
              <button
                onClick={handleRevokeReputation}
                disabled={isLoading}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 