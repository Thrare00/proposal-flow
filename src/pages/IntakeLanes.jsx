import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { buildApiUrl } from '../lib/runtimeApi.js';
import { formatDate } from '../utils/dateUtils.js';

// ── Lane config ───────────────────────────────────────────────────────────────
const LANES = [
  {
    id: 'active_pursuit',
    label: 'Active Pursuit',
    description: 'Score ≥ 65 — cleared for proposal workflow',
    headerCls: 'bg-green-700 text-white',
    badgeCls: 'bg-green-100 text-green-800 border border-green-200',
    borderCls: 'border-l-4 border-green-500',
    dotCls: 'bg-green-500',
  },
  {
    id: 'review_queue',
    label: 'Review Queue',
    description: 'Score 45–64 — needs decision before activating',
    headerCls: 'bg-amber-600 text-white',
    badgeCls: 'bg-amber-100 text-amber-800 border border-amber-200',
    borderCls: 'border-l-4 border-amber-500',
    dotCls: 'bg-amber-500',
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    description: 'Score < 45 — monitor only',
    headerCls: 'bg-blue-600 text-white',
    badgeCls: 'bg-blue-100 text-blue-800 border border-blue-200',
    borderCls: 'border-l-4 border-blue-400',
    dotCls: 'bg-blue-400',
  },
  {
    id: 'award_intel',
    label: 'Award Intel',
    description: 'Already awarded — intel only, never active',
    headerCls: 'bg-purple-700 text-white',
    badgeCls: 'bg-purple-100 text-purple-800 border border-purple-200',
    borderCls: 'border-l-4 border-purple-400',
    dotCls: 'bg-purple-400',
  },
  {
    id: 'archive',
    label: 'Archive',
    description: 'Closed, submitted, expired, or retired',
    headerCls: 'bg-gray-600 text-white',
    badgeCls: 'bg-gray-100 text-gray-600 border border-gray-200',
    borderCls: 'border-l-4 border-gray-400',
    dotCls: 'bg-gray-400',
  },
];

const LANE_ORDER = LANES.map((l) => l.id);

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  if (score == null) return <span className="text-xs text-gray-400">—</span>;
  const n = Number(score);
  const cls =
    n >= 65 ? 'bg-green-100 text-green-800 border-green-200' :
    n >= 45 ? 'bg-amber-100 text-amber-800 border-amber-200' :
    'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>
      {n}
    </span>
  );
}

// ── Fit flags chip list ───────────────────────────────────────────────────────
function FitFlags({ flags }) {
  if (!Array.isArray(flags) || flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {flags.slice(0, 4).map((f) => (
        <span key={f} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
          {String(f).replace(/^(service|geo|agency|keyword):/, '')}
        </span>
      ))}
      {flags.length > 4 && (
        <span className="text-[10px] text-gray-400">+{flags.length - 4}</span>
      )}
    </div>
  );
}

