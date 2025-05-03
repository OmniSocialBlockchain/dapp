'use client'

import { useAccount, useContractRead } from 'wagmi'
import { PersonaNFT } from '@/contracts/PersonaNFT'

export function PersonaSwitcher() {
  const { address } = useAccount()
  const { data: personas } = useContractRead({
    ...PersonaNFT,
    functionName: 'getPersonasByOwner',
    args: [address || '0x0000000000000000000000000000000000000000'],
  })

  if (!personas || personas.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">No Personas</h2>
        <p className="text-gray-500 dark:text-gray-400">
          You don't have any personas yet. Create one to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Your Personas</h2>
      <div className="space-y-4">
        {personas.map((persona) => (
          <button
            key={persona.toString()}
            className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <h3 className="font-medium">Persona #{persona.toString()}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click to switch
            </p>
          </button>
        ))}
      </div>
    </div>
  )
} 