import { useLoaderData, useNavigation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ProposalStatusBadge } from '../../components/ProposalStatusBadge.jsx';
import { UrgencyBadge } from '../../components/UrgencyBadge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDate } from '../../utils/dateUtils.js';

/**
 * Displays a list of proposals with filtering and sorting capabilities
 * @param {Array} [initialProposals=[]] - Initial list of proposals from the loader
 * @returns {JSX.Element} The rendered component
 */
export function ProposalList() {
  const navigation = useNavigation();
  const initialProposals = useLoaderData() || [];
  const [proposals, setProposals] = useState(initialProposals);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });

  // Handle loading state from navigation
  useEffect(() => {
    if (navigation.state === 'loading') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [navigation.state]);

  // Filter and sort proposals when filters change
  useEffect(() => {
    try {
      let filtered = [...initialProposals];
      
      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(proposal => 
          proposal.title.toLowerCase().includes(searchTerm) ||
          (proposal.agency && proposal.agency.toLowerCase().includes(searchTerm)) ||
          (proposal.id && proposal.id.toString().includes(searchTerm))
        );
      }
      
      // Apply status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(proposal => proposal.status === filters.status);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        
        if (filters.sortBy === 'dueDate') {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          comparison = dateA - dateB;
        } else {
          const valueA = a[filters.sortBy]?.toString().toLowerCase() || '';
          const valueB = b[filters.sortBy]?.toString().toLowerCase() || '';
          comparison = valueA.localeCompare(valueB);
        }
        
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
      
      setProposals(filtered);
      setError(null);
    } catch (err) {
      console.error('Error filtering proposals:', err);
      setError('Failed to filter proposals. Please try again.');
      setProposals(initialProposals);
    }
  }, [initialProposals, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle sort order
  const toggleSortOrder = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get unique status values for filter dropdown
  const statusOptions = [...new Set(initialProposals.map(p => p.status))];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
        <span className="sr-only">Loading proposals...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
        <Button 
          to="/dashboard/proposals/new" 
          className="w-full md:w-auto"
          aria-label="Create new proposal"
        >
          New Proposal
        </Button>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">Search proposals</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by title, agency, or ID"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="status" className="sr-only">Filter by status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              type="button"
              onClick={() => toggleSortOrder('dueDate')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-center"
            >
              {filters.sortBy === 'dueDate' && filters.sortOrder === 'asc' ? (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Sort by Due Date
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Sort by Due Date
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium">{proposals.length}</span> of <span className="font-medium">{initialProposals.length}</span> proposals
      </div>

      {/* Proposals grid */}
      {proposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="h-full flex flex-col">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 line-clamp-2" title={proposal.title}>
                  {proposal.title}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <ProposalStatusBadge status={proposal.status} />
                  {proposal.metadata?.urgency && (
                    <UrgencyBadge urgency={proposal.metadata.urgency} />
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 mb-4">
                  {proposal.agency && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Agency:</span> {proposal.agency}
                    </p>
                  )}
                  {proposal.dueDate && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Due:</span> {formatDate(proposal.dueDate, 'N/A')}
                    </p>
                  )}
                  {proposal.type && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {proposal.type}
                    </p>
                  )}
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <Button 
                    as={Link}
                    to={`/dashboard/proposals/${proposal.id}`} 
                    variant="outline"
                    className="w-full justify-center"
                    aria-label={`View details for ${proposal.title}`}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.status !== 'all' || filters.search
              ? 'Try adjusting your search or filter to find what you\'re looking for.'
              : 'Get started by creating a new proposal.'}
          </p>
          <div className="mt-6">
            <Button to="/dashboard/proposals/new" variant="primary">
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Proposal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Add PropTypes for better development experience
ProposalList.propTypes = {
  initialProposals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      agency: PropTypes.string,
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      type: PropTypes.string,
      metadata: PropTypes.shape({
        urgency: PropTypes.string
      })
    })
  )
};

ProposalList.defaultProps = {
  initialProposals: []
};
