import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { getUrgencyLevel, getStatusName } from '../utils/statusUtils.js';
import { buildApiUrl } from '../lib/runtimeApi.js';
import { CheckCircle, ChevronRight, Upload, FileText, AlertTriangle, SearchCheck, Briefcase, Microscope, ShieldCheck, Calculator, FilePenLine, ClipboardCheck, FileSpreadsheet } from 'lucide-react';

const STAGES = [
  {
    id: 'intake',
    name: 'Intake',
    next: 'qualification',
    container: 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-400 dark:border-blue-500',
    header: 'bg-blue-700 dark:bg-blue-800 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'log_pipeline', label: 'Log to Pipeline', icon: CheckCircle, variant: 'primary' },
      { id: 'upload_docs', label: 'Upload Docs', icon: Upload, variant: 'secondary' },
    ],
  },
  {
    id: 'qualification',
    name: 'Qualification',
    next: 'pre_solicitation',
    container: 'bg-cyan-50 dark:bg-cyan-900/10 border-l-4 border-cyan-400 dark:border-cyan-500',
    header: 'bg-cyan-700 dark:bg-cyan-800 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'qualify', label: 'Qualify', icon: SearchCheck, variant: 'primary' },
    ],
  },
  {
    id: 'pre_solicitation',
    name: 'Pre-Solicitation Brief',
    next: 'research',
    container: 'bg-violet-50 dark:bg-violet-900/10 border-l-4 border-violet-400 dark:border-violet-500',
    header: 'bg-violet-700 dark:bg-violet-800 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-violet-600 hover:bg-violet-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'create_overview', label: 'Create Brief', icon: Briefcase, variant: 'primary' },
      { id: 'upload_docs', label: 'Upload Docs', icon: Upload, variant: 'secondary' },
    ],
  },
  {
    id: 'research',
    name: 'Research',
    next: 'technical_compliance',
    container: 'bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-indigo-400 dark:border-indigo-500',
    header: 'bg-indigo-700 dark:bg-indigo-800 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'run_research', label: 'Run Research', icon: Microscope, variant: 'primary' },
    ],
  },
  {
    id: 'technical_compliance',
    name: 'Technical / Compliance',
    next: 'pricing_packaging',
    container: 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 dark:border-amber-500',
    header: 'bg-amber-600 dark:bg-amber-700 text-gray-900 dark:text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-amber-600 hover:bg-amber-700 text-gray-900 dark:text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'build_compliance', label: 'Build Matrix', icon: ShieldCheck, variant: 'primary' },
    ],
  },
  {
    id: 'pricing_packaging',
    name: 'Pricing / Packaging',
    next: 'drafting',
    container: 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-400 dark:border-orange-500',
    header: 'bg-orange-600 dark:bg-orange-700 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-orange-600 hover:bg-orange-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'prepare_pricing', label: 'Prepare Pricing', icon: Calculator, variant: 'primary' },
    ],
  },
  {
    id: 'drafting',
    name: 'Claude Drafting',
    next: 'review',
    container: 'bg-fuchsia-50 dark:bg-fuchsia-900/10 border-l-4 border-fuchsia-400 dark:border-fuchsia-500',
    header: 'bg-fuchsia-700 dark:bg-fuchsia-800 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'start_draft', label: 'Build Draft', icon: FilePenLine, variant: 'primary' },
      { id: 'upload_draft', label: 'Upload Draft', icon: Upload, variant: 'secondary' },
    ],
  },
  {
    id: 'review',
    name: 'ChatGPT Review',
    next: 'google_docs_final',
    container: 'bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-400 dark:border-emerald-500',
    header: 'bg-emerald-700 dark:bg-emerald-800 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'request_review', label: 'Run Review', icon: ClipboardCheck, variant: 'primary' },
    ],
  },
  {
    id: 'google_docs_final',
    name: 'Google Docs Final',
    next: 'submitted',
    container: 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-400 dark:border-green-500',
    header: 'bg-green-700 dark:bg-green-800 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-green-600 hover:bg-green-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-800 dark:text-gray-100',
    actions: [
      { id: 'finalize_docs', label: 'Finalize Docs', icon: FileSpreadsheet, variant: 'primary' },
      { id: 'upload_final', label: 'Upload Final', icon: Upload, variant: 'secondary' },
    ],
  },
  {
    id: 'submitted',
    name: 'Submitted',
    next: null,
    container: 'bg-gray-50 dark:bg-gray-800/30 border-l-4 border-gray-400 dark:border-gray-600',
    header: 'bg-gray-600 dark:bg-gray-700 text-white',
    content: 'bg-white/80 dark:bg-gray-800/80',
    primaryAction: 'bg-gray-600 hover:bg-gray-700 text-white',
    secondaryAction: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600',
    text: 'text-gray-700 dark:text-gray-200',
    actions: [],
  },
];

