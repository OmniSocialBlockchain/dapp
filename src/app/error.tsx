'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/Layout'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          {error.message}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Return Home
          </Link>
        </div>
      </div>
    </Layout>
  )
} 