import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Calendar,
  Check,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Task } from '../types';
import { formatDate, isOverdue } from '../utils/dateUtils';
import { useProposalContext } from '../contexts/ProposalContext';

interface TaskCardProps {
  task: Task;
  proposalTitle?: string;
  showProposalLink?: boolean;
}

const TaskCard = ({ 
  task, 
  proposalTitle, 
  showProposalLink = false 
}: TaskCardProps) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { updateTask, deleteTask } = useProposalContext();
  
  const handleToggleComplete = () => {
    updateTask(task.proposalId, task.id, { completed: !task.completed });
  };
  
  const handleDeleteTask = () => {
    if (isConfirmingDelete) {
      deleteTask(task.proposalId, task.id);
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
      task.completed 
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
                task.completed 
                  ? 'bg-success-500 border-success-500 text-white' 
                  : 'border-gray-300 bg-white'
              } flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3 mt-1`}
              aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
            >
              {task.completed && <Check size={14} />}
            </button>
            
            <div className="flex-1">
              <h3 className={`text-base font-medium ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>{task.title}</h3>
              
              {showProposalLink && proposalTitle && (
                <Link 
                  to={`/proposals/${task.proposalId}`} 
                  className="text-sm text-primary-600 hover:text-primary-800 block mt-1"
                >
                  {proposalTitle}
                </Link>
              )}
              
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <User size={14} className="mr-1" />
                <span>{task.owner}</span>
              </div>
              
              <div className="flex items-center text-sm mt-1">
                <Calendar size={14} className={`mr-1 ${
                  isOverdue(task.dueDate) && !task.completed ? 'text-error-500' : 'text-gray-600'
                }`} />
                <span className={`${
                  isOverdue(task.dueDate) && !task.completed ? 'text-error-600 font-medium' : 'text-gray-600'
                }`}>
                  {formatDate(task.dueDate)}
                  {isOverdue(task.dueDate) && !task.completed && (
                    <AlertTriangle size={12} className="inline ml-1 text-error-500" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <Link 
            to={`/proposals/${task.proposalId}?editTask=${task.id}`}
            className="p-1 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100"
            title="Edit task"
          >
            <Edit size={16} />
          </Link>
          
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