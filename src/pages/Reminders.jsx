import React, { 
  useMemo, 
  useState, 
  useCallback, 
  useEffect, 
  useRef,
  useDeferredValue,
  memo
} from 'react';
import PropTypes from 'prop-types';
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
  endOfDay,
  endOfWeek,
  startOfWeek,
  isAfter,
  isToday,
  isTomorrow,
  isThisWeek,
  addDays,
  subDays,
  parseISO,
  isBefore,
  format as formatDate,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isPast,
  isFuture,
  addWeeks,
  subWeeks,
  differenceInDays
} from 'date-fns';
import { getUrgencyLevel } from '../utils/statusUtils.js';
// Import components directly
import TaskCard from '../components/TaskCard.jsx';
import ProposalCard from '../components/ProposalCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// Skeleton loading components
const TaskSkeleton = () => (
  <div className="animate-pulse p-4 border rounded-lg mb-2 bg-gray-50">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
  </div>
);

const SectionSkeleton = ({ title }) => (
  <div className="mb-8">
    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h2>
    <div className="space-y-2">
      <TaskSkeleton />
      <TaskSkeleton />
    </div>
  </div>
);

SectionSkeleton.propTypes = {
  title: PropTypes.string.isRequired
};

// Empty state component with memoization
const EmptyState = React.memo(({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`text-center py-12 ${className}`}>
    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
      <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
    </div>
    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
));

EmptyState.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  action: PropTypes.node,
  className: PropTypes.string
};

EmptyState.defaultProps = {
  action: null,
  className: ''
};

EmptyState.displayName = 'EmptyState';

// Error state component with retry functionality
const ErrorState = memo(({ error, onRetry, className = '' }) => (
  <div className={`p-4 bg-red-50 border border-red-200 dark:bg-red-900/10 dark:border-red-900/30 rounded-md ${className}`}>
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading reminders</h3>
    </div>
    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
      {error?.message || 'An unknown error occurred'}
    </div>
    {onRetry && (
      <div className="mt-4">
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 focus:outline-none flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </button>
      </div>
    )}
  </div>
));

ErrorState.propTypes = {
  error: PropTypes.instanceOf(Error),
  onRetry: PropTypes.func,
  className: PropTypes.string
};

ErrorState.defaultProps = {
  error: null,
  onRetry: null,
  className: ''
};

ErrorState.displayName = 'ErrorState';

// Filter functions will be moved inside the component

// Simple task item component
const TaskItem = memo(({ task }) => (
  <div className="mb-2">
    <TaskCard task={task} />
  </div>
));

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    status: PropTypes.string,
    priority: PropTypes.string,
    completed: PropTypes.bool,
    completedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }).isRequired
};

TaskItem.displayName = 'TaskItem';

// Memoized proposal item component to prevent unnecessary re-renders
const ProposalItem = memo(({ proposal }) => (
  <div className="mb-4">
    <ProposalCard proposal={proposal} />
  </div>
));

ProposalItem.propTypes = {
  proposal: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    client: PropTypes.string,
    value: PropTypes.number,
    currency: PropTypes.string
  }).isRequired
};

ProposalItem.displayName = 'ProposalItem';

