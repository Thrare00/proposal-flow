import React, { useMemo, useEffect, useState, Suspense, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Calendar,
  FileText,
  CheckSquare,
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  X,
  Filter,
  Search
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { 
  isOverdue,
  formatDateWithDay
} from '../utils/dateUtils.js';
import { 
  startOfDay,
  parseISO, 
  isBefore, 
  addDays, 
  endOfDay,
  isWithinInterval,
  endOfWeek,
  startOfWeek,
  subDays,
  isAfter,
  format
} from 'date-fns';
import { getUrgencyLevel } from '../utils/statusUtils.js';

// Static imports
import TaskCard from '../components/TaskCard.jsx';
import ProposalCard from '../components/ProposalCard.jsx';

// Loading component for Suspense fallback
const LoadingSpinner = ({ text = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };
  
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-blue-600 mr-2`} />
      <span className="text-gray-600">{text}</span>
    </div>
  );
};

// Error state component
const ErrorState = ({ error, onRetry, className = '' }) => (
  <div className={`bg-red-50 border-l-4 border-red-500 p-4 rounded-lg ${className}`}>
    <div className="flex">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-500" />
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          {error?.message || 'An error occurred while loading reminders'}
        </h3>
        <div className="mt-2 text-sm text-red-700">
          <p>Please try again or contact support if the problem persists.</p>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12">
    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// Memoized task processing functions
const processTasks = (proposals) => {
  if (!Array.isArray(proposals)) return [];
  
  return proposals.flatMap(proposal => {
    if (!proposal?.tasks?.length) return [];
    
    return proposal.tasks
      .map(task => ({
        ...task,
        proposalTitle: proposal.title || 'Untitled Proposal',
        proposalId: proposal.id,
        dueDate: task.dueDate ? parseISO(task.dueDate) : null,
        _proposal: { id: proposal.id, title: proposal.title }
      }))
      .filter(task => task.dueDate);
  });
};

// Memoized filter functions
const filterOverdueTasks = (tasks) => 
  tasks.filter(task => !task.completed && isBefore(task.dueDate, startOfDay(new Date())));

const filterTasksThisWeek = (tasks) => {
  const today = startOfDay(new Date());
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
  
  return tasks.filter(task => 
    !task.completed && 
    !isBefore(task.dueDate, today) && 
    isBefore(task.dueDate, endOfThisWeek)
  );
};

const filterUpcomingTasks = (tasks) => {
  const today = startOfDay(new Date());
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
  
  return tasks.filter(task => 
    !task.completed && 
    isAfter(task.dueDate, endOfThisWeek)
  );
};

const Reminders = () => {
  const { proposals = [], isLoading, error } = useProposalContext();
  const [localError, setLocalError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Process tasks with error handling
  const allTasks = useMemo(() => {
    try {
      return processTasks(proposals);
    } catch (err) {
      console.error('Error processing tasks:', err);
      setLocalError('Failed to process tasks. Please try refreshing the page.');
      return [];
    }
  }, [proposals]);
  
  // Memoize all filtered data in a single useMemo hook
  const {
    overdueTasks,
    tasksThisWeek,
    upcomingTasks,
    overdueProposals,
    completedTasks,
    proposalsDueSoon
  } = useMemo(() => {
    setIsProcessing(true);
    try {
      // Process proposals for overdue status
      const overdueProposals = (proposals ?? [])
        .filter(p => p.status !== 'submitted' && isOverdue(p.dueDate))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      // Filter completed tasks (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const completedTasks = allTasks.filter(task => {
        try {
          if (!task.completed || !task.completedAt) return false;
          const completedDate = parseISO(task.completedAt);
          return isAfter(completedDate, thirtyDaysAgo);
        } catch (err) {
          console.warn('Error processing completed task:', task, err);
          return false;
        }
      });

      // Filter proposals due soon (next 7 days)
      const today = new Date();
      const nextWeek = addDays(today, 7);
      const proposalsDueSoon = proposals.filter(proposal => {
        try {
          if (!proposal || !proposal.dueDate) return false;
          const proposalDate = parseISO(proposal.dueDate);
          const urgency = getUrgencyLevel(proposal.dueDate);
          return (
            proposal.status !== 'submitted' &&
            (urgency === 'high' || urgency === 'critical') &&
            isAfter(proposalDate, today) && 
            isBefore(proposalDate, endOfDay(nextWeek))
          );
        } catch (err) {
          console.warn('Error processing proposal date:', proposal, err);
          return false;
        }
      }).sort((a, b) => {
        try {
          return parseISO(a.dueDate) - parseISO(b.dueDate);
        } catch (err) {
          return 0;
        }
      });

      return {
        overdueTasks: filterOverdueTasks(allTasks),
        tasksThisWeek: filterTasksThisWeek(allTasks),
        upcomingTasks: filterUpcomingTasks(allTasks),
        overdueProposals,
        completedTasks,
        proposalsDueSoon
      };
    } catch (err) {
      console.error('Error processing data:', err);
      setLocalError('Failed to process data.');
      return { 
        overdueTasks: [], 
        tasksThisWeek: [], 
        upcomingTasks: [],
        overdueProposals: [],
        completedTasks: [],
        proposalsDueSoon: []
      };
    } finally {
      setIsProcessing(false);
    }
  }, [allTasks, proposals]);
  
  // Show loading state
  if (isLoading || isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Loading reminders..." />
      </div>
    );
  }
  
  // Show error state if there's an error
  if (error || localError) {
    return (
      <ErrorState 
        error={error || localError} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reminders...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we gather your tasks and proposals</p>
        </div>
      </div>
    );
  }
  
  // Show error state if there's an error
  if (error || localError) {
    const errorMessage = error?.message || localError || 'An unknown error occurred';
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading reminders</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Proposals in final review
  const proposalsInFinalReview = useMemo(() => {
    return proposals.filter(proposal => 
      proposal.status === 'final_review'
    );
  }, [proposals]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Reminders</h1>
        <p className="text-gray-600 dark:text-gray-400">Stay on top of upcoming deadlines and tasks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue tasks section */}
        <div className={`lg:col-span-2 ${overdueTasks.length > 0 ? 'order-first' : 'order-2'}`}>
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-card overflow-hidden border-l-4 ${
            overdueTasks.length > 0 ? 'border-l-error-500' : 'border-l-success-500'
          }`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                overdueTasks.length > 0 ? 'bg-error-100 dark:bg-error-900 text-error-600 dark:text-error-400' : 'bg-success-100 dark:bg-success-900 text-success-600 dark:text-success-400'
              }`}>
                {overdueTasks.length > 0 ? (
                  <AlertTriangle size={18} />
                ) : (
                  <CheckCircle size={18} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">Overdue Tasks</h2>
                <p className="text-sm text-gray-600">
                  {overdueTasks.length > 0 
                    ? `You have ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}`
                    : 'No overdue tasks'}
                </p>
              </div>
            </div>
            
            <div className={`p-4 ${overdueTasks.length > 0 ? 'bg-error-50' : ''}`}>
              {overdueTasks.length > 0 ? (
                <div className="space-y-3">
                  {overdueTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card overflow-hidden border-l-4 border-l-warning-500">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <div className="w-8 h-8 rounded-full bg-warning-100 dark:bg-warning-900 text-warning-600 dark:text-warning-400 flex items-center justify-center mr-3">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tasks Due This Week</h2>
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
                            <CalendarIcon size={14} className="mr-1 text-gray-500" />
                            <span className="text-warning-700">{formatDateWithDay(task.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CalendarIcon size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No tasks due this week.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Proposals due soon */}
        <div className="lg:col-span-3 order-4">
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Proposals Needing Attention</h2>
              <p className="text-sm text-gray-600">Proposals with upcoming deadlines or in final stages</p>
            </div>
            
            <div className="p-4">
              {overdueProposals.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-error-700 mb-3 flex items-center">
                    <AlertTriangle size={16} className="mr-2" />
                    Overdue Proposals
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overdueProposals.map(proposal => (
                      <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                </div>
              )}
              
              {proposalsDueSoon.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-warning-700 mb-3 flex items-center">
                    <Clock size={16} className="mr-2" />
                    Proposals Due Soon
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proposalsDueSoon.map(proposal => (
                      <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                </div>
              )}
              
              {proposalsInFinalReview.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-primary-700 mb-3 flex items-center">
                    <FileText size={16} className="mr-2" />
                    Proposals in Final Review
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proposalsInFinalReview.map(proposal => (
                      <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                </div>
              )}
              
              {overdueProposals.length === 0 && proposalsDueSoon.length === 0 && proposalsInFinalReview.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <CheckCircle size={64} className="mx-auto mb-4 text-success-500" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">All Caught Up!</h3>
                  <p>No proposals need immediate attention right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;