import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite, useWatchContractEvent } from "wagmi";
import { repModule } from "@/contracts/RepModule";
import { Address, Log } from "viem";
import { toast } from "sonner";

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

  const { writeContract: grantReputation, isPending: isGrantPending } = useContractWrite();
  const { writeContract: revokeReputation, isPending: isRevokePending } = useContractWrite();
  const { writeContract: configureDomain, isPending: isConfigurePending } = useContractWrite();

  const { data: currentReputation } = useContractRead({
    address: repModule.address,
    abi: repModule.abi,
    functionName: "getReputation",
    args: [targetAddress, selectedDomain],
  });

  useWatchContractEvent({
    address: repModule.address,
    abi: repModule.abi,
    eventName: "ReputationGranted",
    onLogs: (logs: Log[]) => {
      toast.success("Reputation granted successfully");
    },
  });

  useWatchContractEvent({
    address: repModule.address,
    abi: repModule.abi,
    eventName: "ReputationRevoked",
    onLogs: (logs: Log[]) => {
      toast.success("Reputation revoked successfully");
    },
  });

  useWatchContractEvent({
    address: repModule.address,
    abi: repModule.abi,
    eventName: "DomainConfigured",
    onLogs: (logs: Log[]) => {
      toast.success("Domain configured successfully");
    },
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
        address: repModule.address,
        abi: repModule.abi,
        functionName: "grant",
        args: [targetAddress, selectedDomain, BigInt(amount)],
      });
      toast.success("Reputation granted successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to grant reputation";
      setError(errorMessage);
      toast.error(errorMessage);
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
        address: repModule.address,
        abi: repModule.abi,
        functionName: "revoke",
        args: [targetAddress, selectedDomain, BigInt(amount)],
      });
      toast.success("Reputation revoked successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to revoke reputation";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureDomain = async (domain: DomainConfig) => {
    setIsLoading(true);
    setError("");
    try {
      await configureDomain({
        address: repModule.address,
        abi: repModule.abi,
        functionName: "configureDomain",
        args: [domain.domain, domain.intervalBlocks, domain.decayBpPerInterval],
      });
      toast.success("Domain configured successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to configure domain";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Manage Reputation</h2>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value as `0x${string}`)}
          className="w-full p-2 border rounded"
        >
          <option value="0x0000000000000000000000000000000000000000000000000000000000000000">
            Select Domain
          </option>
          {domains.map((domain) => (
            <option key={domain.domain} value={domain.domain}>
              {domain.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value as Address)}
          placeholder="Target Address"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full p-2 border rounded"
        />
        <div className="flex space-x-2">
          <button
            onClick={handleGrantReputation}
            disabled={isLoading || isGrantPending}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Grant Reputation
          </button>
          <button
            onClick={handleRevokeReputation}
            disabled={isLoading || isRevokePending}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            Revoke Reputation
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Current Reputation</h2>
        <p className="text-2xl font-bold">{reputation}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Configure Domains</h2>
        {domains.map((domain) => (
          <div key={domain.domain} className="p-4 border rounded space-y-2">
            <h3 className="font-bold">{domain.name}</h3>
            <p>Domain: {domain.domain}</p>
            <p>Interval Blocks: {domain.intervalBlocks}</p>
            <p>Decay per Interval: {domain.decayBpPerInterval} basis points</p>
            <button
              onClick={() => handleConfigureDomain(domain)}
              disabled={isLoading || isConfigurePending}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Configure Domain
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 