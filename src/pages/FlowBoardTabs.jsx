import React, { useEffect, useMemo, useState } from 'react';
import SOWAnalyzer from './SOWAnalyzer.jsx';
import { captureOpportunity, getOpportunities } from '../lib/api.js';
import { enqueue } from '../lib/enqueue.js';
import { buildApiUrl } from '../lib/runtimeApi.js';

const weights = {
  Profitability: 80,
  StrategicFit: 80,
  Competition: 70,
  SubcontractingPotential: 40,
  LikelihoodOfAward: 55,
  RelationshipLeverage: 45,
  PastPerformanceMatch: 20,
};

function scoreOpp(opp) {
  const keys = Object.keys(weights);
  const totalW = keys.reduce((sum, key) => sum + weights[key], 0);
  const score = keys.reduce((sum, key) => sum + (Number(opp?.metrics?.[key]) || 0) * weights[key], 0);
  return Math.round((score / totalW) * 100) / 100;
}

function OpportunitiesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureForm, setCaptureForm] = useState({
    title: '',
    agency: '',
    dueDate: '',
    solicitationNumber: '',
    sourceUrl: '',
    solicitationText: '',
  });

  const loadOpportunities = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOpportunities();
      if (Array.isArray(data)) {
        setItems(data);
      } else if (Array.isArray(data?.opportunities)) {
        setItems(data.opportunities);
      } else {
        setItems([]);
      }
    } catch (loadError) {
      setError(loadError.message || 'Failed to load opportunities');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const runJob = async (job) => {
    await enqueue(job);
    await loadOpportunities();
  };

  const handleCaptureChange = (event) => {
    const { name, value } = event.target;
    setCaptureForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCaptureSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsCapturing(true);
      setError(null);
      await captureOpportunity(captureForm);
      setCaptureForm({
        title: '',
        agency: '',
        dueDate: '',
        solicitationNumber: '',
        sourceUrl: '',
        solicitationText: '',
      });
      await loadOpportunities();
    } catch (captureError) {
      setError(captureError.message || 'Failed to capture solicitation');
    } finally {
      setIsCapturing(false);
    }
  };

  const ranked = useMemo(() => {
    const enriched = items.map((item) => ({ ...item, __score: scoreOpp(item) }));
    return enriched.sort((left, right) => right.__score - left.__score);
  }, [items]);

  const logToPipeline = async (opp) => {
    await runJob({ action: 'log_pipeline_opportunity', payload: { proposalId: opp.proposalId || opp.id, opportunityId: opp.id } });
  };

  const intakeOpportunity = async (opp) => {
    await runJob({ action: 'intake_opportunity', payload: { opportunityId: opp.id } });
  };

  const createUpload = async (opp) => {
    await runJob({ action: 'create_upload_drop', payload: { proposalId: opp.proposalId || opp.id, opportunityId: opp.id } });
  };

  const queueOverview = async (opp) => {
    const proposalId = opp.proposalId || opp.id;
    const popup = window.open('', '_blank');
    try {
      const resp = await fetch(buildApiUrl(`/proposals/${proposalId}/compliance-matrix`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Server error ${resp.status}`);
      if (data.artifactUrl && popup) {
        popup.location = data.artifactUrl;
      } else if (data.artifactUrl) {
        window.open(data.artifactUrl, '_blank', 'noopener,noreferrer');
      } else if (data.message) {
        // Show message if no artifact URL
        alert(data.message);
      }
      await loadOpportunities();
    } catch (err) {
      setError(err.message || 'Failed to generate compliance matrix');
    }
  };

  const runScan = async () => {
    await runJob({ action: 'run_opportunity_scan' });
  };

  const runPortalWatch = async () => {
    await runJob({ action: 'run_portal_watch' });
  };

  const runMarketResearch = async () => {
    await runJob({ action: 'run_market_research' });
  };

  if (loading) {
    return <div className="p-4">Loading opportunities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Capture Solicitation</h2>
          <p className="text-sm text-gray-600">
            Start the local intake pipeline in one move: create the proposal, generate the checklist, and generate the compliance matrix.
          </p>
        </div>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleCaptureSubmit}>
          <input
            className="rounded border px-3 py-2"
            name="title"
            placeholder="Solicitation title"
            required
            value={captureForm.title}
            onChange={handleCaptureChange}
          />
          <input
            className="rounded border px-3 py-2"
            name="agency"
            placeholder="Agency"
            value={captureForm.agency}
            onChange={handleCaptureChange}
          />
          <input
            className="rounded border px-3 py-2"
            name="dueDate"
            type="datetime-local"
            value={captureForm.dueDate}
            onChange={handleCaptureChange}
          />
          <input
            className="rounded border px-3 py-2"
            name="solicitationNumber"
            placeholder="Solicitation number"
            value={captureForm.solicitationNumber}
            onChange={handleCaptureChange}
          />
          <input
            className="rounded border px-3 py-2 md:col-span-2"
            name="sourceUrl"
            placeholder="Source URL"
            value={captureForm.sourceUrl}
            onChange={handleCaptureChange}
          />
          <textarea
            className="rounded border px-3 py-2 md:col-span-2"
            name="solicitationText"
            placeholder="Paste solicitation notes, scope, or summary"
            rows={5}
            value={captureForm.solicitationText}
            onChange={handleCaptureChange}
          />
          <div className="md:col-span-2">
            <button className="btn btn-primary" disabled={isCapturing} type="submit">
              {isCapturing ? 'Capturing...' : 'Capture to Proposal Pipeline'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Opportunities</h2>
        <div className="flex gap-2">
          <button onClick={runPortalWatch} className="btn btn-secondary">Run Portal Watch</button>
          <button onClick={runScan} className="btn btn-primary">Run Opportunity Scan</button>
          <button onClick={runMarketResearch} className="btn btn-outline">Run Market Research</button>
        </div>
      </div>
      {error && <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Rank</th>
              <th className="p-2">Title</th>
              <th className="p-2">Agency</th>
              <th className="p-2">Score</th>
              <th className="p-2">Fit</th>
              <th className="p-2">Stage</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((opp, index) => (
              <tr key={opp.id || index} className="border-b hover:bg-gray-50">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">
                  <a href={opp.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {opp.title || opp.name || 'Untitled'}
                  </a>
                </td>
                <td className="p-2">{opp.agency || '-'}</td>
                <td className="p-2 font-medium">{opp.__score}</td>
                <td className="p-2">{opp.fitDecision || (opp.fitScore >= 60 ? 'recommended' : 'watch')}</td>
                <td className="p-2">{opp.stage || 'opportunity'}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => intakeOpportunity(opp)} className="btn btn-primary">Create Proposal</button>
                  <button onClick={() => logToPipeline(opp)} className="btn btn-outline">Log to Pipeline</button>
                  <button onClick={() => createUpload(opp)} className="btn btn-outline">Upload Docs</button>
                  <button onClick={() => queueOverview(opp)} className="btn btn-secondary">Build Compliance Matrix</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketResearchTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Market Research</h2>
      <SOWAnalyzer />
    </div>
  );
}

export default function FlowBoardTabs() {
  const [tab, setTab] = useState('opps');
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">Flow Board</h1>
      <div className="border-b mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button className={`py-2 border-b-2 ${tab === 'opps' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`} onClick={() => setTab('opps')}>Opportunities</button>
          <button className={`py-2 border-b-2 ${tab === 'research' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`} onClick={() => setTab('research')}>Market Research</button>
        </nav>
      </div>
      {tab === 'opps' && <OpportunitiesTab />}
      {tab === 'research' && <MarketResearchTab />}
    </div>
  );
}
