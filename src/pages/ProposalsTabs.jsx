import React, { useState, useEffect } from 'react';
import { ProposalList } from './ProposalList.jsx';
import ProposalDevelopmentGuide from './ProposalDevelopmentGuide.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { buildApiUrl } from '../lib/runtimeApi.js';

function WorkflowBuilderTab() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    fetch(buildApiUrl('/proposals'))
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProposals(list);
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const runAction = async (path, nextStatus) => {
    if (!selectedId) {
      setError('Select a proposal first.');
      return;
    }
    const openInBrowser = path.includes('/final-draft');
    const popup = openInBrowser ? window.open('', '_blank') : null;
    try {
      setStatus(nextStatus);
      setError(null);
      const resp = await fetch(buildApiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Server error ${resp.status}`);
      const nextUrl = data.gdocUrl || data.artifactUrl || data.gdocAuthUrl;
      if (openInBrowser && nextUrl && popup) {
        popup.location = nextUrl;
      } else if (data.message && !nextUrl) {
        // Show message if no URL to navigate to
        alert(data.message);
      }
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Failed to run action');
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Workflow Builder</h2>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Proposal</label>
          <select
            className="rounded border px-3 py-2 w-full max-w-md"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setStatus('idle');
              setError(null);
            }}
          >
            {proposals.length === 0 && <option value="">No proposals found</option>}
            {proposals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.id} — {p.agency || 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-primary"
            onClick={() => runAction(`/proposals/${selectedId}/compliance-matrix`, 'running')}
            disabled={status === 'running' || status === 'drafting' || !selectedId}
          >
            {status === 'running' ? 'Building Compliance Matrix...' : 'Build Compliance Matrix'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => runAction(`/proposals/${selectedId}/pre-solicitation`, 'pre')}
            disabled={status === 'running' || status === 'drafting' || !selectedId}
          >
            Pre-solicitation
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => runAction(`/proposals/${selectedId}/outline`, 'outline')}
            disabled={status === 'running' || status === 'drafting' || !selectedId}
          >
            Generate Outline
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => runAction(`/proposals/${selectedId}/rough-draft`, 'drafting')}
            disabled={status === 'running' || status === 'drafting' || !selectedId}
          >
            Rough Draft
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => runAction(`/proposals/${selectedId}/ai-review`, 'review')}
            disabled={status === 'running' || status === 'drafting' || !selectedId}
          >
            AI Review
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => runAction(`/proposals/${selectedId}/final-draft`, 'final')}
            disabled={status === 'running' || status === 'drafting' || !selectedId}
          >
            Final Draft
          </button>
        </div>

        {status === 'done' && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800">
            Done - artifact opened in a new tab.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>

      <p className="text-gray-600 text-sm">
        Runs the staged workflow end-to-end: compliance matrix, pre-solicitation, outline, rough draft, AI review, and final draft in Google Docs.
      </p>
    </div>
  );
}

export default function ProposalsTabs() {
  const [tab, setTab] = useState('list');
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <PageHeader title="Proposals" />
      <div className="border-b mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button className={`py-2 border-b-2 ${tab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`} onClick={() => setTab('list')}>List</button>
          <button className={`py-2 border-b-2 ${tab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`} onClick={() => setTab('overview')}>Workflow Builder</button>
          <button className={`py-2 border-b-2 ${tab === 'guide' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`} onClick={() => setTab('guide')}>Guide</button>
        </nav>
      </div>
      {tab === 'list' && <ProposalList />}
      {tab === 'overview' && <WorkflowBuilderTab />}
      {tab === 'guide' && <ProposalDevelopmentGuide />}
    </div>
  );
}
