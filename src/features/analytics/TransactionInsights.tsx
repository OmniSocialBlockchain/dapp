import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { usePublicClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TransactionInsight {
  date: string;
  gasSpent: number;
  transactions: number;
  dappInteractions: number;
}

const mockData: TransactionInsight[] = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
  }),
  gasSpent: Math.random() * 0.1,
  transactions: Math.floor(Math.random() * 10),
  dappInteractions: Math.floor(Math.random() * 5),
}));

export function TransactionInsights() {
  const { address } = useUser();
  const publicClient = usePublicClient();
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '1Y'>('1W');
  const [data, setData] = useState<TransactionInsight[]>(mockData);

  useEffect(() => {
    // In a real implementation, you would fetch actual transaction data
    // based on the selected time range
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch transaction data:', error);
      }
    };

    fetchData();
  }, [timeRange]);

  const formatGas = (value: number) => {
    return `${value.toFixed(4)} ETH`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Insights</CardTitle>
          <div className="flex space-x-2">
            {(['1W', '1M', '3M', '1Y'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Gas Spent</p>
              <p className="text-2xl font-bold">
                {data.reduce((sum, item) => sum + item.gasSpent, 0).toFixed(4)} ETH
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">
                {data.reduce((sum, item) => sum + item.transactions, 0)}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">DApp Interactions</p>
              <p className="text-2xl font-bold">
                {data.reduce((sum, item) => sum + item.dappInteractions, 0)}
              </p>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'gasSpent') return formatGas(value);
                    return value;
                  }}
                />
                <Bar dataKey="gasSpent" fill="#8884d8" name="Gas Spent" />
                <Bar dataKey="transactions" fill="#82ca9d" name="Transactions" />
                <Bar dataKey="dappInteractions" fill="#ffc658" name="DApp Interactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 