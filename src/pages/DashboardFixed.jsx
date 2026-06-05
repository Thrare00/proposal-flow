import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  Calendar,
  Building
} from 'lucide-react';
import ConnectivityStatus from '../components/ConnectivityStatus';
import CeoActionForm from '../components/CeoActionForm.jsx';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import ProposalCard from '../components/ProposalCard.jsx';
import { STATUS_OPTIONS as ALL_STATUSES, getStatusName } from '../utils/statusUtils.js';
import { getUrgencyLevel, isOverdue, formatDate } from '../utils/dateUtils.js';
import { STAGE_LABELS } from '../../shared/proposalWorkflow.js';

const URGENCY_BORDER = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-green-500',
  overdue: 'border-l-red-600',
};

const URGENCY_BG = {
  critical: 'bg-red-50 text-red-800',
  high: 'bg-amber-50 text-amber-800',
  medium: 'bg-blue-50 text-blue-800',
  low: 'bg-green-50 text-green-800',
  overdue: 'bg-red-100 text-red-900',
};

function NextDueCard({ proposal }) {
  if (!proposal) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 text-center text-gray-500">
        <Clock size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-lg font-medium">No upcoming proposals</p>
        <p className="text-sm">Create a new proposal to get started.</p>
      </div>
    );
  }

  const { id, title, agency, dueDate, status, workflow = {}, scoring = {}, complianceStatus = {} } = proposal;
  const urgency = isOverdue(dueDate) ? 'overdue' : getUrgencyLevel(dueDate);
  const stageLabel = STAGE_LABELS[workflow.currentStage] || workflow.currentStage || 'Ingestion';

  // Calculate countdown
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let countdown;
  if (diffDays < 0) countdown = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  else if (diffDays === 0) countdown = 'Due today';
  else if (diffDays === 1) countdown = 'Due tomorrow';
  else countdown = `Due in ${diffDays} days`;

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${URGENCY_BORDER[urgency] || 'border-l-gray-300'} p-6 mb-6`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next Due Proposal</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${URGENCY_BG[urgency] || 'bg-gray-100 text-gray-700'}`}>
          {urgency === 'overdue' ? 'OVERDUE' : urgency.toUpperCase()}
        </span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</h2>
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1"><Building size={14} /> {agency}</span>
        <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(dueDate)}</span>
        <span className={`font-semibold ${diffDays <= 2 ? 'text-red-600' : diffDays <= 7 ? 'text-amber-600' : 'text-gray-700'}`}>
          {countdown}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-xs font-semibold text-gray-500">Stage</div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{stageLabel}</div>
        </div>
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-xs font-semibold text-gray-500">Compliance</div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{Math.round(complianceStatus.completenessPercent || scoring.compliance_score || 0)}%</div>
        </div>
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-xs font-semibold text-gray-500">Draft Ready</div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{Math.round(scoring.draft_readiness_percent || 0)}%</div>
        </div>
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-xs font-semibold text-gray-500">Submission</div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{Math.round(scoring.submission_readiness_percent || 0)}%</div>
        </div>
      </div>

      <Link
        to={`/proposals/${id}`}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
      >
        View Details <ArrowRight size={16} className="ml-1" />
      </Link>
    </div>
  );
}

