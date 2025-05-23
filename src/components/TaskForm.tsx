import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Proposal } from '../types';
import { useProposalContext } from '../contexts/ProposalContext';

interface TaskFormProps {
  proposalId: string;
  taskId?: string;
  onClose: () => void;
}

const TaskForm = ({ proposalId, taskId, onClose }: TaskFormProps) => {
  const { getProposal, addTask, updateTask } = useProposalContext();
  const proposal = getProposal(proposalId) as Proposal | undefined;
  const existingTask = taskId ? proposal?.tasks.find(t => t.id === taskId) : undefined;
  
  const [title, setTitle] = useState(existingTask?.title || '');
  const [owner, setOwner] = useState(existingTask?.owner || '');
  const [dueDate, setDueDate] = useState(existingTask?.dueDate ? new Date(existingTask.dueDate).toISOString().slice(0, 10) : '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Set focus on the title input when the form is displayed
    const titleInput = document.getElementById('task-title');
    if (titleInput) {
      titleInput.focus();
    }
  }, []);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!owner.trim()) {
      newErrors.owner = 'Owner is required';
    }
    
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const taskData = {
      title,
      owner,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(), // Set to noon on the selected date
      description,
      completed: existingTask?.completed || false,
    };
    
    if (taskId && existingTask) {
      updateTask(proposalId, taskId, taskData);
    } else {
      addTask(proposalId, taskData);
    }
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-modal w-full max-w-md mx-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">
            {existingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className="form-label">Task Title</label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`form-input ${errors.title ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="e.g., Write Executive Summary"
              />
              {errors.title && <p className="text-error-500 text-sm mt-1">{errors.title}</p>}
            </div>
            
            <div>
              <label htmlFor="task-owner" className="form-label">Assigned To</label>
              <input
                id="task-owner"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className={`form-input ${errors.owner ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="e.g., John Smith"
              />
              {errors.owner && <p className="text-error-500 text-sm mt-1">{errors.owner}</p>}
            </div>
            
            <div>
              <label htmlFor="task-due-date" className="form-label">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`form-input ${errors.dueDate ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.dueDate && <p className="text-error-500 text-sm mt-1">{errors.dueDate}</p>}
            </div>
            
            <div>
              <label htmlFor="task-description" className="form-label">Description (Optional)</label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Add any additional details about this task..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {existingTask ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;