// ── Single proposal card ──────────────────────────────────────────────────────
function ProposalCard({ proposal, lane, onMoveLane }) {
  const meta = proposal.metadata || {};
  const score = meta.morpheusScore ?? meta.fitScore ?? null;
  const flags = meta.fitReasons || meta.fitFlags || [];
  const serviceLine = meta.serviceLine || meta.fit || null;
  const deadlineDays = meta.deadlineDays ?? null;
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const menuRef = useRef(null);

  const otherLanes = LANES.filter((l) => l.id !== lane.id);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMoveMenu) return;
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMoveMenu(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMoveMenu]);

  async function moveTo(targetLane) {
    setMoving(true);
    setMoveError(null);
    setShowMoveMenu(false);
    const ok = await onMoveLane(proposal.id, targetLane);
    if (!ok) setMoveError('Move failed');
    setMoving(false);
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${lane.borderCls} p-3 relative`}>
      {/* Title + score */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <Link
          to={`/proposals/${proposal.id}`}
          className="text-sm font-medium text-gray-900 hover:text-blue-700 line-clamp-2 flex-1"
        >
          {proposal.title}
        </Link>
        <ScoreBadge score={score} />
      </div>

      {/* Agency + deadline */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mb-1">
        {proposal.agency && proposal.agency !== 'Unknown Agency' && (
          <span className="truncate max-w-[140px]">{proposal.agency}</span>
        )}
        {proposal.dueDate && (
          <span className={deadlineDays != null && deadlineDays <= 7 ? 'text-red-600 font-medium' : ''}>
            Due {formatDate(proposal.dueDate, '—')}
            {deadlineDays != null && ` (${deadlineDays}d)`}
          </span>
        )}
      </div>

      {/* Service line */}
      {serviceLine && (
        <div className="text-[11px] text-blue-700 mb-1">
          {serviceLine}
        </div>
      )}

      {/* Fit flags */}
      <FitFlags flags={flags} />

      {/* Move to lane */}
      <div className="mt-2 flex items-center gap-2 relative" ref={menuRef}>
        <button
          onClick={() => setShowMoveMenu((v) => !v)}
          disabled={moving}
          className="text-[11px] text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50 disabled:opacity-40"
        >
          {moving ? 'Moving…' : 'Move to…'}
        </button>
        {moveError && (
          <span className="text-[10px] text-red-600">{moveError}</span>
        )}
        {showMoveMenu && (
          <div className="absolute left-0 top-6 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
            {otherLanes.map((l) => (
              <button
                key={l.id}
                onClick={() => moveTo(l.id)}
                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${l.dotCls}`} />
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lane column ───────────────────────────────────────────────────────────────
function LaneColumn({ lane, proposals, onMoveLane }) {
  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className={`rounded-t-lg px-3 py-2 ${lane.headerCls}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{lane.label}</span>
          <span className="text-xs opacity-80 bg-white/20 rounded-full px-2 py-0.5">{proposals.length}</span>
        </div>
        <p className="text-[10px] opacity-75 mt-0.5">{lane.description}</p>
      </div>

      {/* Cards */}
      <div className="flex-1 bg-gray-50 rounded-b-lg border border-t-0 border-gray-200 p-2 space-y-2 min-h-[120px]">
        {proposals.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">Empty</div>
        ) : (
          proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} lane={lane} onMoveLane={onMoveLane} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IntakeLanes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState(null);
  const [activeLane, setActiveLane] = useState('active_pursuit');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl('/proposals/by-lane'));
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMoveLane = useCallback(async (proposalId, targetLane) => {
    const res = await fetch(buildApiUrl(`/proposals/${proposalId}/lane`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeLane: targetLane }),
    });
    if (res.ok) { await load(); return true; }
    return false;
  }, [load]);

  const handleBulkArchive = useCallback(async () => {
    setArchiving(true);
    setArchiveResult(null);
    try {
      const res = await fetch(buildApiUrl('/proposals/bulk-archive'), { method: 'POST' });
      const result = await res.json();
      setArchiveResult(result);
      await load();
    } finally {
      setArchiving(false);
    }
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-400 text-sm">
        Loading intake lanes…
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
        {error}
      </div>
    );
  }

  const lanes = data?.lanes || {};
  const counts = data?.counts || {};
  const unclassified = lanes.unclassified || [];
  const currentLane = LANES.find((l) => l.id === activeLane);
  const currentProposals = lanes[activeLane] || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Lanes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Score-gated routing — every solicitation earns its lane before entering pursuit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unclassified.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-1 rounded">
              {unclassified.length} unclassified (housekeeping pending)
            </span>
          )}
          <button
            onClick={handleBulkArchive}
            disabled={archiving}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40"
          >
            {archiving ? 'Archiving…' : 'Auto-archive stale'}
          </button>
          <button
            onClick={load}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {archiveResult && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
          Auto-archive complete: {archiveResult.archived} proposals moved to Award Intel / Archive.
        </div>
      )}

      {/* Lane tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-0">
        {LANES.map((lane) => (
          <button
            key={lane.id}
            onClick={() => setActiveLane(lane.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeLane === lane.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${lane.dotCls}`} />
            {lane.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${lane.badgeCls}`}>
              {counts[lane.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Active lane description */}
      {currentLane && (
        <p className="text-sm text-gray-500">{currentLane.description}</p>
      )}

      {/* Card grid for active lane */}
      {currentProposals.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No proposals in this lane.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {currentProposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              lane={currentLane}
              onMoveLane={handleMoveLane}
            />
          ))}
        </div>
      )}
    </div>
  );
}