// Simple list component with virtualization for better performance
const SimpleList = memo(({ 
  items, 
  renderItem, 
  containerHeight = 400,
  emptyState = null,
  loading = false,
  loadingComponent = null
}) => {
  if (loading) {
    return loadingComponent || (
      <div className="flex justify-center items-center" style={{ height: containerHeight }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return emptyState || (
      <div className="flex justify-center items-center text-gray-500" style={{ height: containerHeight }}>
        No items to display
      </div>
    );
  }

  return (
    <div 
      className="space-y-2 pr-2 -mr-2" 
      style={{ 
        maxHeight: containerHeight, 
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#9ca3af #f3f4f6'
      }}
    >
      {items.map((item, index) => (
        <div key={item.id || index} className="transition-all duration-200 hover:scale-[1.01]">
          {renderItem({ item, index })}
        </div>
      ))}
    </div>
  );
});

SimpleList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  renderItem: PropTypes.func.isRequired,
  containerHeight: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
  emptyState: PropTypes.node,
  loading: PropTypes.bool,
  loadingComponent: PropTypes.node
};

SimpleList.defaultProps = {
  containerHeight: 400,
  emptyState: null,
  loading: false,
  loadingComponent: null
};

SimpleList.displayName = 'SimpleList';

// Use SimpleList as the default VirtualList
const VirtualList = SimpleList;

// Main Reminders component with tabs for different views
const Reminders = () => {
  const { proposals = [], isLoading, error } = useProposalContext();
  const [activeTab, setActiveTab] = useState('overdue');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  // State for filters and sorting
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dueDate: 'anytime',
    searchQuery: ''
  });
  
  const [sortBy, setSortBy] = useState({
    field: 'dueDate',
    direction: 'asc' // 'asc' or 'desc'
  });
  
  // Debounced search query
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);
  
  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      searchQuery: debouncedSearchTerm
    }));
  }, [debouncedSearchTerm]);

  // Filter functions with memoization
  const filterOverdueTasks = useCallback((tasks) => {
    return tasks.filter(task => task.urgency === 'overdue');
  }, []);

  const filterTasksThisWeek = useCallback((tasks) => {
    return tasks.filter(task => 
      task.timeStatus === 'today' || 
      task.timeStatus === 'tomorrow' || 
      task.timeStatus === 'this_week'
    );
  }, []);

  const filterUpcomingTasks = useCallback((tasks) => {
    return tasks.filter(task => task.timeStatus === 'upcoming');
  }, []);
  
  // Task processing function
  const processTasks = useCallback((proposals) => {
    if (!proposals || !Array.isArray(proposals)) return [];
    
    const now = new Date();
    const weekEnd = endOfWeek(now);
    
    return proposals.flatMap(proposal => {
      if (!proposal || !proposal.tasks) return [];
      
      return proposal.tasks
        .filter(task => task && !task.completed)
        .map(task => {
          const dueDate = task.dueDate || task.due_date;
          const due = dueDate ? new Date(dueDate) : null;
          let timeStatus = '';
          
          if (due) {
            if (isToday(due)) {
              timeStatus = 'today';
            } else if (isTomorrow(due)) {
              timeStatus = 'tomorrow';
            } else if (isThisWeek(due)) {
              timeStatus = 'this_week';
            } else if (isAfter(due, weekEnd)) {
              timeStatus = 'upcoming';
            }
          }
          
          return {
            ...task,
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            dueDate: due,
            timeStatus,
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            urgency: getUrgencyLevel(task.dueDate || dueDate)
          };
        });
    });
  }, []);
  
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

  // Render tab navigation with enhanced accessibility and tooltips
  const renderTabNavigation = () => {
    const tabs = [
      { 
        id: 'overdue', 
        label: 'Overdue', 
        icon: AlertTriangle, 
        count: overdueTasks.length, 
        badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
        description: 'Tasks and proposals that are past their due date'
      },
      { 
        id: 'thisWeek', 
        label: 'This Week', 
        icon: Calendar, 
        count: tasksThisWeek.length, 
        badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
        description: 'Tasks and proposals due this week'
      },
      { 
        id: 'upcoming', 
        label: 'Upcoming', 
        icon: Clock, 
        count: upcomingTasks.length, 
        badgeClass: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
        description: 'Tasks and proposals due in the future'
      },
      { 
        id: 'proposals', 
        label: 'Proposals', 
        icon: FileText, 
        count: proposalsDueSoon.length, 
        badgeClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
        description: 'Proposals with approaching deadlines'
      },
      { 
        id: 'completed', 
        label: 'Completed', 
        icon: CheckCircle, 
        count: completedTasks.length, 
        badgeClass: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
        description: 'Recently completed tasks and proposals'
      }
    ];

    return (
      <div className="mb-6">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto pb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                      ${isActive 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }
                      whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
                      transition-colors duration-150 ease-in-out relative
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    title={tab.description}
                  >
                    <Icon 
                      className={`mr-2 h-5 w-5 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} 
                      aria-hidden="true" 
                    />
                    <span className="truncate">{tab.label}</span>
                    {tab.count > 0 && (
                      <span 
                        className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${tab.badgeClass} min-w-[1.5rem] inline-flex items-center justify-center`}
                        aria-label={`${tab.count} items`}
                      >
                        {tab.count}
                      </span>
                    )}
                    <span className="sr-only">{tab.description}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Apply filters to items
  const applyFilters = useCallback((items, type = 'task') => {
    return items.filter(item => {
      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'completed' && !item.completed) return false;
        if (filters.status === 'active' && item.completed) return false;
        if (filters.status === 'pending' && item.status !== 'pending') return false;
      }
      
      // Priority filter
      if (filters.priority !== 'all' && item.priority !== filters.priority) {
        return false;
      }
      
      // Search query - search across multiple fields with improved matching
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.trim().toLowerCase();
        if (!searchLower) return true;
        
        // Search in various fields
        const searchableFields = [
          item.title,
          item.description,
          item.id,
          item.assignee?.name,
          item.owner?.name,
          item.tags?.join(' '),
          item.clientName,
          item.projectName
        ];
        
        // Check if any field contains the search term
        const matches = searchableFields.some(field => 
          field && String(field).toLowerCase().includes(searchLower)
        );
        
        // Special handling for priority and status
        const priorityMatch = item.priority && 
          item.priority.toLowerCase().includes(searchLower);
          
        const statusMatch = item.status && 
          item.status.toLowerCase().includes(searchLower);
        
        // Check for date matches (if search term looks like a date)
        let dateMatch = false;
        try {
          const searchDate = new Date(searchLower);
          if (!isNaN(searchDate)) {
            const itemDate = item.dueDate ? new Date(item.dueDate) : null;
            if (itemDate) {
              dateMatch = itemDate.toDateString() === searchDate.toDateString();
            }
          }
        } catch (e) {
          // Ignore date parsing errors
        }
        
        if (!matches && !priorityMatch && !statusMatch && !dateMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [filters]);
  
  // Sort items based on sortBy state
  const sortItems = useCallback((items) => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy.field) {
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
          const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
          comparison = dateA - dateB;
          break;
          
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
          
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
          
        default:
          comparison = 0;
      }
      
      return sortBy.direction === 'desc' ? -comparison : comparison;
    });
  }, [sortBy]);
  
  // Process items for each tab with filters and sorting
  const processTabItems = useCallback((items) => {
    const filtered = applyFilters(items);
    return sortItems(filtered);
  }, [applyFilters, sortItems]);

  // Get tab configuration with filtered and sorted items
  const getTabConfig = () => ({
    overdue: { 
      items: processTabItems([...overdueTasks, ...overdueProposals]),
      emptyState: {
        icon: CheckCircle,
        title: 'No overdue items',
        description: 'You\'re all caught up! No overdue tasks or proposals.'
      }
    },
    thisWeek: {
      items: processTabItems(tasksThisWeek),
      emptyState: {
        icon: Calendar,
        title: 'No tasks this week',
        description: 'You don\'t have any tasks due this week.'
      }
    },
    upcoming: {
      items: processTabItems(upcomingTasks),
      emptyState: {
        icon: Clock,
        title: 'No upcoming tasks',
        description: 'You don\'t have any upcoming tasks scheduled.'
      }
    },
    proposals: {
      items: processTabItems(proposalsDueSoon),
      emptyState: {
        icon: FileText,
        title: 'No proposals due soon',
        description: 'You don\'t have any proposals with upcoming deadlines.'
      },
      isGrid: true
    },
    completed: {
      items: processTabItems(completedTasks),
      emptyState: {
        icon: CheckSquare,
        title: 'No completed items',
        description: 'Your completed tasks will appear here.'
      },
      showCompleted: true
    }
  });

  // Render content based on active tab
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
        </div>
      );
    }

    const tabConfig = getTabConfig();
    const config = tabConfig[activeTab] || {};
    const { items = [], emptyState, isGrid = false } = config;

    // Special handling for overdue tab which combines tasks and proposals
    if (activeTab === 'overdue') {
      return (
        <div className="space-y-6">
          {overdueTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Overdue Tasks</h2>
              <div className="space-y-2">
                {overdueTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
          {overdueProposals.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Overdue Proposals</h2>
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {overdueProposals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            </div>
          )}
          {items.length === 0 && (
            <EmptyState 
              icon={emptyState.icon}
              title={emptyState.title}
              description={emptyState.description}
            />
          )}
        </div>
      );
    }

    // Handle empty state
    if (items.length === 0) {
      return (
        <EmptyState 
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
        />
      );
    }

    // Render items in grid or list layout
    if (isGrid) {
      return (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {items.map(item => (
            activeTab === 'proposals' ? (
              <ProposalCard key={item.id} proposal={item} />
            ) : (
              <TaskCard key={item.id} task={item} />
            )
          ))}
        </div>
      );
    }

    // Default list layout
    const showCompleted = activeTab === 'completed';
    return (
      <div className="space-y-2">
        {items.map(item => (
          <TaskCard 
            key={item.id} 
            task={item} 
            showCompleted={showCompleted}
          />
        ))}
      </div>
    );
  };

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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your upcoming tasks and deadlines
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.reload()}
              disabled={isLoading || isProcessing}
              className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isLoading || isProcessing
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500'
              }`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isProcessing) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        {renderTabNavigation()}
        
        {/* Filter and Sort Controls */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search tasks and proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search tasks and proposals"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => {
                      setSearchTerm('');
                      setDebouncedSearchTerm('');
                    }}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                  </button>
                ) : null}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div>
                <label htmlFor="status-filter" className="sr-only">Status</label>
                <select
                  id="status-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority-filter" className="sr-only">Priority</label>
                <select
                  id="priority-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="sort-by" className="sr-only">Sort by</label>
                <select
                  id="sort-by"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={`${sortBy.field}-${sortBy.direction}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-')
                    setSortBy({ field, direction })
                  }}
                >
                  <option value="dueDate-asc">Due Date: Earliest First</option>
                  <option value="dueDate-desc">Due Date: Latest First</option>
                  <option value="priority-desc">Priority: High to Low</option>
                  <option value="priority-asc">Priority: Low to High</option>
                  <option value="title-asc">Title: A to Z</option>
                  <option value="title-desc">Title: Z to A</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        <ErrorBoundary>
          {renderTabContent()}
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Add PropTypes for the Reminders component
Reminders.propTypes = {
  // Context props
  proposals: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    client: PropTypes.string,
    value: PropTypes.number,
    currency: PropTypes.string
  })),
  isLoading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  
  // Local state props (for testing)
  initialActiveTab: PropTypes.string,
  initialIsProcessing: PropTypes.bool
};

Reminders.defaultProps = {
  proposals: [],
  isLoading: false,
  error: null,
  initialActiveTab: 'overdue',
  initialIsProcessing: false
};

// Memoize the main component to prevent unnecessary re-renders
const MemoizedReminders = memo(Reminders);
MemoizedReminders.displayName = 'MemoizedReminders';

export default MemoizedReminders;