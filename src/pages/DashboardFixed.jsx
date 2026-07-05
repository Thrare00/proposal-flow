import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  FilterX,
  FolderOpen,
  UserCog,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import ConnectivityStatus from '../components/ConnectivityStatus';
import CeoActionForm from '../components/CeoActionForm.jsx';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import ProposalCard from '../components/ProposalCard.jsx';
import { STATUS_OPTIONS as ALL_STATUSES } from '../utils/statusUtils.js';
import { getUrgencyLevel, isOverdue } from '../utils/dateUtils.js';
import { checkAmendments } from '../lib/api.js';

// Command Deck components (dark cinematic momentum zone)
import NextActionCard from '../components/dashboard/NextActionCard.jsx';
import StreakMeter from '../components/dashboard/StreakMeter.jsx';
import PipelineFlow from '../components/dashboard/PipelineFlow.jsx';
import DeadlineRadar from '../components/dashboard/DeadlineRadar.jsx';
import StatTile from '../components/dashboard/StatTile.jsx';
import QuickAccessTile from '../components/dashboard/QuickAccessTile.jsx';
import EmptyStateHero from '../components/dashboard/EmptyStateHero.jsx';

const Dashboard = () => {
  const { proposals, isLoading, error, fetchProposals } = useProposalContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [ceoOpen, setCeoOpen] = useState(false);
  const [isCheckingAmendments, setIsCheckingAmendments] = useState(false);
  const [amendmentCheckResult, setAmendmentCheckResult] = useState(null);

  const handleCheckAmendments = useCallback(async () => {
    setIsCheckingAmendments(true);
    setAmendmentCheckResult(null);
    try {
      const result = await checkAmendments();
      setAmendmentCheckResult(result);
      await fetchProposals();
    } catch (checkError) {
      setAmendmentCheckResult({ ok: false, error: checkError.message });
    } finally {
      setIsCheckingAmendments(false);
    }
  }, [fetchProposals]);

  const proposalList = Array.isArray(proposals) ? proposals : [];

  // Next due proposal (earliest dueDate, active only)
  const nextDueProposal = useMemo(() => {
    const active = proposalList.filter((p) => p.status !== 'closed' && p.status !== 'submitted');
    if (!active.length) return null;
    return [...active].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  }, [proposalList]);

  // Statistics (exclude closed proposals from active counts)
  const activeProposals = proposalList.filter((p) => p.status !== 'closed');
  const activePipelineCount = activeProposals.filter((p) => p.status !== 'submitted').length;
  const overdueProposals = activeProposals.filter((p) =>
    isOverdue(p.dueDate) && p.status !== 'submitted'
  ).length;
  const dueSoonProposals = activeProposals.filter((p) => {
    const urgency = getUrgencyLevel(p.dueDate);
    return (urgency === 'critical' || urgency === 'high') && !isOverdue(p.dueDate) && p.status !== 'submitted';
  }).length;
  const completedProposals = proposalList.filter((p) => p.status === 'submitted').length;

  // Filter and search proposals with optimizations
  const filteredProposals = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    const hasSearchTerm = searchTerm.trim() !== '';
    const hasStatusFilter = statusFilter !== 'all';
    const hasUrgencyFilter = urgencyFilter !== 'all';

    return proposalList
      .filter((proposal) => {
        if (hasSearchTerm) {
          const titleMatch = proposal.title?.toLowerCase().includes(searchTermLower);
          const agencyMatch = proposal.agency?.toLowerCase().includes(searchTermLower);
          if (!titleMatch && !agencyMatch) return false;
        }

        if (hasStatusFilter) {
          if (proposal.status !== statusFilter) return false;
        } else if (proposal.status === 'closed') {
          return false;
        }

        if (hasUrgencyFilter) {
          const urgency = getUrgencyLevel(proposal.dueDate);
          if (urgency !== urgencyFilter) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [proposalList, searchTerm, statusFilter, urgencyFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUrgencyFilter('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rare-crimson"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rare-crimson/10 border-l-4 border-rare-crimson p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-rare-crimson" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-rare-crimson">
              Failed to load proposals. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasProposals = proposalList.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-rare-dark/80 via-rare-dark/50 to-transparent px-4 py-4 md:px-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <h1 className="font-rare-serif text-3xl md:text-4xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
              Command Deck
            </h1>
            <ConnectivityStatus />
          </div>
          <p className="font-rare-sans text-xs uppercase tracking-[0.2em] text-rare-cream/80 mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            Momentum, deadlines, and the next bid to win
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-2 self-start md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCheckAmendments}
              disabled={isCheckingAmendments}
              className="btn btn-secondary flex items-center justify-center space-x-2 disabled:opacity-60"
              title="Re-check SAM.gov for amendments on active, tracked solicitations"
            >
              <RefreshCw size={16} className={isCheckingAmendments ? 'animate-spin' : ''} />
              <span>{isCheckingAmendments ? 'Checking...' : 'Re-check amendments'}</span>
            </button>
            <Link
              to="/proposals/new"
              className="btn btn-primary flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>New Proposal</span>
            </Link>
          </div>
          {amendmentCheckResult && (
            <p className="font-rare-sans text-xs text-rare-cream/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
              {amendmentCheckResult.ok === false
                ? `Check failed: ${amendmentCheckResult.error}`
                : amendmentCheckResult.skipped === 'no_api_key'
                  ? 'SAM_API_KEY not configured — amendment checks disabled'
                  : `Checked ${amendmentCheckResult.checked} solicitation(s), ${amendmentCheckResult.alerted} amendment(s) found`}
            </p>
          )}
        </div>
      </div>

      {!hasProposals ? (
        <EmptyStateHero />
      ) : (
        <>
          {/* ===== Command Deck — dark cinematic momentum zone ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <NextActionCard proposal={nextDueProposal} />
            </div>
            <StreakMeter proposals={proposalList} />
          </div>

          <div className="mb-4">
            <PipelineFlow
              proposals={proposalList}
              onStageClick={(statuses) => {
                if (Array.isArray(statuses) && statuses.length > 0) {
                  setStatusFilter(statuses[0]);
                }
              }}
            />
          </div>

          <div className="mb-8">
            <DeadlineRadar proposals={proposalList} />
          </div>

          {/* ===== Work Surface ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile icon={TrendingUp} label="Active Pipeline" value={activePipelineCount} tone="lime" />
            <StatTile icon={AlertTriangle} label="Overdue" value={overdueProposals} tone="crimson" />
            <StatTile icon={Clock} label="Due Soon" value={dueSoonProposals} tone="gold" />
            <StatTile icon={CheckCircle} label="Submitted" value={completedProposals} tone="lime" sublabel="all time" />
          </div>

          {/* CEO Actions — Inline Collapsible */}
          <div className="mb-6 rounded-xl border border-rare-crimson/20 bg-white/95 shadow-card backdrop-blur dark:border-rare-lime/20 dark:bg-rare-ink">
            <button
              onClick={() => setCeoOpen(!ceoOpen)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rare-crimson/10 rounded-full text-rare-crimson dark:bg-rare-lime/15 dark:text-rare-lime">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-rare-serif font-bold text-slate-900 dark:text-slate-100">Quick CEO Action</h3>
                  <p className="font-rare-sans text-xs uppercase tracking-wide text-rare-gray dark:text-white/50">Create a reminder or follow-up</p>
                </div>
              </div>
              {ceoOpen ? <ChevronUp size={20} className="text-slate-400 dark:text-slate-500" /> : <ChevronDown size={20} className="text-slate-400 dark:text-slate-500" />}
            </button>
            {ceoOpen && (
              <div className="border-t border-slate-100 px-6 pb-5 pt-4 dark:border-slate-800">
                <CeoActionForm compact onSuccess={() => setCeoOpen(false)} />
              </div>
            )}
          </div>

          {/* Search and filters */}
          <div className="mb-6 rounded-xl bg-white/95 p-4 shadow-card backdrop-blur dark:bg-rare-ink">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <label htmlFor="proposal-search" className="sr-only">Search proposals</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <input
                  id="proposal-search"
                  name="proposal-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Search proposals by title or agency..."
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <label htmlFor="proposal-status-filter" className="sr-only">Filter by status</label>
                  <select
                    id="proposal-status-filter"
                    name="proposal-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Statuses</option>
                    {ALL_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="proposal-urgency-filter" className="sr-only">Filter by urgency</label>
                  <select
                    id="proposal-urgency-filter"
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="form-select"
                    aria-label="Filter by urgency"
                  >
                    <option value="all">All Urgency Levels</option>
                    <option value="critical">Critical (Due in 2 days)</option>
                    <option value="high">High (Due in 1 week)</option>
                    <option value="medium">Medium (Due later)</option>
                    <option value="low">Low (Due later)</option>
                  </select>
                </div>

                <button
                  onClick={clearFilters}
                  className="btn btn-secondary flex items-center space-x-2"
                  aria-label="Clear all filters"
                  disabled={statusFilter === 'all' && urgencyFilter === 'all' && !searchTerm}
                >
                  <FilterX size={16} />
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Proposals Section */}
          <div className="mb-10">
            <h2 className="font-rare-serif text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Proposals</h2>
            {filteredProposals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-white/95 p-8 text-center shadow-card dark:bg-rare-ink">
                <div className="mb-4 text-slate-500 dark:text-slate-400">
                  <FilterX size={64} className="mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                  <h3 className="mb-2 font-rare-serif text-xl font-bold text-slate-700 dark:text-slate-200">No proposals found</h3>
                  <p className="mb-6">
                    {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all'
                      ? "Try adjusting your search filters to find what you're looking for."
                      : "You haven't created any proposals yet. Get started by creating your first proposal."}
                  </p>
                  {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all' ? (
                    <button onClick={clearFilters} className="btn btn-primary">
                      Clear Filters
                    </button>
                  ) : (
                    <Link to="/proposals/new" className="btn btn-primary">
                      Create Your First Proposal
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== Quick Access rail — demoted nav ===== */}
          <div className="mb-8">
            <h2 className="font-rare-sans text-xs uppercase tracking-[0.2em] text-rare-gray dark:text-white/50 mb-3">Quick Access</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <QuickAccessTile to="/flowboard" icon={FolderOpen} title="Flow Board" description="Capture opportunities and push them into proposals" />
              <QuickAccessTile to="/directories" icon={FolderOpen} title="Directories" description="Manage portal directories and statuses" />
              <QuickAccessTile to="/ceo-actions" icon={UserCog} title="CEO Actions" description="Full checklist, calendar, and reports" />
              <QuickAccessTile to="/reports" icon={FileText} title="Reports" description="Generate and view reports" />
              <QuickAccessTile to="/settings?tab=cadence" icon={Clock} title="Cadence" description="Adjust follow-up and reminder cadence" />
              <QuickAccessTile to="/settings?tab=health" icon={CheckCircle} title="System Health" description="Check API connectivity and status" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

Dashboard.propTypes = {};

const MemoizedDashboard = React.memo(Dashboard);

export default MemoizedDashboard;