const LEGACY_STAGE_MAP = {
  outline: 'pre_solicitation',
  internal_review: 'review',
  final_review: 'google_docs_final',
};

function normalizeStage(stage) {
  return LEGACY_STAGE_MAP[stage] || stage || 'intake';
}

function FlowBoard() {
  const navigate = useNavigate();
  const { proposals = [], fetchProposals } = useProposalContext();
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState({});

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

  const agencies = useMemo(() => {
    const agencySet = new Set(proposals.map((p) => p.agency).filter(Boolean));
    return Array.from(agencySet).sort();
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    let result = [...proposals];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((p) =>
        (p.title || '').toLowerCase().includes(searchLower) ||
        (p.agency || '').toLowerCase().includes(searchLower)
      );
    }

    if (agencyFilter) {
      result = result.filter((p) => p.agency === agencyFilter);
    }

    return result;
  }, [proposals, search, agencyFilter]);

  const isDueSoon = useCallback((dueDate) => {
    if (!dueDate) return false;
    const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    const today = new Date();
    const weekFromNow = addDays(today, 7);
    return isAfter(date, today) && isBefore(date, weekFromNow);
  }, []);

  const isOverdue = useCallback((dueDate) => {
    if (!dueDate) return false;
    const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    return isBefore(date, new Date());
  }, []);

  const proposalsByStatus = useMemo(() => {
    const grouped = {};
    STAGES.forEach((stage) => {
      grouped[stage.id] = filteredProposals
        .filter((p) => normalizeStage(p.status) === stage.id)
        .map((proposal) => ({
          ...proposal,
          normalizedStatus: normalizeStage(proposal.status),
          isDueSoon: isDueSoon(proposal.dueDate),
          isOverdue: isOverdue(proposal.dueDate),
          urgency: getUrgencyLevel(proposal.dueDate),
        }));
    });
    return grouped;
  }, [filteredProposals, isDueSoon, isOverdue]);

  const handleAction = useCallback(async (action, proposalId, currentStage) => {
    const actionId = `${action}-${proposalId}`;
    try {
      setIsProcessing((prev) => ({ ...prev, [actionId]: true }));
      setError(null);

      const currentStageObj = STAGES.find((s) => s.id === currentStage);

      switch (action) {
        case 'start_draft':
          await fetch(buildApiUrl(`/automation?fn=enqueue`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ action: 'build_proposal_draft', payload: { proposalId } }]),
          });
          break;

        case 'create_overview':
          await fetch(buildApiUrl(`/automation?fn=enqueue`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ action: 'proposal_overview', payload: { proposalId } }]),
          });
          break;

        case 'log_pipeline':
          await fetch(buildApiUrl(`/proposals/${proposalId}/log`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'log_pipeline' }),
          });
          break;

        case 'upload_docs':
        case 'upload_draft':
        case 'upload_final': {
          const fileName = window.prompt('Record document name', `${action.replace('upload_', '').replace('_', ' ')} document`);
          if (!fileName) break;
          await fetch(buildApiUrl(`/proposals/${proposalId}/upload`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, fileName }),
          });
          break;
        }

        case 'qualify':
        case 'run_research':
        case 'build_compliance':
        case 'prepare_pricing':
        case 'request_review':
        case 'finalize_docs':
        case 'next_stage':
        default:
          if (currentStageObj?.next) {
            await fetch(buildApiUrl(`/proposals/${proposalId}`), {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: currentStageObj.next }),
            });
          }
          break;
      }

      await fetchProposals();
    } catch (err) {
      console.error(`Error in ${action}:`, err);
      setError(`Failed to ${action.replace('_', ' ')}. Please try again.`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, [actionId]: false }));
    }
  }, [fetchProposals]);

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
            <button onClick={handleRefresh} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={isRefreshing}>
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
        <div>
          <h1 className="text-2xl font-bold">Proposal Flow Board</h1>
          <p className="text-sm text-gray-500 mt-1">Pre-solicitation operations staged from intake through Google Docs finalization.</p>
        </div>
        <button onClick={handleRefresh} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-2 border rounded" placeholder="Search proposals..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Agency</label>
          <select value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)} className="w-full p-2 border rounded">
            <option value="">All Agencies</option>
            {agencies.map((agency) => (
              <option key={agency} value={agency}>{agency}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-10 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const proposals = proposalsByStatus[stage.id] || [];
          return (
            <div key={stage.id} className={`rounded-lg overflow-hidden min-w-[300px] ${stage.container} shadow-md hover:shadow-lg transition-all duration-200`}>
              <div className={`flex justify-between items-center px-4 py-3 ${stage.header} ${stage.text}`}>
                <h3 className="font-semibold text-sm uppercase tracking-wider">{stage.name}</h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/10 dark:bg-white/20">{proposals.length}</span>
              </div>

              <div className="space-y-3">
                {proposals.map((proposal) => {
                  const dueDate = proposal.dueDate ? new Date(proposal.dueDate) : null;
                  return (
                    <div key={proposal.id} className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${stage.content} ${proposal.urgency === 'high' ? 'ring-1 ring-amber-500/30' : ''}`}>
                      <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => handleCardClick(proposal.id)}>
                        <div className="flex justify-between items-start">
                          <h4 className={`font-medium line-clamp-2 text-sm leading-snug ${stage.text}`}>{proposal.title || 'Untitled'}</h4>
                          {proposal.urgency === 'high' && (
                            <span className="ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">Urgent</span>
                          )}
                        </div>

                        {proposal.agency && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">{proposal.agency}</p>}
                        <p className="text-[11px] text-gray-500 mt-1">{getStatusName(proposal.status)}</p>

                        {dueDate && (
                          <div className={`mt-2 flex items-center text-xs font-medium ${proposal.isOverdue ? 'text-red-600 dark:text-red-400' : proposal.isDueSoon ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${proposal.isOverdue ? 'bg-red-500' : proposal.isDueSoon ? 'bg-amber-400' : 'bg-gray-400'}`} />
                            {proposal.isOverdue ? 'Overdue: ' : 'Due: '}
                            {format(dueDate, 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700/50 p-2 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-center space-x-2">
                          <div className="flex-1 flex space-x-1 overflow-x-auto pb-1">
                            {stage.actions.map((action) => (
                              <button
                                key={action.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(action.id, proposal.id, stage.id);
                                }}
                                disabled={isProcessing[`${action.id}-${proposal.id}`]}
                                className={`flex items-center px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${action.variant === 'primary' ? stage.primaryAction : stage.secondaryAction} ${isProcessing[`${action.id}-${proposal.id}`] ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                <action.icon className="w-3 h-3 mr-1" />
                                {action.label}
                              </button>
                            ))}
                          </div>

                          {stage.next && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('next_stage', proposal.id, stage.id);
                              }}
                              disabled={isProcessing[`next-${proposal.id}`]}
                              className={`p-1.5 rounded-full border transition-colors ${isProcessing[`next-${proposal.id}`] ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                              title={`Move to ${getStatusName(stage.next)}`}
                            >
                              {isProcessing[`next-${proposal.id}`] ? (
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {proposals.length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center justify-center p-2">
                      <FileText className="w-5 h-5 text-gray-300 dark:text-gray-600 mb-1" />
                      <p className="text-xs">No {stage.name.toLowerCase()} items</p>
                      <p className="text-2xs text-gray-400 dark:text-gray-500 mt-1">Advance opportunities into this stage as work completes.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FlowBoard;
