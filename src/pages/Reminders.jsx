import React, { useMemo, useState, useCallback, lazy, Suspense } from 'react';
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

// Lazy load heavy components with preloading
const TaskCard = lazy(() => {
  // Start preloading
  const taskCard = import('../components/TaskCard.jsx');
  return taskCard;
});

const ProposalCard = lazy(() => {
  // Start preloading
  const proposalCard = import('../components/ProposalCard.jsx');
  return proposalCard;
});

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

// Memoized task item component to prevent unnecessary re-renders
const TaskItem = React.memo(({ task }) => (
  <div className="mb-2">
    <TaskCard task={task} />
  </div>
));

// Memoized proposal item component to prevent unnecessary re-renders
const ProposalItem = React.memo(({ proposal }) => (
  <div className="mb-4">
    <ProposalCard proposal={proposal} />
  </div>
));

// Virtualized list component for better performance with large lists
const VirtualList = React.memo(({ items, renderItem, itemHeight = 100, containerHeight = 400 }) => {
  const containerRef = React.useRef();
  const [scrollTop, setScrollTop] = React.useState(0);
  const [visibleItems, setVisibleItems] = React.useState([]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // +2 for buffer
    const endIndex = Math.min(startIndex + visibleCount, items.length - 1);
    
    setVisibleItems(items.slice(startIndex, endIndex));
    
    const handleScroll = () => setScrollTop(container.scrollTop);
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items, scrollTop, itemHeight, containerHeight]);

  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto" 
      style={{ height: `${containerHeight}px` }}
    >
      <div style={{ height: `${items.length * itemHeight}px`, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div 
            key={item.id || index}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${itemHeight * (items.indexOf(item) - Math.floor(scrollTop / itemHeight)) * itemHeight}px)`,
              width: '100%',
              height: `${itemHeight}px`
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});

const Reminders = () => {
  const { proposals = [], isLoading, error } = useProposalContext();
  const [localError, setLocalError] = useState(null);
  const [activeTab, setActiveTab] = useState('overdue');
  
  // Process tasks with error handling and memoization
  const allTasks = useMemo(() => {
    try {
      return processTasks(proposals);
    } catch (err) {
      console.error('Error processing tasks:', err);
      setLocalError('Failed to process tasks. Please try refreshing the page.');
      return [];
    }
  }, [proposals]);
  
  // Memoize tab change handler
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);
  
  // Memoize all filtered data in a single useMemo hook
  const {
    overdueTasks,
    tasksThisWeek,
    upcomingTasks,
    overdueProposals,
    completedTasks,
    proposalsDueSoon
  } = useMemo(() => {
    if (!proposals || !allTasks) {
      return {
        overdueTasks: [],
        tasksThisWeek: [],
        upcomingTasks: [],
        overdueProposals: [],
        completedTasks: [],
        proposalsDueSoon: []
      };
    }

    try {
      // Process proposals for overdue status
      const overdueProposals = proposals
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
  
  // Memoize the render functions for VirtualList
  const renderTaskItem = useCallback((task) => (
    <div key={task.id} className="mb-2">
      <TaskCard task={task} />
    </div>
  ), []);
  
  const renderProposalItem = useCallback((proposal) => (
    <div key={proposal.id} className="mb-4">
      <ProposalCard proposal={proposal} />
    </div>
  ), []);

  // Tab content mapping
  const tabContent = {
    overdue: (
      <div className="space-y-4">
        {overdueTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-red-600 flex items-center">
              <AlertTriangle className="mr-2" /> Overdue Tasks
            </h3>
            <VirtualList 
              items={overdueTasks}
              renderItem={renderTaskItem}
              itemHeight={120}
              containerHeight={Math.min(overdueTasks.length * 120, 400)}
            />
          </div>
        )}
        {overdueProposals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-red-600 flex items-center">
              <FileText className="mr-2" /> Overdue Proposals
            </h3>
            <VirtualList 
              items={overdueProposals}
              renderItem={renderProposalItem}
              itemHeight={180}
              containerHeight={Math.min(overdueProposals.length * 180, 400)}
            />
          </div>
        )}
        {overdueTasks.length === 0 && overdueProposals.length === 0 && (
          <EmptyState 
            icon={CheckCircle}
            title="No overdue items"
            description="You're all caught up! No overdue tasks or proposals."
          />
        )}
      </div>
    ),
    thisWeek: (
      <div className="space-y-4">
        {tasksThisWeek.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-amber-600">
              Due This Week
            </h3>
            <VirtualList 
              items={tasksThisWeek}
              renderItem={renderTaskItem}
              itemHeight={120}
              containerHeight={Math.min(tasksThisWeek.length * 120, 400)}
            />
          </div>
        ) : (
          <EmptyState 
            icon={CheckCircle}
            title="No tasks due this week"
            description="You're all caught up for this week!"
          />
        )}
      </div>
    ),
    upcoming: (
      <div className="space-y-4">
        {upcomingTasks.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-blue-600">
              Upcoming Tasks
            </h3>
            <VirtualList 
              items={upcomingTasks}
              renderItem={renderTaskItem}
              itemHeight={120}
              containerHeight={Math.min(upcomingTasks.length * 120, 400)}
            />
          </div>
        ) : (
          <EmptyState 
            icon={CheckCircle}
            title="No upcoming tasks"
            description="You don't have any tasks scheduled for the near future."
          />
        )}
      </div>
    ),
    proposals: (
      <div className="space-y-4">
        {proposalsDueSoon.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-amber-600">
              Proposals Due Soon
            </h3>
            <VirtualList 
              items={proposalsDueSoon}
              renderItem={renderProposalItem}
              itemHeight={180}
              containerHeight={Math.min(proposalsDueSoon.length * 180, 400)}
            />
          </div>
        ) : (
          <EmptyState 
            icon={CheckCircle}
            title="No upcoming proposals"
            description="You don't have any proposals due soon."
          />
        )}
      </div>
    ),
    completed: (
      <div className="space-y-4">
        {completedTasks.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-green-600">
              Recently Completed
            </h3>
            <VirtualList 
              items={completedTasks}
              renderItem={renderTaskItem}
              itemHeight={120}
              containerHeight={Math.min(completedTasks.length * 120, 400)}
            />
          </div>
        ) : (
          <EmptyState 
            icon={CheckCircle}
            title="No completed tasks"
            description="You haven't completed any tasks recently."
          />
        )}
      </div>
    )
  };
  
  // Tab definitions
  const tabs = [
    { id: 'overdue', label: 'Overdue', count: overdueTasks.length + overdueProposals.length },
    { id: 'thisWeek', label: 'This Week', count: tasksThisWeek.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingTasks.length },
    { id: 'proposals', label: 'Proposals', count: proposalsDueSoon.length },
    { id: 'completed', label: 'Completed', count: completedTasks.length }
  ];

  // Show error state if there's an error
  if (error || localError) {
    return (
      <div className="p-4">
        <ErrorState 
          error={error || localError} 
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reminders</h1>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner text="Loading content..." />
          </div>
        }>
          {tabContent[activeTab] || (
            <EmptyState 
              icon={CheckCircle}
              title="No items found"
              description="There are no items to display in this section."
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default Reminders;