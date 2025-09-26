import React, { useState } from 'react';
import { ProposalList } from './ProposalList.jsx';
import Guide from './Guide.jsx';
import { enqueue } from '../lib/enqueue.js';

function DraftOverviewTab() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const runDraftOverview = async () => {
    try {
      setStatus('running');
      setError(null);
      await enqueue({ action: 'proposal_overview' });
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Failed to enqueue Draft Overview');
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Draft Overview</h2>
        <button
          className="btn btn-primary"
          onClick={runDraftOverview}
          disabled={status==='running'}
        >
          {status==='running' ? 'Sending...' : 'Run Proposal Overview'}
        </button>
      </div>
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">{error}</div>
      )}
      <p className="text-gray-600 text-sm">
        This automation generates a high-level proposal overview (objectives, approach, risks, win themes)
        based on the latest SOW and research artifacts.
      </p>
    </div>
  );
}

export default function ProposalsTabs() {
  const [tab, setTab] = useState('list');
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">Proposals</h1>
      <div className="border-b mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button className={`py-2 border-b-2 ${tab==='list'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('list')}>List</button>
          <button className={`py-2 border-b-2 ${tab==='overview'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('overview')}>Draft Overview</button>
          <button className={`py-2 border-b-2 ${tab==='guide'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('guide')}>Guide</button>
        </nav>
      </div>
      {tab==='list' && <ProposalList />}
      {tab==='overview' && <DraftOverviewTab />}
      {tab==='guide' && <Guide />}
    </div>
  );
}
