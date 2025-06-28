import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  FilterX,
  X,
  Filter,
  Building,
  Calendar,
  CheckSquare,
  User,
  InfoIcon
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.js';
import TaskCard from '../components/TaskCard.js';
import { formatDate, formatDateWithDay, isOverdue } from '../utils/dateUtils.js';
import { parseISO, isBefore, addDays, endOfDay } from 'date-fns';
import { ProposalStatus, Proposal } from '../types/index.ts';
import { getStatusName, getStatusColor, getStatusBorderColor } from '../utils/statusUtils.js';
import FlowGuides from '../components/FlowGuides.js';

const FlowBoard = () => {
  const { proposals, updateProposalStatus } = useProposalContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<string>('');
  const [draggedProposal, setDraggedProposal] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>('');

  // Update filteredProposals and calculate agencies when proposals from context change
  useEffect(() => {
    // Calculate agencies first
    const uniqueAgencies = [...new Set(proposals.map(p => p.agency))];
    setAgencies(uniqueAgencies);
  }, [proposals]);
  
  // Get all tasks from all proposals
  const allTasks = useMemo(() => {
    return proposals.flatMap(proposal => 
      proposal.tasks.map((task: { id: string; title: string; description?: string; dueDate: string; completed: boolean; proposalId: string; owner?: string }) => ({
        ...task,
        proposalTitle: proposal.title
      }))
    );
  }, [proposals]);
  
  // Overdue tasks
  const overdueTasks = useMemo(() => {
    return allTasks.filter((task: { id: string; title: string; description?: string; dueDate: string; completed: boolean; proposalId: string; owner?: string; proposalTitle: string }) => 
      !task.completed && isOverdue(task.dueDate)
    ).sort((a: { dueDate: string }, b: { dueDate: string }) => 
      parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
    );
  }, [allTasks]);
  
  // Tasks due this week
  const tasksThisWeek = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return allTasks.filter((task: { id: string; title: string; description?: string; dueDate: string; completed: boolean; proposalId: string; owner?: string; proposalTitle: string }) => {
      const taskDate = parseISO(task.dueDate);
      return (
        !task.completed &&
        !isOverdue(task.dueDate) &&
        isBefore(taskDate, endOfDay(nextWeek))
      );
    }).sort((a: { dueDate: string }, b: { dueDate: string }) => 
      parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
    );
  }, [allTasks]);
  
  // Filter proposals based on search and agency
  const filteredProposals = useMemo(() => {
    if (!proposals) return [];
    
    let filtered = [...proposals];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.agency.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedAgency) {
      filtered = filtered.filter(p => p.agency === selectedAgency);
    }
    
    return filtered;
  }, [proposals, searchTerm, selectedAgency]);
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAgency('');
  };
  
  const handleDragStart = (proposalId: string) => {
    setDraggedProposal(proposalId);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, status: ProposalStatus) => {
    e.preventDefault();
    
    if (draggedProposal) {
      updateProposalStatus(draggedProposal, status);
      setDraggedProposal(null);
    }
  };
  
  // Group proposals by status
  // Define valid statuses
  const validStatuses = ['intake', 'outline', 'drafting', 'internal_review', 'final_review', 'submitted'] as ProposalStatus[];

  // Group proposals by status
  const proposalsByStatus = useMemo(() => {
    const result: Record<ProposalStatus, Proposal[]> = {
      'intake': [],
      'outline': [],
      'drafting': [],
      'internal_review': [],
      'final_review': [],
      'submitted': []
    };
    filteredProposals.forEach(proposal => {
      if (result[proposal.status]) {
        result[proposal.status].push(proposal);
      }
    });
    return result;
  }, [filteredProposals]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 dark:text-gray-200">Flow Board</h1>
          <p className="text-gray-600 dark:text-gray-300">Visualize and manage your proposal workflow</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="btn btn-secondary flex items-center space-x-2 dark:bg-gray-800 dark:text-gray-300"
          >
            {showFilterPanel ? <X size={18} /> : <Filter size={18} />}
            <span>{showFilterPanel ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          
          <Link 
            to="/dashboard/proposals/new" 
            className="btn btn-primary dark:bg-primary-900 dark:text-white"
          >
            New Proposal
          </Link>
        </div>
      </div>
      
      {/* Filter panel */}
      {showFilterPanel && (
        <div className="bg-white rounded-lg shadow-card p-4 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                placeholder="Search proposals..."
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Agency</label>
                  <select
                    value={agencyFilter}
                    onChange={(e) => setAgencyFilter(e.target.value)}
                    className="form-select"
                    aria-label="Filter by agency"
                  >
                    <option value="">All Agencies</option>
                    {agencies.length > 0 ? (
                      agencies.map(agency => (
                        <option key={agency} value={agency}>{agency}</option>
                      ))
                    ) : (
                      <option value="" disabled>No agencies available</option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Flow Guides</label>
                  <div className="bg-white rounded-lg shadow-card p-4">
                    <p className="text-sm text-gray-600">Access comprehensive guides for each phase of the proposal process</p>
                  </div>
                  <FlowGuides />
                </div>

                <button
                  onClick={clearFilters}
                  className="btn btn-secondary flex items-center space-x-2"
                  aria-label="Clear all filters"
                  disabled={!searchTerm && !agencyFilter}
                >
                  <FilterX size={16} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Kanban board */}
      <div className="flex-1 flex overflow-x-auto pb-4">
        {validStatuses.map(status => (
          <div 
            key={status}
            className="flex-shrink-0 w-80 mx-2 first:ml-0 last:mr-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className={`bg-white rounded-lg shadow-card overflow-hidden ${getStatusBorderColor(status)} border-t-4`}>
              <div className={`p-4 flex items-center justify-between ${getStatusColor(status)} bg-opacity-20`}>
                <h3 className="font-semibold">{getStatusName(status)}</h3>
                <span className="bg-white bg-opacity-80 text-gray-700 rounded-full px-2 py-0.5 text-sm">
                  {proposalsByStatus[status]?.length || 0}
                </span>
              </div>
              
              <div className="p-2 overflow-y-auto flex-1">
                {proposalsByStatus[status]?.length > 0 ? (
                  <div className="space-y-3">
                    {proposalsByStatus[status].map(proposal => (
                      <div
                        key={proposal.id}
                        draggable
                        onDragStart={() => handleDragStart(proposal.id)}
                        className={`bg-white border ${
                          isOverdue(proposal.dueDate) ? 'border-error-300' : 'border-gray-200'
                        } rounded-lg p-3 cursor-move hover:shadow-md transition-shadow`}
                      >
                        <Link to={`/proposals/${proposal.id}`} className="block">
                          <div className="mb-2 font-medium line-clamp-2">{proposal.title}</div>
                          
                          <div className="text-sm space-y-1 text-gray-600">
                            <div className="flex items-center">
                              <Building size={14} className="mr-1" />
                              <span className="truncate">{proposal.agency}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <Calendar size={14} className={`mr-1 ${isOverdue(proposal.dueDate) ? 'text-error-500' : 'text-gray-500'}`} />
                              <span className={isOverdue(proposal.dueDate) ? 'text-error-600' : 'text-gray-600'}>
                                {formatDate(proposal.dueDate)}
                                {isOverdue(proposal.dueDate) && (
                                  <AlertTriangle size={12} className="inline ml-1 text-error-500" />
                                )}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <CheckSquare size={14} className="mr-1 text-gray-500" />
                              <span>
                                {proposal.tasks.filter(t => t.completed).length}/{proposal.tasks.length}
                              </span>
                            </div>
                            
                            {proposal.tasks.length > 0 && (
                              <div className="flex items-center">
                                <User size={14} className="mr-1 text-gray-500" />
                                <span className="truncate">
                                  {[...new Set(proposal.tasks.map(t => t.owner))].slice(0, 2).join(', ')}
                                  {[...new Set(proposal.tasks.map(t => t.owner))].length > 2 && '...'}
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 italic">
                    No proposals
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Reminders Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-200">Reminders</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overdue tasks section */}
          <div className={`lg:col-span-2 ${overdueTasks.length > 0 ? 'order-first' : 'order-2'}`}>
            <div className={`bg-white rounded-lg shadow-card overflow-hidden border-l-4 ${
              overdueTasks.length > 0 ? 'border-l-error-500' : 'border-l-success-500'
            }`}>
              <div className={`p-4 ${overdueTasks.length > 0 ? 'bg-error-50' : ''}`}>
                {overdueTasks.length > 0 ? (
                  <div className="space-y-3">
                    {overdueTasks.map((task) => (
                      <TaskCard
                        task={task}
                        proposalTitle={task.proposalTitle}
                        showProposalLink={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-success-600">
                    <CheckCircle size={48} className="mx-auto mb-3" />
                    <p>All caught up! No overdue tasks.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tasks due this week */}
          <div className="lg:col-span-1 order-3">
            <div className="bg-white rounded-lg shadow-card overflow-hidden border-l-4 border-l-warning-500">
              <div className="p-4 border-b border-gray-200 flex items-center">
                <div className="w-8 h-8 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center mr-3">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Tasks Due This Week</h3>
                  <p className="text-sm text-gray-600">
                    {tasksThisWeek.length > 0 
                      ? `${tasksThisWeek.length} ${tasksThisWeek.length === 1 ? 'task' : 'tasks'} due soon`
                      : 'No tasks due this week'}
                  </p>
                </div>
              </div>
              
              <div className="p-4">
                {tasksThisWeek.length > 0 ? (
                  <div className="space-y-3">
                    {tasksThisWeek.map((task) => (
                      <Link 
                        key={task.id}
                        to={`/proposals/${task.proposalId}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start">
                          <CheckSquare size={16} className="mr-2 text-warning-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium line-clamp-1">{task.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{task.proposalTitle}</p>
                            <div className="flex items-center mt-1 text-sm">
                              <Calendar size={14} className="mr-1 text-gray-500" />
                              <span className="text-warning-700">{formatDateWithDay(task.dueDate)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-400" />
                    <p>No tasks due this week.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Help text */}
      <div className="mt-6 bg-primary-50 text-primary-800 p-4 rounded-lg flex items-start">
        <InfoIcon size={20} className="mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          Drag and drop proposal cards to move them between stages. Click on a card to view its details.
        </p>
      </div>
    </div>
  );
};

export default FlowBoard;