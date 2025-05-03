import React from 'react';
import { CreateProposal } from './CreateProposal';
import { ProposalList } from './ProposalList';

export function DAODashboard() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DAO Dashboard</h1>
        <CreateProposal />
      </div>
      <ProposalList />
    </div>
  );
} 