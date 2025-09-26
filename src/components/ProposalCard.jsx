import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  Calendar, 
  Building, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { formatDate, getUrgencyLevel, getUrgencyColor, isOverdue } from '../utils/dateUtils.js';
import { getStatusName, getStatusColor } from '../utils/statusUtils.js';
import { format } from 'date-fns';

const ProposalCard = ({ proposal = {}, showActions = true }) => {
  // Safely handle missing or malformed proposal data
  if (!proposal || typeof proposal !== 'object') {
    return (
      <div className="card border-l-4 border-l-gray-300 p-4">
        <div className="text-gray-500">Invalid proposal data</div>
      </div>
    );
  }

  const { 
    id, 
    title = 'Untitled Proposal', 
    agency = 'No Agency', 
    dueDate, 
    status = 'drafting',
    tasks = [] 
  } = proposal;

  const urgencyLevel = getUrgencyLevel(dueDate);
  const urgencyColorClass = getUrgencyColor(urgencyLevel);
  const statusColorClass = getStatusColor(status);
  const isTasksCompleted = tasks.length > 0 && tasks.every(task => task?.completed);
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task?.completed).length;
  const taskCompletionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
    
  const isOverdueDueDate = isOverdue(dueDate);
  
  return (
    <div 
      className={`card border-l-4 ${
        isOverdueDueDate ? 'border-l-error-500' : 
        urgencyLevel === 'critical' ? 'border-l-error-500' :
        urgencyLevel === 'high' ? 'border-l-warning-500' :
        urgencyLevel === 'medium' ? 'border-l-accent-500' :
        'border-l-success-500'
      } hover:shadow-md transition-all`}
      aria-labelledby={`proposal-${id}-title`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 id={`proposal-${id}-title`} className="text-xl font-semibold line-clamp-1">
          {title}
        </h3>
        <span 
          className={`badge ${statusColorClass}`}
          aria-label={`Status: ${getStatusName(status)}`}
        >
          {getStatusName(status)}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <Building size={16} className="mr-2" aria-hidden="true" />
          <span className="text-sm">{agency}</span>
        </div>
        
        <div className="flex items-center">
          <Calendar 
            size={16} 
            className={`mr-2 ${isOverdueDueDate ? 'text-error-500' : 'text-gray-600'}`} 
            aria-hidden="true" 
          />
          <span className={`text-sm ${isOverdueDueDate ? 'text-error-600 font-medium' : 'text-gray-600'}`}>
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

ProposalCard.propTypes = {
  proposal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    agency: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    status: PropTypes.string,
    tasks: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      completed: PropTypes.bool
    }))
  }),
  showActions: PropTypes.bool
};

// defaultProps removed; using default parameters in the function signature

export default React.memo(ProposalCard);