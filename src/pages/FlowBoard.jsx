import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import { format, parseISO } from 'date-fns';
import { getStatusName } from '../utils/statusUtils.js';

// Status values that match the application's workflow
const STATUS_VALUES = ['intake', 'outline', 'drafting', 'internal_review', 'final_review', 'submitted'];

function FlowBoard() {
  const navigate = useNavigate();
  const { proposals = [], fetchProposals } = useProposalContext();
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch proposals on component mount
  useEffect(() => {
    if (fetchProposals) {
      const loadData = async () => {
        try {
          setIsRefreshing(true);
          await fetchProposals();
          setError(null);
        } catch (err) {
          console.error('Error fetching proposals:', err);
          setError('Failed to load proposals. Please try again.');
        } finally {
          setIsRefreshing(false);
        }
      };
      
      loadData();
    }
  }, [fetchProposals]);

  // Get unique agencies for filter dropdown
  const agencies = useMemo(() => {
    const agencySet = new Set(proposals.map(p => p.agency).filter(Boolean));
    return Array.from(agencySet).sort();
  }, [proposals]);

  // Filter proposals based on search and agency filter
  const filteredProposals = useMemo(() => {
    let result = [...proposals];
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        (p.title || '').toLowerCase().includes(searchLower) ||
        (p.agency || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (agencyFilter) {
      result = result.filter(p => p.agency === agencyFilter);
    }
    
    return result;
  }, [proposals, search, agencyFilter]);

  // Group proposals by status
  const proposalsByStatus = useMemo(() => {
    const grouped = {};
    STATUS_VALUES.forEach(status => {
      grouped[status] = filteredProposals.filter(p => p.status === status);
    });
    return grouped;
  }, [filteredProposals]);

  const handleCardClick = useCallback((id) => {
    navigate(`/proposals/${id}`);
  }, [navigate]);

  const handleRefresh = useCallback(async () => {
    if (!fetchProposals) return;
    try {
      setIsRefreshing(true);
      await fetchProposals();
      setError(null);
    } catch (err) {
      console.error('Error refreshing proposals:', err);
      setError('Failed to refresh proposals. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchProposals]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100">
            <h2 className="text-lg font-medium text-red-800">Error Loading Proposals</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Proposal Flow Board</h1>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Search proposals..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Agency</label>
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All Agencies</option>
            {agencies.map(agency => (
              <option key={agency} value={agency}>
                {agency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATUS_VALUES.map(status => (
          <div key={status} className="border rounded p-4">
            <div className="font-bold mb-2">{getStatusName(status)}</div>
            <div className="space-y-2">
              {proposalsByStatus[status]?.map(proposal => (
                <div 
                  key={proposal.id}
                  onClick={() => handleCardClick(proposal.id)}
                  className="p-3 border rounded cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="font-medium">{proposal.title || 'Untitled'}</div>
                  <div className="text-sm text-gray-600">{proposal.agency}</div>
                  {proposal.dueDate && (
                    <div className="text-xs mt-1">
                      Due: {format(parseISO(proposal.dueDate), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FlowBoard;
