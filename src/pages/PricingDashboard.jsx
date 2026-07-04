import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Award, DollarSign, TrendingUp } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatTile from '../components/dashboard/StatTile.jsx';
import OutcomeBadge from '../components/pipeline/OutcomeBadge.jsx';
import BidHistoryTable from '../components/pipeline/BidHistoryTable.jsx';
import EstimateCalculator from '../components/pipeline/EstimateCalculator.jsx';
import RateCardManager from '../components/pipeline/RateCardManager.jsx';
import RevenuePanel from '../components/pipeline/RevenuePanel.jsx';
import ProcurementInsights from '../components/pipeline/ProcurementInsights.jsx';

const API = (import.meta.env.VITE_API_URL || '') + (import.meta.env.BASE_URL || '/proposal-flow/').replace(/\/$/, '') + '/api';

function fmt(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pct(n) {
  if (n == null) return '—';
  return (n * 100).toFixed(1) + '%';
}

const SERVICE_LABELS = {
  pressure_washing: 'Pressure Washing',
  property_preservation: 'Property Preservation',
  restriping: 'Parking Lot Striping',
  aggregates: 'Aggregates',
  multifamily: 'Multifamily',
};

const TAB_KEYS = ['overview', 'estimate', 'bids', 'rates', 'revenue', 'procurement'];
const TAB_LABELS = {
  overview: 'Overview',
  estimate: 'Estimate Calculator',
  bids: 'Bid History',
  rates: 'Rate Cards',
  revenue: 'Revenue',
  procurement: 'Procurement',
};

export default function PricingDashboard() {
  const [tab, setTab] = useState('overview');
  const [catalog, setCatalog] = useState(null);
  const [bids, setBids] = useState([]);
  const [rates, setRates] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/pricing/catalog`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API}/pricing/bids`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch(`${API}/pricing/rate-cards`).then((r) => (r.ok ? r.json() : { rateCards: [] })).catch(() => ({ rateCards: [] })),
      fetch(`${API}/pricing/revenue?months=12`).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
      fetch(`${API}/revenue/summary`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([cat, b, rc, rev, revSum]) => {
      setCatalog(cat);
      setBids(Array.isArray(b) ? b : b?.bids || []);
      setRates(Array.isArray(rc) ? rc : rc?.rateCards || []);
      setRevenue(Array.isArray(rev) ? rev : rev?.data || []);
      setRevenueSummary(revSum);
      setLoading(false);
    });
  }, []);

  // ── Derived outcome groupings (real bid data only) ──────────────────────────
  const bidsByOutcome = useMemo(() => {
    const g = { win: [], loss: [], pending: [], pass: [] };
    bids.forEach((b) => {
      const k = b.outcome || 'pending';
      (g[k] || (g[k] = [])).push(b);
    });
    return g;
  }, [bids]);

  const decidedCount = bidsByOutcome.win.length + bidsByOutcome.loss.length;
  const winRate = decidedCount > 0 ? bidsByOutcome.win.length / decidedCount : null;
  const totalWonValue = bidsByOutcome.win.reduce((s, b) => s + (b.bid_amount || 0), 0);
  const avgMargin = bidsByOutcome.win.length > 0
    ? bidsByOutcome.win.reduce((s, b) => s + (b.margin_pct || 0), 0) / bidsByOutcome.win.length
    : null;

  // ── API-only estimate: returns result or throws (no client-side fallback) ───
  async function handleEstimate(payload) {
    const res = await fetch(`${API}/pricing/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Estimate service unavailable (${res.status})`);
    }
    return res.json();
  }

  async function saveRateCard(card) {
    const res = await fetch(`${API}/pricing/rate-cards`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    if (!res.ok) throw new Error('Failed to save rate card');
    const rc = await fetch(`${API}/pricing/rate-cards`).then((r) => (r.ok ? r.json() : { rateCards: [] }));
    setRates(Array.isArray(rc) ? rc : rc?.rateCards || []);
  }

  async function saveRevenue(entry) {
    const res = await fetch(`${API}/pricing/revenue`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Failed to save revenue entry');
    const rev = await fetch(`${API}/pricing/revenue?months=12`).then((r) => (r.ok ? r.json() : { data: [] }));
    setRevenue(Array.isArray(rev) ? rev : rev?.data || []);
    const revSum = await fetch(`${API}/revenue/summary`).then((r) => (r.ok ? r.json() : null));
    setRevenueSummary(revSum);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rare-crimson" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <PageHeader
        title="Pipeline"
        subtitle="Estimating, bid history, rate cards, revenue & procurement"
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-rare-gray-light dark:border-white/10">
        {TAB_KEYS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 font-rare-sans text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t
                ? 'border-rare-crimson text-rare-crimson'
                : 'border-transparent text-rare-gray hover:text-rare-ink dark:text-white/50 dark:hover:text-white'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile icon={BarChart3} label="Total Bids" value={bids.length} tone="neutral" />
            <StatTile
              icon={Award}
              label="Win Rate"
              value={winRate != null ? pct(winRate) : '—'}
              tone="lime"
              sublabel={decidedCount > 0 ? `${bidsByOutcome.win.length}W / ${decidedCount} decided` : 'No decided bids yet'}
            />
            <StatTile icon={DollarSign} label="Won Revenue" value={fmt(totalWonValue)} tone="lime" />
            <StatTile
              icon={TrendingUp}
              label="Avg Win Margin"
              value={avgMargin != null ? pct(avgMargin) : '—'}
              tone="gold"
            />
          </div>

          {/* Performance by Service */}
          <div className="rounded-xl bg-white/95 p-4 shadow-card dark:bg-rare-ink">
            <h2 className="mb-4 font-rare-serif text-lg font-bold text-rare-ink dark:text-white">
              Performance by Service
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rare-gray-light text-left font-rare-sans text-xs uppercase tracking-wide text-rare-gray dark:border-white/10 dark:text-white/50">
                    <th className="py-2 pr-4">Service</th>
                    <th className="py-2 pr-4 text-right">Bids</th>
                    <th className="py-2 pr-4 text-right">Wins</th>
                    <th className="py-2 pr-4 text-right">Win Rate</th>
                    <th className="py-2 pr-4 text-right">Total Bid $</th>
                    <th className="py-2 pr-4 text-right">Avg Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(SERVICE_LABELS).map((svc) => {
                    const sb = bids.filter((b) => b.service === svc);
                    if (sb.length === 0) return null;
                    const wins = sb.filter((b) => b.outcome === 'win');
                    const decided = sb.filter((b) => b.outcome === 'win' || b.outcome === 'loss');
                    const wr = decided.length > 0 ? wins.length / decided.length : null;
                    const am = wins.length > 0
                      ? wins.reduce((s, b) => s + (b.margin_pct || 0), 0) / wins.length
                      : null;
                    return (
                      <tr key={svc} className="border-b border-rare-gray-light/60 text-rare-ink dark:border-white/5 dark:text-white/80">
                        <td className="py-2 pr-4 font-medium">{SERVICE_LABELS[svc]}</td>
                        <td className="py-2 pr-4 text-right">{sb.length}</td>
                        <td className="py-2 pr-4 text-right">{wins.length}</td>
                        <td className="py-2 pr-4 text-right">{wr != null ? pct(wr) : '—'}</td>
                        <td className="py-2 pr-4 text-right">{fmt(sb.reduce((s, b) => s + (b.bid_amount || 0), 0))}</td>
                        <td className="py-2 pr-4 text-right">{am != null ? pct(am) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Wins */}
          <div className="rounded-xl bg-white/95 p-4 shadow-card dark:bg-rare-ink">
            <h2 className="mb-3 font-rare-serif text-lg font-bold text-rare-ink dark:text-white">
              Recent Wins
            </h2>
            {bidsByOutcome.win.length === 0 ? (
              <p className="font-rare-sans text-sm text-rare-gray dark:text-white/50">No won bids recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {bidsByOutcome.win.slice(0, 8).map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-rare-gray-light/60 py-2 last:border-0 dark:border-white/5"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-rare-ink dark:text-white">{b.client_name}</span>
                      <span className="ml-2 text-xs text-rare-gray dark:text-white/40">
                        {SERVICE_LABELS[b.service] || b.service}{b.sub_scope ? ` / ${b.sub_scope}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap text-right">
                      <span className="font-semibold text-rare-lime-dark dark:text-rare-lime">{fmt(b.bid_amount)}</span>
                      {b.margin_pct != null && (
                        <OutcomeBadge outcome="win" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ESTIMATE CALCULATOR ─── */}
      {tab === 'estimate' && (
        <EstimateCalculator
          catalog={catalog}
          serviceLabels={SERVICE_LABELS}
          onEstimate={handleEstimate}
        />
      )}

      {/* ─── BID HISTORY ─── */}
      {tab === 'bids' && (
        <BidHistoryTable bids={bids} serviceLabels={SERVICE_LABELS} />
      )}

      {/* ─── RATE CARDS ─── */}
      {tab === 'rates' && (
        <RateCardManager rates={rates} serviceLabels={SERVICE_LABELS} onSave={saveRateCard} />
      )}

      {/* ─── REVENUE ─── */}
      {tab === 'revenue' && (
        <RevenuePanel revenue={revenue} summary={revenueSummary} onSave={saveRevenue} />
      )}

      {/* ─── PROCUREMENT ─── */}
      {tab === 'procurement' && (
        <ProcurementInsights bids={bids} serviceLabels={SERVICE_LABELS} />
      )}
    </div>
  );
}
