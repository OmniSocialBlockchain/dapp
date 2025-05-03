import { ReputationManager } from "@/components/ReputationManager";
import { ConnectButton } from "@/components/ConnectButton";

export default function ReputationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reputation System
          </h1>
          <ConnectButton />
        </div>
        <ReputationManager />
      </div>
    </div>
  );
} 