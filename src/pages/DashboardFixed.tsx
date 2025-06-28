import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  FilterX
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.js';
import ProposalCard from '../components/ProposalCard.js';
import { getUrgencyLevel, isOverdue } from '../utils/dateUtils.js';
import { URGENCY_LEVELS, UrgencyLevel, Proposal } from '../types/index.js';

const STATUS_OPTIONS = ['intake', 'outline', 'drafting', 'internal_review', 'final_review', 'submitted'] as const as ProposalStatus[];

const Dashboard = () => {
  const { proposals } = useProposalContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'all'>('all');

  // Statistics
  const totalProposals = proposals.length;
  const overdueProposals = proposals.filter((p: Proposal) => 
    isOverdue(p.dueDate) && p.status !== 'submitted'
  ).length;
  const dueSoonProposals = proposals.filter((p: Proposal) => {
    const urgency = getUrgencyLevel(p.dueDate);
    return (urgency === 'high' || urgency === 'critical') && !isOverdue(p.dueDate) && p.status !== 'submitted';
  }).length;
  const completedProposals = proposals.filter((p: Proposal) => 
    p.status === 'submitted'
  ).length;
  
  // Filter and search proposals
  const filteredProposals = useMemo(() => {
    return proposals
      .filter((proposal: Proposal) => {
        // Search term
        if (searchTerm && !proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !proposal.agency.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && proposal.status !== statusFilter) {
          return false;
        }
        
        // Urgency filter
        if (urgencyFilter !== 'all') {
          const urgency = getUrgencyLevel(proposal.dueDate);
          
          if (urgencyFilter === URGENCY_LEVELS.Critical && urgency !== URGENCY_LEVELS.Critical) {
            return false;
          } else if (urgencyFilter === URGENCY_LEVELS.High && urgency !== URGENCY_LEVELS.High) {
            return false;
          } else if (urgencyFilter === URGENCY_LEVELS.Medium && urgency !== URGENCY_LEVELS.Medium) {
            return false;
          } else if (urgencyFilter === URGENCY_LEVELS.Low && urgency !== URGENCY_LEVELS.Low) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a: Proposal, b: Proposal) => {
        // Sort by due date (ascending)
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [proposals, searchTerm, statusFilter, urgencyFilter]);
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUrgencyFilter('all');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Proposal Dashboard</h1>
          <p className="text-gray-600">Manage and track your government contract proposals</p>
        </div>
        
        <Link 
          to="/dashboard/proposals/new" 
          className="btn btn-primary flex items-center justify-center space-x-2 self-start"
        >
          <PlusCircle size={18} />
          <span>New Proposal</span>
        </Link>
      </div>
      
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
      
      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
              placeholder="Search proposals by title or agency..."
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProposalStatus | 'all')}
                className="form-select"
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as UrgencyLevel | 'all')}
                className="form-select"
                aria-label="Filter by urgency"
              >
                <option value="all">All Urgency Levels</option>
                <option value={URGENCY_LEVELS.Critical}>Critical (Due in 2 days)</option>
                <option value={URGENCY_LEVELS.High}>High (Due in 1 week)</option>
                <option value={URGENCY_LEVELS.Medium}>Medium (Due later)</option>
                <option value={URGENCY_LEVELS.Low}>Low (Due later)</option>
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

      {/* Proposals grid */}
      {filteredProposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProposals.map(proposal => (
            <ProposalCard
              proposal={proposal}
            />
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
              <Link to="/dashboard/proposals/new" className="btn btn-primary">
                Create Your First Proposal
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
