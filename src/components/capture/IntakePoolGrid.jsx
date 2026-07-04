import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Filter,
  ChevronDown,
  Building2,
  CalendarDays,
  Tag,
  Send,
  MoveRight,
  X,
} from 'lucide-react';

const LANES = [
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'review_queue', label: 'Review Queue' },
  { value: 'active_pursuit', label: 'Active Pursuit' },
];

const SCORE_THRESHOLDS = [0, 45, 65, 80];

function laneLabel(lane) {
  const match = LANES.find((l) => l.value === lane);
  return match ? match.label : lane || 'Unassigned';
}

function laneBorderClass(lane) {
  switch (lane) {
    case 'watchlist':
      return 'border-l-4 border-rare-gray';
    case 'review_queue':
      return 'border-l-4 border-rare-gold';
    case 'active_pursuit':
      return 'border-l-4 border-rare-lime';
    default:
      return 'border-l-4 border-rare-gray';
  }
}

function getScore(proposal) {
  const meta = proposal?.metadata || {};
  const score = meta.fitScore ?? meta.morpheusScore;
  return typeof score === 'number' ? score : null;
}

function scoreBadgeClass(score) {
  if (score === null) return 'bg-rare-gray/20 text-rare-gray dark:text-rare-cream/60';
  if (score >= 65) return 'bg-rare-lime/90 text-rare-ink';
  if (score >= 45) return 'bg-rare-gold/90 text-rare-ink';
  return 'bg-rare-gray/30 text-rare-ink dark:text-rare-cream/80';
}

