import React, { useEffect, useMemo, useState } from 'react';
import SOWAnalyzer from './SOWAnalyzer.jsx';
import { getOpportunities } from '../lib/api.js';
import { enqueue } from '../lib/enqueue.js';

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
  // Expect metrics as 0-100; if missing, treat as 0
  const keys = Object.keys(weights);
  const totalW = keys.reduce((s, k) => s + weights[k], 0);
  const s = keys.reduce((sum, k) => sum + (Number(opp?.metrics?.[k]) || 0) * weights[k], 0);
  return Math.round((s / totalW) * 100) / 100; // 2 decimals
}

function OpportunitiesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOpportunities();
        if (Array.isArray(data)) {
          if (mounted) setItems(data);
        } else if (Array.isArray(data?.opportunities)) {
          if (mounted) setItems(data.opportunities);
        } else {
          if (mounted) setItems([]);
        }
      } catch (e) {
        setError(e.message || 'Failed to load opportunities');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const ranked = useMemo(() => {
    const enriched = items.map(o => ({ ...o, __score: scoreOpp(o) }));
    return enriched.sort((a, b) => b.__score - a.__score);
  }, [items]);

  const upgradeStage = async (opp, nextStage) => {
    await enqueue({ action: 'update_stage', payload: { opportunityId: opp.id, stage: nextStage } });
  };

  const logToPipeline = async (opp) => {
    await enqueue({ action: 'log_pipeline_opportunity', payload: { opportunityId: opp.id } });
  };

  const createUpload = async (opp) => {
    await enqueue({ action: 'create_upload_drop', payload: { opportunityId: opp.id } });
  };

  const runScan = async () => {
    await enqueue({ action: 'run_opportunity_scan' });
  };

  if (loading) return <div className="p-4">Loading opportunities...</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Opportunities</h2>
        <button onClick={runScan} className="btn btn-primary">Run Opportunity Scan</button>
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
              <th className="p-2">Stage</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((o, idx) => (
              <tr key={o.id || idx} className="border-b hover:bg-gray-50">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2"><a href={o.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{o.title || o.name || 'Untitled'}</a></td>
                <td className="p-2">{o.agency || '-'}</td>
                <td className="p-2 font-medium">{o.__score}</td>
                <td className="p-2">{o.stage || 'opportunity'}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => logToPipeline(o)} className="btn btn-outline">Log to Pipeline</button>
                  <button onClick={() => createUpload(o)} className="btn btn-outline">Upload Docs</button>
                  <button onClick={() => upgradeStage(o, 'market_research')} className="btn btn-secondary">Upgrade → Research</button>
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
          <button className={`py-2 border-b-2 ${tab==='opps'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('opps')}>Opportunities</button>
          <button className={`py-2 border-b-2 ${tab==='research'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('research')}>Market Research</button>
        </nav>
      </div>
      {tab==='opps' && <OpportunitiesTab />}
      {tab==='research' && <MarketResearchTab />}
    </div>
  );
}
