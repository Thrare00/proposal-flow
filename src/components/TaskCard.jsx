import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Calendar,
  Check,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { UrgencyBadge } from './UrgencyBadge.jsx';
import { formatDate, isOverdue } from '../utils/dateUtils.js';
import { format } from 'date-fns';
import { useProposalContext } from '../contexts/ProposalContext.jsx';

const TaskCard = ({ task, showProposalLink, onEdit, onDelete }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const context = useProposalContext();
  const { updateTaskStatus } = context;
  const urgency = task.urgency || 'low';
  
  const handleToggleComplete = () => {
    const newStatus = task.status.current === 'completed' ? 'in_progress' : 'completed';
    updateTaskStatus(task.id, {
      current: newStatus,
      progress: newStatus === 'completed' ? 100 : 50,
      lastUpdated: new Date().toISOString()
    });
  };
  
  const handleDeleteTask = () => {
    if (isConfirmingDelete) {
      onDelete();
      setIsConfirmingDelete(false);
    } else {
      setIsConfirmingDelete(true);
      
      // Reset confirmation state after 3 seconds
      setTimeout(() => {
        setIsConfirmingDelete(false);
      }, 3000);
    }
  };
  
  return (
    <div className={`card border ${
      task.status.current === 'completed' 
        ? 'border-success-200 bg-success-50' 
        : isOverdue(task.dueDate)
          ? 'border-error-200 bg-error-50'
          : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start">
            <button 
              onClick={handleToggleComplete}
              className={`flex-shrink-0 h-5 w-5 rounded border ${
                task.status.current === 'completed' 
                  ? 'bg-success-500 border-success-500 text-white' 
                  : 'border-gray-300 bg-white'
              } flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3 mt-1`}
              aria-label={task.status.current === 'completed' ? "Mark as incomplete" : "Mark as complete"}
            >
              {task.status.current === 'completed' && <Check size={14} />}
            </button>
            
            <div className="flex-1">
              <h3 className={`text-base font-medium ${
                task.status.current === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>{task.title}</h3>
              
              {showProposalLink && (
                <Link 
                  to={`/proposals/${task.proposalId}`} 
                  className="text-sm text-primary-600 hover:text-primary-800 block mt-1"
                >
                  {task.title}
                </Link>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{task.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UrgencyBadge urgency={urgency} />
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {formatDate(task.dueDate)}
                    {isOverdue(task.dueDate) && !task.completed && (
                      <AlertTriangle size={12} className="inline ml-1 text-error-500" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button 
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100"
            title="Edit task"
          >
            <Edit size={16} />
          </button>
          
          <button 
            onClick={handleDeleteTask}
            className={`p-1 rounded-full ${
              isConfirmingDelete 
                ? 'text-white bg-error-500 hover:bg-error-600' 
                : 'text-gray-500 hover:text-error-600 hover:bg-gray-100'
            }`}
            title={isConfirmingDelete ? "Confirm delete" : "Delete task"}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;