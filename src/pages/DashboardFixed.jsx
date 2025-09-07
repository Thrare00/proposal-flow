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
  FileText
} from 'lucide-react';
import ConnectivityStatus from '../components/ConnectivityStatus';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import ProposalCard from '../components/ProposalCard.jsx';
import { getUrgencyLevel, isOverdue } from '../utils/dateUtils.js';
import { parseISO } from 'date-fns';
import { URGENCY_LEVELS } from '../types/index.js';

const STATUS_OPTIONS = ['intake', 'outline', 'drafting', 'internal_review', 'final_review', 'submitted'];

const Dashboard = () => {
  const { proposals } = useProposalContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Statistics
  const totalProposals = proposals.length;
  const overdueProposals = proposals.filter((p) => 
    isOverdue(p.dueDate) && p.status !== 'submitted'
  ).length;
  const dueSoonProposals = proposals.filter((p) => {
    const urgency = getUrgencyLevel(p.dueDate);
    return (urgency === 'critical' || urgency === 'high') && !isOverdue(p.dueDate) && p.status !== 'submitted';
  }).length;
  const completedProposals = proposals.filter((p) => 
    p.status === 'submitted'
  ).length;
  
  // Filter and search proposals
  const filteredProposals = useMemo(() => {
    const urgencyLevels = Object.keys(URGENCY_LEVELS);
    return proposals
      .filter((proposal) => {
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
        if (urgencyFilter === 'all') return true;
        const urgency = getUrgencyLevel(proposal.dueDate);
        return urgency === urgencyFilter;
      })
      .sort((a, b) => {
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <ConnectivityStatus />
          </div>
          <p className="text-gray-600">Manage and track your government contract proposals</p>
        </div>
        
        <Link 
          to="/dashboard/proposals/new" 
          className="btn btn-primary flex items-center justify-center space-x-2 self-start"
        >
          <Plus size={18} />
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
              <select
                id="proposal-status-filter"
                name="proposal-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            to="/directories"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex items-center space-x-4"
          >
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Directories</h3>
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
              <h3 className="font-medium text-gray-900">CEO Actions</h3>
              <p className="text-sm text-gray-500">Create reminders and follow-ups</p>
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
              <h3 className="font-medium text-gray-900">Reports</h3>
              <p className="text-sm text-gray-500">Generate and view reports</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Proposals Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposals</h2>
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
                <Link to="/dashboard/proposals/new" className="btn btn-primary">
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

export default Dashboard;
