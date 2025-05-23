import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Building, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import type { Proposal, UrgencyLevel } from '../types';
import { formatDate, getUrgencyLevel, getUrgencyColor, isOverdue } from '../utils/dateUtils';
import { getStatusName, getStatusColor } from '../utils/statusUtils';

interface ProposalCardProps {
  proposal: Proposal;
  showActions?: boolean;
}

const ProposalCard = ({ proposal, showActions = true }: ProposalCardProps) => {
  const urgencyLevel = getUrgencyLevel(proposal.dueDate) as UrgencyLevel;
  const urgencyColorClass = getUrgencyColor(urgencyLevel);
  const statusColorClass = getStatusColor(proposal.status);
  const isTasksCompleted = proposal.tasks.length > 0 && 
    proposal.tasks.every(task => task.completed);
  
  const totalTasks = proposal.tasks.length;
  const completedTasks = proposal.tasks.filter(task => task.completed).length;
  const taskCompletionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  return (
    <div className={`card border-l-4 ${
      isOverdue(proposal.dueDate) ? 'border-l-error-500' : 
      urgencyLevel === 'critical' ? 'border-l-error-500' :
      urgencyLevel === 'high' ? 'border-l-warning-500' :
      urgencyLevel === 'medium' ? 'border-l-accent-500' :
      'border-l-success-500'
    } hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold line-clamp-1">{proposal.title}</h3>
        <span className={`badge ${statusColorClass}`}>
          {getStatusName(proposal.status)}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <Building size={16} className="mr-2" />
          <span className="text-sm">{proposal.agency}</span>
        </div>
        
        <div className="flex items-center">
          <Calendar size={16} className={`mr-2 ${isOverdue(proposal.dueDate) ? 'text-error-500' : 'text-gray-600'}`} />
          <span className={`text-sm ${isOverdue(proposal.dueDate) ? 'text-error-600 font-medium' : 'text-gray-600'}`}>
            {isOverdue(proposal.dueDate) ? 'Overdue: ' : 'Due: '}
            {formatDate(proposal.dueDate)}
            {isOverdue(proposal.dueDate) && (
              <AlertTriangle size={14} className="inline ml-1 text-error-500" />
            )}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Clock size={16} className="mr-2" />
          <span className={`text-sm ${urgencyColorClass} px-2 py-0.5 rounded-full`}>
            {urgencyLevel === 'critical' 
              ? isOverdue(proposal.dueDate) 
                ? 'Overdue' 
                : 'Due immediately' 
              : urgencyLevel === 'high' 
                ? 'Due soon' 
                : urgencyLevel === 'medium' 
                  ? 'Approaching' 
                  : 'On track'}
          </span>
        </div>
      </div>
      
      {/* Task progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Task Progress</span>
          <span className="text-sm font-medium">
            {completedTasks}/{totalTasks} ({taskCompletionPercentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              taskCompletionPercentage === 100 
                ? 'bg-success-500' 
                : taskCompletionPercentage > 50 
                  ? 'bg-accent-500' 
                  : taskCompletionPercentage > 0 
                    ? 'bg-primary-500' 
                    : 'bg-gray-300'
            }`} 
            style={{ width: `${taskCompletionPercentage}%` }}
          />
        </div>
        {totalTasks === 0 && (
          <p className="text-xs text-gray-500 mt-1">No tasks created yet</p>
        )}
      </div>
      
      {showActions && (
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <div>
            {isTasksCompleted && totalTasks > 0 ? (
              <span className="flex items-center text-sm text-success-600">
                <CheckCircle size={16} className="mr-1" />
                All tasks complete
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                {totalTasks > 0
                  ? `${totalTasks - completedTasks} tasks remaining`
                  : 'No tasks added'
                }
              </span>
            )}
          </div>
          
          <Link 
            to={`/proposals/${proposal.id}/analyze`}
            className="flex items-center text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            View Details
            <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProposalCard;