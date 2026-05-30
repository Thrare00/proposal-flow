import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, Target, Calculator,
  ChevronDown, ChevronUp, Award, AlertTriangle,
  BarChart3, Layers, Truck, Edit3, Plus, X, Save, Activity
} from 'lucide-react';

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

const OUTCOME_OPTIONS = ['win', 'loss', 'pending', 'pass'];
const TAB_KEYS = ['overview', 'estimate', 'bids', 'rates', 'revenue', 'procurement'];

export default function PricingDashboard() {
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [bids, setBids] = useState([]);
  const [rates, setRates] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bid filters
  const [bidFilterService, setBidFilterService] = useState('');
  const [bidFilterOutcome, setBidFilterOutcome] = useState('');

  // Rate card editor
  const [editingRate, setEditingRate] = useState(null);
  const [showAddRate, setShowAddRate] = useState(false);

  // Revenue editor
  const [editingRevMonth, setEditingRevMonth] = useState(null);
  const [showAddRevenue, setShowAddRevenue] = useState(false);

  // Estimate calculator state
  const [estService, setEstService] = useState('pressure_washing');
  const [estSubScope, setEstSubScope] = useState('');
  const [estQty, setEstQty] = useState(1000);
  const [estMiles, setEstMiles] = useState(15);
  const [estCondition, setEstCondition] = useState('light');
  const [estRush, setEstRush] = useState('');
  const [estResult, setEstResult] = useState(null);
  const [estLoading, setEstLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/pricing/dashboard`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/pricing/catalog`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/pricing/bids`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/pricing/rate-cards`).then(r => r.ok ? r.json() : { rateCards: [] }).catch(() => ({ rateCards: [] })),
      fetch(`${API}/pricing/revenue?months=12`).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(`${API}/revenue/summary`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([dash, cat, b, rc, rev, revSum]) => {
      setDashboard(dash);
      setCatalog(cat);
      setBids(Array.isArray(b) ? b : (b?.bids || []));
      setRates(Array.isArray(rc) ? rc : (rc?.rateCards || []));
      setRevenue(Array.isArray(rev) ? rev : (rev?.data || []));
      setRevenueSummary(revSum);
      setLoading(false);
    });
  }, []);

  const subScopes = useMemo(() => {
    if (!catalog?.services?.[estService]?.subScopes) return {};
    return catalog.services[estService].subScopes;
  }, [catalog, estService]);

  // Filtered bids
  const filteredBids = useMemo(() => {
    let filtered = bids;
    if (bidFilterService) filtered = filtered.filter(b => b.service === bidFilterService);
    if (bidFilterOutcome) filtered = filtered.filter(b => (b.outcome || 'pending') === bidFilterOutcome);
    return filtered;
  }, [bids, bidFilterService, bidFilterOutcome]);

  async function runEstimate() {
    setEstLoading(true);
    try {
      const res = await fetch(`${API}/pricing/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: estService,
          subScope: estSubScope || undefined,
          quantity: estQty,
          miles: estMiles,
          condition: estCondition,
          rush: estRush || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEstResult(data);
      } else {
        // Fallback to client-side if endpoint not available
        const catRes = await fetch(`${API}/pricing/catalog`);
        if (!catRes.ok) return;
        const cat = await catRes.json();
        const svcDef = cat.services?.[estService];
        if (!svcDef) return;
        const rateSrc = estSubScope && svcDef.subScopes?.[estSubScope]
          ? svcDef.subScopes[estSubScope] : svcDef;
        const base = rateSrc.baseRate.typical * estQty;
        const travelFactor = estMiles <= 20 ? 1 : estMiles <= 35 ? 1.10 : estMiles <= 50 ? 1.25 : estMiles <= 150 ? 1.42 : 1.65;
        const condFactor = { light: 1, moderate: 1.2, heavy: 1.5, hazardous: 1.7 }[estCondition] || 1;
        const rushFactor = estRush === 'same_day' ? 1.5 : estRush === '48hr' ? 1.25 : 1;
        const computed = base * travelFactor * condFactor * rushFactor;
        const final = Math.max(computed, svcDef.mobilizationMin || 0, svcDef.floorPrice || 0);
        setEstResult({
          price: final,
          details: { baseRate: rateSrc.baseRate.typical, baseSubtotal: base, computedPrice: computed, finalPrice: final, flooredApplied: final > computed, unit: rateSrc.unit || svcDef.unit, quantity: estQty },
          adjusters: { travel: { factor: travelFactor }, condition: { factor: condFactor }, rush: { factor: rushFactor } },
          marketRange: rateSrc.marketRange || null,
        });
      }
    } catch (e) {
      console.error('Estimate failed:', e);
    } finally {
      setEstLoading(false);
    }
  }

  async function saveRateCard(card) {
    const res = await fetch(`${API}/pricing/rate-cards`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    if (res.ok) {
      // Refetch rate cards
      const rc = await fetch(`${API}/pricing/rate-cards`).then(r => r.ok ? r.json() : { rateCards: [] });
      setRates(Array.isArray(rc) ? rc : (rc?.rateCards || []));
      setEditingRate(null);
      setShowAddRate(false);
    }
  }

  async function saveRevenue(entry) {
    const res = await fetch(`${API}/pricing/revenue`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const rev = await fetch(`${API}/pricing/revenue?months=12`).then(r => r.ok ? r.json() : { data: [] });
      setRevenue(Array.isArray(rev) ? rev : (rev?.data || []));
      const revSum = await fetch(`${API}/revenue/summary`).then(r => r.ok ? r.json() : null);
      setRevenueSummary(revSum);
      setEditingRevMonth(null);
      setShowAddRevenue(false);
    }
  }

  const stats = dashboard?.stats || {};
  const bidsByOutcome = useMemo(() => {
    const g = { win: [], loss: [], pending: [], pass: [] };
    bids.forEach(b => {
      const k = b.outcome || 'pending';
      (g[k] || (g[k] = [])).push(b);
    });
    return g;
  }, [bids]);

  const winRate = bids.length > 0
    ? bidsByOutcome.win.length / bids.filter(b => b.outcome === 'win' || b.outcome === 'loss').length
    : null;

  const totalBidValue = bids.reduce((s, b) => s + (b.bid_amount || 0), 0);
  const totalWonValue = bidsByOutcome.win.reduce((s, b) => s + (b.bid_amount || 0), 0);
  const avgMargin = bidsByOutcome.win.length > 0
    ? bidsByOutcome.win.reduce((s, b) => s + (b.margin_pct || 0), 0) / bidsByOutcome.win.length
    : null;

  const TAB_LABELS = { overview: 'Overview', estimate: 'Estimate Calculator', bids: 'Bid History', rates: 'Rate Cards', revenue: 'Revenue', procurement: 'Procurement' };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-green-600" size={28} />
          Pricing Intelligence
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TAB_KEYS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon={<BarChart3 size={20} />} label="Total Bids" value={bids.length} color="blue" />
            <KPI icon={<Award size={20} />} label="Win Rate" value={winRate != null ? pct(winRate) : '—'} color="green" />
            <KPI icon={<DollarSign size={20} />} label="Won Revenue" value={fmt(totalWonValue)} color="emerald" />
            <KPI icon={<TrendingUp size={20} />} label="Avg Win Margin" value={avgMargin != null ? pct(avgMargin) : '—'} color="amber" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Performance by Service</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th className="py-2 pr-4">Service</th>
                    <th className="py-2 pr-4 text-right">Bids</th>
                    <th className="py-2 pr-4 text-right">Wins</th>
                    <th className="py-2 pr-4 text-right">Win Rate</th>
                    <th className="py-2 pr-4 text-right">Total Bid $</th>
                    <th className="py-2 pr-4 text-right">Avg Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(SERVICE_LABELS).map(svc => {
                    const sb = bids.filter(b => b.service === svc);
                    if (sb.length === 0) return null;
                    const wins = sb.filter(b => b.outcome === 'win');
                    const decided = sb.filter(b => b.outcome === 'win' || b.outcome === 'loss');
                    const wr = decided.length > 0 ? wins.length / decided.length : null;
                    const am = wins.length > 0
                      ? wins.reduce((s, b) => s + (b.margin_pct || 0), 0) / wins.length : null;
                    return (
                      <tr key={svc} className="border-b border-gray-100 dark:border-gray-700/50">
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

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-3">Recent Wins</h2>
            {bidsByOutcome.win.length === 0 ? (
              <p className="text-gray-500 text-sm">No won bids recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {bidsByOutcome.win.slice(0, 8).map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <div>
                      <span className="font-medium">{b.client_name}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {SERVICE_LABELS[b.service] || b.service}{b.sub_scope ? ` / ${b.sub_scope}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-green-600">{fmt(b.bid_amount)}</span>
                      {b.margin_pct != null && (
                        <span className="text-xs text-gray-500 ml-2">{pct(b.margin_pct)} margin</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator size={20} /> Build Estimate
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service</label>
                <select
                  value={estService}
                  onChange={e => { setEstService(e.target.value); setEstSubScope(''); setEstResult(null); }}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sub-scope</label>
                <select
                  value={estSubScope}
                  onChange={e => { setEstSubScope(e.target.value); setEstResult(null); }}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Top-level (general)</option>
                  {Object.entries(subScopes).map(([k, v]) => (
                    <option key={k} value={k}>{v.description || k}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number" min="1" value={estQty}
                    onChange={e => setEstQty(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Distance (miles)</label>
                  <input
                    type="number" min="0" value={estMiles}
                    onChange={e => setEstMiles(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
                    value={estCondition}
                    onChange={e => setEstCondition(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="light">Light / Typical</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy / Distressed</option>
                    <option value="hazardous">Hazardous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rush</label>
                  <select
                    value={estRush}
                    onChange={e => setEstRush(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Standard</option>
                    <option value="48hr">48-Hour</option>
                    <option value="same_day">Same Day</option>
                  </select>
                </div>
              </div>
              <button
                onClick={runEstimate}
                disabled={estLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {estLoading ? 'Calculating...' : 'Calculate Price'}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Estimate Result</h2>
            {!estResult ? (
              <p className="text-gray-500 text-sm">Configure and run an estimate to see pricing.</p>
            ) : (
              <div className="space-y-4">
                <div className="text-3xl font-bold text-green-600">{fmt(estResult.price || estResult.details?.finalPrice)}</div>
                {estResult.details?.flooredApplied && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle size={16} />
                    Floor applied (computed {fmt(estResult.details.computedPrice)} was below minimum)
                  </div>
                )}

                {/* Margin display */}
                {estResult.margin != null && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Profit Margin</span>
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{fmt(estResult.margin)} ({pct(estResult.marginPct)})</span>
                    </div>
                  </div>
                )}

                {/* COGS Breakdown */}
                {estResult.breakdown && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">Cost Breakdown (COGS)</div>
                    <div className="space-y-1 text-sm">
                      <Row label={`Labor (${estResult.breakdown.laborHours}h)`} value={fmt(estResult.breakdown.labor)} />
                      <Row label="Materials" value={fmt(estResult.breakdown.materials)} />
                      <Row label="Fuel / Travel" value={fmt(estResult.breakdown.fuel)} />
                      <Row label="Overhead" value={fmt(estResult.breakdown.overhead)} />
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                        <Row label="Total Cost" value={fmt(estResult.cost)} bold />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <Row label="Base Rate" value={`${fmt(estResult.details?.baseRate)} / ${estResult.details?.unit}`} />
                  <Row label="Quantity" value={`${(estResult.details?.quantity || estQty).toLocaleString()} ${estResult.details?.unit || ''}`} />
                  <Row label="Base Subtotal" value={fmt(estResult.details?.baseSubtotal)} />
                  {estResult.adjusters && (
                    <>
                      <Row label="Travel Adj" value={`x${estResult.adjusters.travel?.factor}`} />
                      <Row label="Condition Adj" value={`x${estResult.adjusters.condition?.factor}`} />
                      <Row label="Rush Adj" value={`x${estResult.adjusters.rush?.factor}`} />
                    </>
                  )}
                </div>

                {(estResult.marketRange || estResult.benchmarks) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                    <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Market Range</div>
                    {estResult.marketRange && (
                      <div className="text-blue-600 dark:text-blue-400">
                        {fmt(estResult.marketRange.low)} — {fmt(estResult.marketRange.high)} / {estResult.details?.unit}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── BID HISTORY ─── */}
      {tab === 'bids' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Bid History ({filteredBids.length}{filteredBids.length !== bids.length ? ` of ${bids.length}` : ''})</h2>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={bidFilterService}
                onChange={e => setBidFilterService(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Services</option>
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={bidFilterOutcome}
                onChange={e => setBidFilterOutcome(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Outcomes</option>
                {OUTCOME_OPTIONS.map(o => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
              {(bidFilterService || bidFilterOutcome) && (
                <button
                  onClick={() => { setBidFilterService(''); setBidFilterOutcome(''); }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="py-2 px-3">Client</th>
                  <th className="py-2 px-3">Service</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Bid $</th>
                  <th className="py-2 px-3 text-right">Cost $</th>
                  <th className="py-2 px-3 text-right">Margin</th>
                  <th className="py-2 px-3">Outcome</th>
                  <th className="py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredBids.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-500">No bids match current filters.</td></tr>
                ) : filteredBids.map((b, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 font-medium">{b.client_name}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs">{SERVICE_LABELS[b.service] || b.service}</span>
                      {b.sub_scope && <span className="text-xs text-gray-400 ml-1">/ {b.sub_scope}</span>}
                    </td>
                    <td className="py-2 px-3 text-right">{b.quantity?.toLocaleString()}{b.unit ? ` ${b.unit}` : ''}</td>
                    <td className="py-2 px-3 text-right font-medium">{fmt(b.bid_amount)}</td>
                    <td className="py-2 px-3 text-right text-gray-500">{fmt(b.cost_amount)}</td>
                    <td className="py-2 px-3 text-right">{b.margin_pct != null ? pct(b.margin_pct) : '—'}</td>
                    <td className="py-2 px-3">
                      <OutcomeBadge outcome={b.outcome} />
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{b.bid_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── RATE CARDS ─── */}
      {tab === 'rates' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Rate Cards ({rates.length})</h2>
            <button
              onClick={() => { setShowAddRate(true); setEditingRate({ service: 'pressure_washing', sub_scope: '', base_rate: '', unit: 'sqft', property_type: '', notes: '' }); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus size={14} /> Add Rate
            </button>
          </div>

          {/* Edit/Add Modal */}
          {editingRate && (
            <RateCardForm
              rate={editingRate}
              isNew={showAddRate}
              onSave={saveRateCard}
              onCancel={() => { setEditingRate(null); setShowAddRate(false); }}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="py-2 px-3">Service</th>
                  <th className="py-2 px-3">Sub-scope</th>
                  <th className="py-2 px-3">Property Type</th>
                  <th className="py-2 px-3 text-right">Rate</th>
                  <th className="py-2 px-3">Unit</th>
                  <th className="py-2 px-3">Notes</th>
                  <th className="py-2 px-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-2 px-3 font-medium">{SERVICE_LABELS[r.service] || r.service}</td>
                    <td className="py-2 px-3">{r.sub_scope || '—'}</td>
                    <td className="py-2 px-3 text-xs">{r.property_type || 'any'}</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">{fmt(r.base_rate)}</td>
                    <td className="py-2 px-3 text-xs">{r.unit}</td>
                    <td className="py-2 px-3 text-xs text-gray-500 max-w-[200px] truncate">{r.notes || ''}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => { setEditingRate({ ...r }); setShowAddRate(false); }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PROCUREMENT ─── */}
      {tab === 'procurement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon={<Target size={20} />} label="Win Rate" value={winRate != null ? pct(winRate) : '—'} color="green" />
            <KPI icon={<DollarSign size={20} />} label="Avg Bid Size" value={fmt(bids.length > 0 ? totalBidValue / bids.length : 0)} color="blue" />
            <KPI icon={<Layers size={20} />} label="Pipeline (Pending)" value={fmt(bidsByOutcome.pending.reduce((s, b) => s + (b.bid_amount || 0), 0))} color="amber" />
            <KPI icon={<TrendingUp size={20} />} label="Conversion Rate" value={bids.length > 0 ? pct(bidsByOutcome.win.length / bids.length) : '—'} color="emerald" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Conversion Funnel</h2>
            <FunnelChart bids={bids} bidsByOutcome={bidsByOutcome} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Win Rate by Service</h2>
            <WinRateByService bids={bids} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Time to Win</h2>
            <TimeToWin bids={bidsByOutcome.win} />
          </div>
        </div>
      )}

      {/* ─── REVENUE ─── */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon={<DollarSign size={20} />} label="Monthly Revenue" value={fmt(revenueSummary?.monthlyRevenue)} color="emerald" />
            <KPI icon={<Activity size={20} />} label="Jobs This Month" value={revenueSummary?.monthlyJobCount || 0} color="blue" />
            <KPI icon={<Target size={20} />} label="% of Target" value={revenueSummary?.percentOfTarget != null ? `${revenueSummary.percentOfTarget}%` : '—'} color="amber" />
            <KPI icon={<TrendingUp size={20} />} label="Win Rate" value={revenueSummary?.winRate != null ? pct(revenueSummary.winRate) : '—'} color="green" />
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Monthly Revenue (Last 12 Months)</h2>
            <RevenueBarChart data={revenue} />
          </div>

          {/* Monthly Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Monthly Entries</h2>
              <button
                onClick={() => {
                  const now = new Date();
                  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                  setEditingRevMonth({ month, invoiced: 0, collected: 0, job_count: 0 });
                  setShowAddRevenue(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <Plus size={14} /> Add Month
              </button>
            </div>

            {editingRevMonth && (
              <RevenueForm
                entry={editingRevMonth}
                isNew={showAddRevenue}
                onSave={saveRevenue}
                onCancel={() => { setEditingRevMonth(null); setShowAddRevenue(false); }}
              />
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-left">
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-3 text-right">Invoiced</th>
                    <th className="py-2 px-3 text-right">Collected</th>
                    <th className="py-2 px-3 text-right">Jobs</th>
                    <th className="py-2 px-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-500">No revenue entries yet.</td></tr>
                  ) : revenue.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 px-3 font-medium">{r.month}</td>
                      <td className="py-2 px-3 text-right">{fmt(r.invoiced)}</td>
                      <td className="py-2 px-3 text-right">{fmt(r.collected)}</td>
                      <td className="py-2 px-3 text-right">{r.job_count || 0}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => { setEditingRevMonth({ ...r }); setShowAddRevenue(false); }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

function KPI({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  };
  return (
    <div className={`rounded-lg p-4 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-1 opacity-80">{icon}<span className="text-xs font-medium">{label}</span></div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}

function OutcomeBadge({ outcome }) {
  const styles = {
    win: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    loss: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    pass: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[outcome] || styles.pending}`}>
      {outcome || 'pending'}
    </span>
  );
}

function RateCardForm({ rate, isNew, onSave, onCancel }) {
  const [form, setForm] = useState({ ...rate });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">{isNew ? 'Add New Rate Card' : 'Edit Rate Card'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Service</label>
          <select value={form.service} onChange={e => update('service', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600">
            {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Sub-scope</label>
          <input value={form.sub_scope || ''} onChange={e => update('sub_scope', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. roof_soft_wash" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Base Rate ($)</label>
          <input type="number" step="0.01" value={form.base_rate} onChange={e => update('base_rate', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Unit</label>
          <input value={form.unit || ''} onChange={e => update('unit', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="sqft" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Property Type</label>
          <input value={form.property_type || ''} onChange={e => update('property_type', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="any" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Notes</label>
          <input value={form.notes || ''} onChange={e => update('notes', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave({ ...form, base_rate: Number(form.base_rate) })}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          <Save size={14} /> Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
      </div>
    </div>
  );
}

function RevenueForm({ entry, isNew, onSave, onCancel }) {
  const [form, setForm] = useState({ ...entry });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">{isNew ? 'Add Revenue Entry' : `Edit ${form.month}`}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Month (YYYY-MM)</label>
          <input value={form.month || ''} onChange={e => update('month', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="2026-05" disabled={!isNew} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Invoiced ($)</label>
          <input type="number" step="0.01" value={form.invoiced || 0} onChange={e => update('invoiced', Number(e.target.value))} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Collected ($)</label>
          <input type="number" step="0.01" value={form.collected || 0} onChange={e => update('collected', Number(e.target.value))} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Job Count</label>
          <input type="number" value={form.job_count || 0} onChange={e => update('job_count', Number(e.target.value))} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          <Save size={14} /> Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
      </div>
    </div>
  );
}

function RevenueBarChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">No revenue data available.</p>;
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.invoiced || 0, d.collected || 0)), 1);

  return (
    <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
      {data.map((d, i) => {
        const invH = ((d.invoiced || 0) / maxVal) * 100;
        const colH = ((d.collected || 0) / maxVal) * 100;
        return (
          <div key={i} className="flex flex-col items-center min-w-[40px] flex-1">
            <div className="flex items-end gap-0.5 h-36 w-full justify-center">
              <div
                className="bg-blue-400 dark:bg-blue-500 rounded-t w-3 transition-all"
                style={{ height: `${invH}%` }}
                title={`Invoiced: $${(d.invoiced || 0).toLocaleString()}`}
              />
              <div
                className="bg-green-400 dark:bg-green-500 rounded-t w-3 transition-all"
                style={{ height: `${colH}%` }}
                title={`Collected: $${(d.collected || 0).toLocaleString()}`}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{(d.month || '').slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function FunnelChart({ bids, bidsByOutcome }) {
  const stages = [
    { label: 'Total Bids', count: bids.length, color: 'bg-blue-500' },
    { label: 'Submitted (excl. Pass)', count: bids.length - (bidsByOutcome.pass?.length || 0), color: 'bg-indigo-500' },
    { label: 'Decided', count: (bidsByOutcome.win?.length || 0) + (bidsByOutcome.loss?.length || 0), color: 'bg-purple-500' },
    { label: 'Won', count: bidsByOutcome.win?.length || 0, color: 'bg-green-500' },
  ];
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const widthPct = (stage.count / maxCount) * 100;
        const convRate = i > 0 && stages[i - 1].count > 0
          ? ((stage.count / stages[i - 1].count) * 100).toFixed(0) + '%'
          : null;
        return (
          <div key={stage.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">{stage.label}</span>
              <span className="text-gray-500">
                {stage.count}
                {convRate && <span className="ml-2 text-xs text-gray-400">({convRate} from prev)</span>}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-6">
              <div
                className={`${stage.color} h-6 rounded-full transition-all flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(widthPct, 3)}%` }}
              >
                {widthPct > 15 && <span className="text-white text-xs font-medium">{stage.count}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WinRateByService({ bids }) {
  const services = {};
  bids.forEach(b => {
    const svc = b.service || 'unknown';
    if (!services[svc]) services[svc] = { total: 0, wins: 0, decided: 0 };
    services[svc].total++;
    if (b.outcome === 'win') { services[svc].wins++; services[svc].decided++; }
    if (b.outcome === 'loss') services[svc].decided++;
  });

  const entries = Object.entries(services)
    .map(([svc, d]) => ({ svc, ...d, wr: d.decided > 0 ? d.wins / d.decided : null }))
    .sort((a, b) => (b.wr ?? -1) - (a.wr ?? -1));

  const LABELS = {
    pressure_washing: 'Pressure Washing',
    property_preservation: 'Property Preservation',
    restriping: 'Parking Lot Striping',
    aggregates: 'Aggregates',
    multifamily: 'Multifamily',
  };

  return (
    <div className="space-y-3">
      {entries.map(e => (
        <div key={e.svc}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium">{LABELS[e.svc] || e.svc}</span>
            <span className="text-gray-500">{e.wr != null ? `${(e.wr * 100).toFixed(0)}%` : 'No decisions'} ({e.wins}W / {e.decided}D / {e.total}T)</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${e.wr != null ? Math.max(e.wr * 100, 3) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeToWin({ bids }) {
  const withDays = bids.filter(b => b.bid_date && b.decided_date).map(b => {
    const submitted = new Date(b.bid_date);
    const decided = new Date(b.decided_date);
    const days = Math.round((decided - submitted) / (1000 * 60 * 60 * 24));
    return { ...b, days };
  }).filter(b => b.days >= 0);

  if (withDays.length === 0) {
    return <p className="text-gray-500 text-sm">No time-to-win data available. Bid records need both bid_date and decided_date fields.</p>;
  }

  const avgDays = Math.round(withDays.reduce((s, b) => s + b.days, 0) / withDays.length);
  const minDays = Math.min(...withDays.map(b => b.days));
  const maxDays = Math.max(...withDays.map(b => b.days));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{minDays}d</div>
          <div className="text-xs text-green-600 dark:text-green-400">Fastest</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{avgDays}d</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Average</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{maxDays}d</div>
          <div className="text-xs text-amber-600 dark:text-amber-400">Longest</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="py-2 pr-4">Client</th>
              <th className="py-2 pr-4">Service</th>
              <th className="py-2 pr-4 text-right">Days to Win</th>
              <th className="py-2 pr-4 text-right">Bid Amount</th>
            </tr>
          </thead>
          <tbody>
            {withDays.sort((a, b) => a.days - b.days).map((b, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2 pr-4">{b.client_name}</td>
                <td className="py-2 pr-4 text-xs">{b.service}</td>
                <td className="py-2 pr-4 text-right font-medium">{b.days}d</td>
                <td className="py-2 pr-4 text-right">${(b.bid_amount || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
