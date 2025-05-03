import { notFound } from "next/navigation";
import { useAccount, useContractRead } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { Address } from "viem";
import { omniDAO } from "@/contracts/OmniDAO";

interface DAOPageProps {
  params: {
    address: string;
  };
}

export default function DAOPage({ params }: DAOPageProps) {
  const { address } = useAccount();
  const daoAddress = params.address as Address;

  const { data: name } = useContractRead({
    ...omniDAO,
    address: daoAddress,
    functionName: "name",
  });

  const { data: tokenAddress } = useContractRead({
    ...omniDAO,
    address: daoAddress,
    functionName: "token",
  });

  const { data: quorumPercent } = useContractRead({
    ...omniDAO,
    address: daoAddress,
    functionName: "quorumPercent",
  });

  if (!name) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {name as string}
          </h1>
          <ConnectButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DAO Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">DAO Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                <p className="font-mono">{daoAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Governance Token</p>
                <p className="font-mono">{tokenAddress as string}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quorum Percentage</p>
                <p>{quorumPercent?.toString()}%</p>
              </div>
            </div>
          </div>

          {/* Proposals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Proposals</h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                No proposals yet. Create one to get started.
              </p>
              <button
                className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
                onClick={() => {/* TODO: Implement proposal creation */}}
              >
                Create Proposal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 