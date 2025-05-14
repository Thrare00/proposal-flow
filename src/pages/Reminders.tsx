import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Calendar,
  FileText,
  CheckSquare
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext';
import TaskCard from '../components/TaskCard';
import ProposalCard from '../components/ProposalCard';
import { formatDateWithDay, getUrgencyLevel, isOverdue } from '../utils/dateUtils';
import { parseISO, isBefore, addDays, endOfDay } from 'date-fns';

const Reminders = () => {
  const { proposals } = useProposalContext();
  
  // Get all tasks from all proposals
  const allTasks = useMemo(() => {
    return proposals.flatMap(proposal => 
      proposal.tasks.map(task => ({
        ...task,
        proposalTitle: proposal.title
      }))
    );
  }, [proposals]);
  
  // Overdue tasks
  const overdueTasks = useMemo(() => {
    return allTasks.filter(task => 
      !task.completed && isOverdue(task.dueDate)
    ).sort((a, b) => 
      parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
    );
  }, [allTasks]);
  
  // Tasks due this week
  const tasksThisWeek = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return allTasks.filter(task => {
      const taskDate = parseISO(task.dueDate);
      return (
        !task.completed &&
        !isOverdue(task.dueDate) &&
        isBefore(taskDate, endOfDay(nextWeek))
      );
    }).sort((a, b) => 
      parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
    );
  }, [allTasks]);
  
  // Proposals due soon (next 7 days)
  const proposalsDueSoon = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return proposals.filter(proposal => {
      const proposalDate = parseISO(proposal.dueDate);
      const urgency = getUrgencyLevel(proposal.dueDate);
      
      return (
        proposal.status !== 'submitted' &&
        (urgency === 'high' || urgency === 'critical') && 
        isBefore(proposalDate, endOfDay(nextWeek))
      );
    }).sort((a, b) => 
      parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
    );
  }, [proposals]);
  
  // Overdue proposals
  const overdueProposals = useMemo(() => {
    return proposals.filter(proposal => 
      proposal.status !== 'submitted' && isOverdue(proposal.dueDate)
    ).sort((a, b) => 
      parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
    );
  }, [proposals]);
  
  // Proposals in final review
  const proposalsInFinalReview = useMemo(() => {
    return proposals.filter(proposal => 
      proposal.status === 'final_review'
    );
  }, [proposals]);
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Reminders</h1>
        <p className="text-gray-600">Stay on top of upcoming deadlines and tasks</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overdue tasks section */}
        <div className={`lg:col-span-2 ${overdueTasks.length > 0 ? 'order-first' : 'order-2'}`}>
          <div className={`bg-white rounded-lg shadow-card overflow-hidden border-l-4 ${
            overdueTasks.length > 0 ? 'border-l-error-500' : 'border-l-success-500'
          }`}>
            <div className="p-4 border-b border-gray-200 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                overdueTasks.length > 0 ? 'bg-error-100 text-error-600' : 'bg-success-100 text-success-600'
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
          <div className="bg-white rounded-lg shadow-card overflow-hidden border-l-4 border-l-warning-500">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <div className="w-8 h-8 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center mr-3">
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