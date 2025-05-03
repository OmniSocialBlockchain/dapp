import { Layout } from '@/components/Layout'
import { useAccount } from 'wagmi'

export default function ProfilePage() {
  const { address, isConnected } = useAccount()

  if (!isConnected) {
    return (
      <Layout>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to view your profile
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="h-48 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-lg"></div>
        <div className="px-6 py-4">
          <div className="flex items-end -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700"></div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Profile
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Posts
              </h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                42
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Followers
              </h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                128
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Following
              </h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                64
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 