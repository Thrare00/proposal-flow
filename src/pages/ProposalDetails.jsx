import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle,
  Download,
  Building,
  Clock
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import { getStatusName, getStatusColor, getNextStatus, getPreviousStatus } from '../utils/statusUtils.js';
import { formatDate, getUrgencyLevel, getUrgencyColor, isOverdue } from '../utils/dateUtils.js';
import { format, parseISO } from 'date-fns';
import { URGENCY_LEVELS } from '../types/index.js';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';
import { generateUUID } from '../utils/uuidUtils.js';

const ProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const context = useProposalContext();
  const { getProposal, updateProposalStatus, updateProposal } = context;
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(undefined);
  const [newFile, _] = useState(null);
  
  // Get the proposal
  const proposal = id ? getProposal(id) : undefined;
  
  // Check if there's a task to edit from the query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get('editTask');
    
    if (taskId) {
      setEditingTaskId(taskId);
      setShowTaskForm(true);
      
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);
  
  // Redirect if proposal not found
  useEffect(() => {
    if (id && !proposal) {
      navigate('/dashboard');
    }
  }, [id, proposal, navigate]);
  
  if (!proposal) {
    return <div>Loading...</div>;
  }
  
  const urgencyLevel = getUrgencyLevel(proposal.dueDate);
  const urgencyColorClass = getUrgencyColor(urgencyLevel);
  const statusColorClass = getStatusColor(proposal.status);
  
  const handleStatusChange = (direction) => {
    const newStatus = direction === 'next' 
      ? getNextStatus(proposal.status)
      : getPreviousStatus(proposal.status);
      
    if (newStatus) {
      updateProposalStatus(proposal.id, newStatus);
    }
  };
  
  const addTask = () => {
    setEditingTaskId(undefined);
    setShowTaskForm(true);
  };
  
  const closeTaskForm = () => {
    setShowTaskForm(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onload = () => {
        const newFile = {
          id: generateUUID(),
          filename: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          createdAt: new Date().toISOString()
        };
        
        updateProposal(proposal.id, {
          files: [...(proposal.files || []), newFile]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteFile = (fileId) => {
    if (proposal.files) {
      const updatedFiles = proposal.files.filter(file => file.id !== fileId);
      updateProposal(proposal.id, {
        files: updatedFiles
      });
    }
  };

  const handleEditTask = (taskId) => {
    setEditingTaskId(taskId);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = proposal.tasks.filter(task => task.id !== taskId);
      updateProposal(proposal.id, {
        tasks: updatedTasks
      });
    }
  };

  // Sort tasks - incomplete first (ordered by due date), then completed
  const sortedTasks = [...proposal.tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-800 flex items-center">
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
      
      <div className="bg-white shadow-card rounded-lg overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <h1 className="text-2xl font-bold mr-4">{proposal.title}</h1>
              <Link 
                to={`/proposals/${proposal.id}/edit`}
                className="btn btn-secondary flex items-center space-x-2 self-start mt-2 sm:mt-0"
              >
                <Edit size={18} />
                <span>Edit Proposal</span>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4">
              <div className="flex items-center text-gray-600">
                <Building size={18} className="mr-2" />
                <span>{proposal.agency}</span>
              </div>
              
              <div className="flex items-center">
                <Clock size={18} className={`mr-2 ${isOverdue(proposal.dueDate) ? 'text-error-500' : 'text-gray-600'}`} />
                <span className={`${isOverdue(proposal.dueDate) ? 'text-error-600 font-medium' : 'text-gray-600'}`}>
                  {isOverdue(proposal.dueDate) ? 'Overdue: ' : 'Due: '}
                  {formatDate(proposal.dueDate)}
                  {isOverdue(proposal.dueDate) && (
                    <AlertTriangle size={14} className="inline ml-1 text-error-500" />
                  )}
                </span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Clock size={18} className="mr-2" />
                <span className={`${urgencyColorClass} px-2 py-0.5 rounded-full text-sm`}>
                  {urgencyLevel === 'critical' && isOverdue(proposal.dueDate) 
                    ? `Overdue: ${Math.abs(daysUntilDue)} days ago` 
                    : urgencyLevel === 'critical' 
                      ? `Due in ${daysUntilDue} days`
                      : urgencyLevel === 'high' 
                        ? `Due in ${daysUntilDue} days`
                        : `Due in ${daysUntilDue} days`}
                </span>
              </div>
            </div>
            
            {proposal.notes && (
              <div className="flex items-start mt-4">
                <FileText size={18} className="mr-2 text-gray-600 flex-shrink-0 mt-1" />
                <div className="bg-gray-50 p-3 rounded-md text-gray-700 flex-1">
                  {proposal.notes}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Status change section */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <span className="text-sm text-gray-500 block mb-2">Current Status</span>
              <span className={`badge ${statusColorClass} text-sm px-3 py-1`}>
                {getStatusName(proposal.status)}
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusChange('previous')}
                disabled={!getPreviousStatus(proposal.status)}
                className={`btn flex items-center space-x-1 ${
                  getPreviousStatus(proposal.status)
                    ? 'btn-secondary'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              
              <button
                onClick={() => handleStatusChange('next')}
                disabled={!getNextStatus(proposal.status)}
                className={`btn flex items-center space-x-1 ${
                  getNextStatus(proposal.status)
                    ? 'btn-primary'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Files section */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden mb-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold flex items-center">
            <span className="mr-2">Folder:</span>
            <span className="text-primary-700">{proposal.title}</span>
          </h2>
          <label className="btn btn-primary flex items-center space-x-2 cursor-pointer mb-0">
            <Plus size={18} />
            <span>Add File</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
        
        <div className="p-6">
          {proposal.files && proposal.files.length > 0 ? (
            <div className="space-y-2">
              {proposal.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded px-4 py-2">
                  <div className="flex items-center">
                    <FileText size={18} className="mr-2 text-primary-600" />
                    <span className="font-medium text-gray-800 mr-4">{file.filename}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="btn btn-sm btn-secondary flex items-center space-x-2"
                    >
                      <Download size={18} className="mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText size={48} className="mx-auto mb-2" />
              <div>No files have been added yet.</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tasks section */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Tasks</h2>
          <button 
            onClick={addTask}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>
        <div className="p-6">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showProposalLink={true}
              onEdit={() => handleEditTask(task.id)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Task form modal */}
      {showTaskForm && (
        <TaskForm 
          proposalId={proposal.id} 
          taskId={editingTaskId}
          onClose={closeTaskForm} 
        />
      )}
    </div>
  );
};

export default ProposalDetails;