const Dashboard = () => {
  const { proposals, isLoading, error } = useProposalContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [ceoOpen, setCeoOpen] = useState(false);

  // Next due proposal (earliest dueDate, active only)
  const nextDueProposal = useMemo(() => {
    if (!proposals || !Array.isArray(proposals)) return null;
    const active = proposals.filter(p => p.status !== 'closed' && p.status !== 'submitted');
    if (!active.length) return null;
    return active.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  }, [proposals]);

  // Statistics (exclude closed proposals from active counts)
  const activeProposals = proposals?.filter((p) => p.status !== 'closed') || [];
  const totalProposals = activeProposals.length;
  const overdueProposals = activeProposals.filter((p) =>
    isOverdue(p.dueDate) && p.status !== 'submitted'
  ).length;
  const dueSoonProposals = activeProposals.filter((p) => {
    const urgency = getUrgencyLevel(p.dueDate);
    return (urgency === 'critical' || urgency === 'high') && !isOverdue(p.dueDate) && p.status !== 'submitted';
  }).length;
  const completedProposals = proposals.filter((p) =>
    p.status === 'submitted'
  ).length;

  // Filter and search proposals with optimizations
  const filteredProposals = useMemo(() => {
    if (!proposals || !Array.isArray(proposals)) return [];

    const searchTermLower = searchTerm.toLowerCase();
    const hasSearchTerm = searchTerm.trim() !== '';
    const hasStatusFilter = statusFilter !== 'all';
    const hasUrgencyFilter = urgencyFilter !== 'all';

    return proposals
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
      .sort((a, b) => {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [proposals, searchTerm, statusFilter, urgencyFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUrgencyFilter('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Failed to load proposals. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <ConnectivityStatus />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage and track your government contract proposals</p>
        </div>

        <Link
          to="/proposals/new"
          className="btn btn-primary flex items-center justify-center space-x-2 self-start"
        >
          <Plus size={18} />
          <span>New Proposal</span>
        </Link>
      </div>

      {/* Next Due Proposal Hero Card */}
      <NextDueCard proposal={nextDueProposal} />

      {/* Statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-primary-50 border border-primary-100">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-primary-800 font-medium">Total Proposals</p>
              <p className="text-2xl font-bold text-primary-900">{totalProposals}</p>
            </div>
          </div>
        </div>

        <div className="card bg-error-50 border border-error-100">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center text-error-800 mr-4">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-error-800 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-error-900">{overdueProposals}</p>
            </div>
          </div>
        </div>

        <div className="card bg-warning-50 border border-warning-100">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center text-warning-800 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-warning-800 font-medium">Due Soon</p>
              <p className="text-2xl font-bold text-warning-900">{dueSoonProposals}</p>
            </div>
          </div>
        </div>

        <div className="card bg-success-50 border border-success-100">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center text-success-800 mr-4">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-success-800 font-medium">Completed</p>
              <p className="text-2xl font-bold text-success-900">{completedProposals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CEO Actions — Inline Collapsible */}
      <div className="bg-white rounded-lg shadow-card border border-purple-100 mb-6">
        <button
          onClick={() => setCeoOpen(!ceoOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full text-purple-600">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Quick CEO Action</h3>
              <p className="text-xs text-gray-500">Create a reminder or follow-up</p>
            </div>
          </div>
          {ceoOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>
        {ceoOpen && (
          <div className="px-6 pb-5 border-t border-gray-100 pt-4">
            <CeoActionForm compact onSuccess={() => setCeoOpen(false)} />
          </div>
        )}
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <label htmlFor="proposal-search" className="sr-only">Search proposals</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" aria-hidden="true" />
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

      {/* Quick Access Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/flowboard"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex items-center space-x-4"
          >
            <div className="p-3 bg-cyan-100 rounded-full text-cyan-600">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Flow Board</h3>
              <p className="text-sm text-gray-500">Capture opportunities and push them into proposals</p>
            </div>
          </Link>

          <Link
            to="/directories"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex items-center space-x-4"
          >
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Directories</h3>
              <p className="text-sm text-gray-500">Manage portal directories and statuses</p>
            </div>
          </Link>

          <Link
            to="/ceo-actions"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex items-center space-x-4"
          >
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">CEO Actions</h3>
              <p className="text-sm text-gray-500">Full checklist, calendar, and reports</p>
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex items-center space-x-4"
          >
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Reports</h3>
              <p className="text-sm text-gray-500">Generate and view reports</p>
            </div>
          </Link>

          <Link
            to="/settings?tab=cadence"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex items-center space-x-4"
          >
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Cadence</h3>
              <p className="text-sm text-gray-500">Adjust follow-up and reminder cadence</p>
            </div>
          </Link>

          <Link
            to="/settings?tab=health"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex items-center space-x-4"
          >
            <div className="p-3 bg-teal-100 rounded-full text-teal-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">System Health</h3>
              <p className="text-sm text-gray-500">Check API connectivity and status</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Proposals Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Proposals</h2>
        {filteredProposals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-card p-8 text-center">
            <div className="text-gray-500 mb-4">
              <FilterX size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No proposals found</h3>
              <p className="mb-6">
                {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all'
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "You haven't created any proposals yet. Get started by creating your first proposal."}
              </p>
              {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all' ? (
                <button
                  onClick={clearFilters}
                  className="btn btn-primary"
                >
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
    </div>
  );
};

Dashboard.propTypes = {};

const MemoizedDashboard = React.memo(Dashboard);

export default MemoizedDashboard;
