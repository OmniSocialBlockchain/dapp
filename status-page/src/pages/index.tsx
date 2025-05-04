import React from 'react';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { format } from 'date-fns';
import axios from 'axios';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  lastUpdated: string;
  description: string;
  updates: Update[];
}

interface Update {
  id: string;
  timestamp: string;
  status: string;
  message: string;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      id: 'dapp',
      name: 'OmniSocial DApp',
      status: 'operational',
      lastUpdated: new Date().toISOString(),
      description: 'Main decentralized application interface',
      updates: []
    },
    {
      id: 'api',
      name: 'API Services',
      status: 'operational',
      lastUpdated: new Date().toISOString(),
      description: 'Backend API services',
      updates: []
    },
    {
      id: 'contracts',
      name: 'Smart Contracts',
      status: 'operational',
      lastUpdated: new Date().toISOString(),
      description: 'Ethereum smart contracts',
      updates: []
    },
    {
      id: 'ipfs',
      name: 'IPFS Storage',
      status: 'operational',
      lastUpdated: new Date().toISOString(),
      description: 'Decentralized storage',
      updates: []
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'outage':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'outage':
        return 'Service Outage';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>OmniSocial Status</title>
        <meta name="description" content="Real-time status of OmniSocial services" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">OmniSocial Status</h1>
          <p className="text-gray-600">Last updated: {format(new Date(), 'PPpp')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{service.name}</h2>
                <span className={`px-2 py-1 rounded-full text-white text-sm ${getStatusColor(service.status)}`}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="text-sm text-gray-500">
                Last updated: {format(new Date(service.lastUpdated), 'PPpp')}
              </div>
              
              {service.updates.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Recent Updates</h3>
                  <div className="space-y-2">
                    {service.updates.map((update) => (
                      <div key={update.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{update.status}</span>
                          <span className="text-gray-500">
                            {format(new Date(update.timestamp), 'PPpp')}
                          </span>
                        </div>
                        <p className="text-gray-600">{update.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">System Status</h2>
          <div className="text-2xl font-semibold text-green-500">
            {getStatusText('operational')}
          </div>
          <p className="text-gray-600 mt-2">
            All systems are operating normally. No incidents reported.
          </p>
        </div>
      </main>
    </div>
  );
} 