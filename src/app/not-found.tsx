import Link from 'next/link'
import { Layout } from '@/components/Layout'

export default function NotFound() {
  return (
    <Layout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Page not found
        </p>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Return Home
        </Link>
      </div>
    </Layout>
  )
} 