function getDeadlineDays(proposal) {
  const meta = proposal?.metadata || {};
  if (typeof meta.deadlineDays === 'number') return meta.deadlineDays;
  if (!proposal?.dueDate) return null;
  const due = new Date(proposal.dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const diffMs = due.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDueDate(dueDate) {
  if (!dueDate) return 'No due date';
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return dueDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function IntakeCard({ proposal, onCapture, onMoveLane, isCapturing, isMenuOpen, onToggleMenu }) {
  const score = getScore(proposal);
  const deadlineDays = getDeadlineDays(proposal);
  const isUrgent = deadlineDays !== null && deadlineDays <= 7;
  const meta = proposal?.metadata || {};
  const fitReasons = Array.isArray(meta.fitReasons) ? meta.fitReasons.slice(0, 2) : [];

  return (
    <div
      className={`bg-white/95 dark:bg-rare-ink rounded-xl shadow-card p-4 flex flex-col gap-3 ${laneBorderClass(
        proposal.intakeLane
      )}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/proposals/${proposal.id}`}
          className="font-rare-serif font-medium text-rare-ink dark:text-rare-cream hover:underline leading-snug"
        >
          {proposal.title || 'Untitled opportunity'}
        </Link>
        <span
          className={`shrink-0 text-xs font-semibold rounded-full px-2 py-1 ${scoreBadgeClass(score)}`}
          title="Fit score"
        >
          {score === null ? '—' : Math.round(score)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-rare-sans text-rare-gray dark:text-rare-cream/70">
        <span className="inline-flex items-center gap-1">
          <Building2 size={13} />
          {proposal.agency || 'Unknown agency'}
        </span>
        {proposal.naics ? (
          <span className="inline-flex items-center gap-1 bg-rare-gray/10 dark:bg-rare-cream/10 rounded-full px-2 py-0.5">
            <Tag size={12} />
            {proposal.naics}
          </span>
        ) : null}
        <span
          className={`inline-flex items-center gap-1 ${
            isUrgent ? 'text-rare-crimson font-medium' : ''
          }`}
        >
          <CalendarDays size={13} />
          {formatDueDate(proposal.dueDate)}
        </span>
      </div>

      {fitReasons.length > 0 ? (
        <ul className="text-xs text-rare-gray dark:text-rare-cream/60 font-rare-sans space-y-0.5">
          {fitReasons.map((reason, idx) => (
            <li key={idx} className="truncate">
              &middot; {reason}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center gap-2 pt-2">
        <button
          type="button"
          className="btn-primary text-sm px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => onCapture(proposal.id)}
          disabled={isCapturing}
        >
          <Send size={14} />
          {isCapturing ? 'Capturing…' : 'Capture'}
        </button>

        <div className="relative">
          <button
            type="button"
            className="text-sm inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-rare-gray/30 text-rare-ink dark:text-rare-cream hover:bg-rare-gray/10 dark:hover:bg-rare-cream/10"
            onClick={() => onToggleMenu(proposal.id)}
          >
            <MoveRight size={14} />
            {laneLabel(proposal.intakeLane)}
            <ChevronDown size={13} />
          </button>
          {isMenuOpen ? (
            <div className="absolute z-10 mt-1 left-0 bg-white dark:bg-rare-ink border border-rare-gray/20 rounded-md shadow-card overflow-hidden min-w-[10rem]">
              {LANES.map((lane) => (
                <button
                  key={lane.value}
                  type="button"
                  disabled={lane.value === proposal.intakeLane}
                  className="w-full text-left text-sm px-3 py-1.5 hover:bg-rare-gray/10 dark:hover:bg-rare-cream/10 disabled:opacity-40 disabled:cursor-not-allowed text-rare-ink dark:text-rare-cream"
                  onClick={() => onMoveLane(proposal.id, lane.value)}
                >
                  {lane.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

IntakeCard.propTypes = {
  proposal: PropTypes.object.isRequired,
  onCapture: PropTypes.func.isRequired,
  onMoveLane: PropTypes.func.isRequired,
  isCapturing: PropTypes.bool.isRequired,
  isMenuOpen: PropTypes.bool.isRequired,
  onToggleMenu: PropTypes.func.isRequired,
};

function IntakePoolGrid({ proposals, onCapture, onMoveLane, naicsOptions }) {
  const [activeNaics, setActiveNaics] = useState(null);
  const [minScore, setMinScore] = useState(0);
  const [laneFilter, setLaneFilter] = useState('all');
  const [capturingId, setCapturingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const filtered = useMemo(() => {
    const list = Array.isArray(proposals) ? proposals : [];
    return list.filter((p) => {
      if (activeNaics && p.naics !== activeNaics) return false;
      if (laneFilter !== 'all' && p.intakeLane !== laneFilter) return false;
      if (minScore > 0) {
        const score = getScore(p);
        if (score === null || score < minScore) return false;
      }
      return true;
    });
  }, [proposals, activeNaics, laneFilter, minScore]);

  const handleCapture = async (id) => {
    setCapturingId(id);
    try {
      await onCapture(id);
    } finally {
      setCapturingId(null);
    }
  };

  const handleMoveLane = async (id, lane) => {
    setOpenMenuId(null);
    await onMoveLane(id, lane);
  };

  const handleToggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const clearFilters = () => {
    setActiveNaics(null);
    setMinScore(0);
    setLaneFilter('all');
  };

  const hasActiveFilters = activeNaics !== null || minScore > 0 || laneFilter !== 'all';

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/95 dark:bg-rare-ink rounded-xl shadow-card p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-rare-sans font-medium text-rare-ink dark:text-rare-cream">
            <Filter size={14} />
            Filters
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-rare-gray dark:text-rare-cream/60 hover:text-rare-crimson"
            >
              <X size={12} />
              Clear
            </button>
          ) : null}
        </div>

        {Array.isArray(naicsOptions) && naicsOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {naicsOptions.map((code) => {
              const isActive = activeNaics === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setActiveNaics(isActive ? null : code)}
                  className={`text-xs font-rare-sans rounded-full px-2.5 py-1 border transition-colors ${
                    isActive
                      ? 'bg-rare-crimson text-white border-rare-crimson'
                      : 'border-rare-gray/30 text-rare-ink dark:text-rare-cream hover:bg-rare-gray/10 dark:hover:bg-rare-cream/10'
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-rare-sans text-rare-gray dark:text-rare-cream/70">
            Min fit score
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="text-xs rounded-md border border-rare-gray/30 bg-transparent px-2 py-1 text-rare-ink dark:text-rare-cream"
            >
              {SCORE_THRESHOLDS.map((t) => (
                <option key={t} value={t}>
                  {t === 0 ? 'Any' : `${t}+`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-rare-sans text-rare-gray dark:text-rare-cream/70">
            Lane
            <select
              value={laneFilter}
              onChange={(e) => setLaneFilter(e.target.value)}
              className="text-xs rounded-md border border-rare-gray/30 bg-transparent px-2 py-1 text-rare-ink dark:text-rare-cream"
            >
              <option value="all">All lanes</option>
              {LANES.map((lane) => (
                <option key={lane.value} value={lane.value}>
                  {lane.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/95 dark:bg-rare-ink rounded-xl shadow-card p-8 text-center text-sm font-rare-sans text-rare-gray dark:text-rare-cream/60">
          No opportunities match — widen filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((proposal) => (
            <IntakeCard
              key={proposal.id}
              proposal={proposal}
              onCapture={handleCapture}
              onMoveLane={handleMoveLane}
              isCapturing={capturingId === proposal.id}
              isMenuOpen={openMenuId === proposal.id}
              onToggleMenu={handleToggleMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

IntakePoolGrid.propTypes = {
  proposals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      agency: PropTypes.string,
      dueDate: PropTypes.string,
      naics: PropTypes.string,
      intakeLane: PropTypes.string,
      metadata: PropTypes.shape({
        fitScore: PropTypes.number,
        morpheusScore: PropTypes.number,
        fitReasons: PropTypes.arrayOf(PropTypes.string),
        serviceLine: PropTypes.string,
        deadlineDays: PropTypes.number,
      }),
    })
  ).isRequired,
  onCapture: PropTypes.func.isRequired,
  onMoveLane: PropTypes.func.isRequired,
  naicsOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default IntakePoolGrid;
