import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
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
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  FileCode,
  FileAudio,
  FileVideo,
  File,
  MoreHorizontal,
  Check,
  User,
  Calendar
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import { 
  getStatusName, 
  getStatusColor, 
  getNextStatus, 
  getPreviousStatus,
  STATUS_OPTIONS
} from '../utils/statusUtils.js';
import { 
  formatDate, 
  getUrgencyLevel, 
  getUrgencyColor, 
  getUrgencyBorderColor,
  isOverdue,
  getDaysUntilDue
} from '../utils/dateUtils.js';
import { generateUUID } from '../utils/uuid.js';
import { formatFileSize } from '../utils/formatUtils.js';
import { useToast } from '../hooks/useToast.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Separator } from '../components/ui/Separator.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Checkbox } from '../components/ui/Checkbox.jsx';
import { Avatar, AvatarFallback } from '../components/ui/Avatar.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/DropdownMenu.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';

/**
 * Displays detailed information about a proposal including status, files, and tasks
 * @returns {JSX.Element} The rendered component
 */
const ProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const context = useProposalContext();
  const { 
    getProposal, 
    updateProposalStatus, 
    updateProposal,
    isLoading: isProposalLoading,
    error: proposalError
  } = context;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  
  // Get the proposal with error handling
  const proposal = id ? getProposal(id) : undefined;
  
  // Calculate task statistics - defined later in the file
    if (!fileType) return <File size={20} className="text-gray-400" />;
    
    const type = fileType.split('/')[0];
    const extension = fileType.split('/').pop();
    
    const iconProps = { className: 'h-5 w-5 text-gray-400' };
    
    switch (type) {
      case 'image':
        return <FileImage {...iconProps} />;
      case 'video':
        return <FileVideo {...iconProps} />;
      case 'audio':
        return <FileAudio {...iconProps} />;
      case 'application':
        if (['pdf'].includes(extension)) return <FileText {...iconProps} />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return <FileArchive {...iconProps} />;
        if (['xls', 'xlsx', 'csv'].includes(extension)) return <FileSpreadsheet {...iconProps} />;
        return <FileCode {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };
  
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
  
  // Handle loading and error states
  useEffect(() => {
    const loadProposal = async () => {
      try {
        setIsLoading(true);
        
        if (id && !proposal && !isProposalLoading) {
          // If we have an ID but no proposal, try to load it
          const loadedProposal = getProposal(id);
          if (!loadedProposal) {
            throw new Error('Proposal not found');
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading proposal:', err);
        setError(err.message || 'Failed to load proposal');
        addToast({
          title: 'Error',
          description: 'Failed to load proposal details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProposal();
  }, [id, proposal, isProposalLoading, getProposal, addToast]);
  
  // Redirect if proposal not found
  useEffect(() => {
    if (!isLoading && !proposal && !isProposalLoading && id) {
      addToast({
        title: 'Not Found',
        description: 'The requested proposal could not be found',
        variant: 'destructive'
      });
      navigate('/dashboard');
    }
  }, [proposal, isLoading, isProposalLoading, id, navigate, addToast]);
  
  // Show loading state
  if (isLoading || isProposalLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || proposalError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-error-50 border-l-4 border-error-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-error-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-error-700">
                {error || proposalError || 'An unknown error occurred'}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }
  
  if (!proposal) {
    return null; // Should be caught by the redirect effect
  }
  
  const urgencyLevel = getUrgencyLevel(proposal.dueDate);
  const urgencyColorClass = getUrgencyColor(urgencyLevel);
  const urgencyBorderClass = getUrgencyBorderColor(urgencyLevel);
  const statusColorClass = getStatusColor(proposal.status);
  const daysUntilDue = getDaysUntilDue(proposal.dueDate);
  const isProposalOverdue = isOverdue(proposal.dueDate);
  
  const handleStatusChange = useCallback(async (direction) => {
    try {
      setIsSubmitting(true);
      const action = direction === 'next' ? 'next' : 'previous';
      setEditingTaskId(`status-${action}`);
      
      const newStatus = direction === 'next' 
        ? getNextStatus(proposal.status)
        : getPreviousStatus(proposal.status);
        
      if (!newStatus) return;
      
      await updateProposalStatus(proposal.id, newStatus);
      
      addToast({
        title: 'Status Updated',
        description: `Proposal status changed to ${getStatusName(newStatus)}`,
        variant: 'default'
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast({
        title: 'Update Failed',
        description: 'Failed to update proposal status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setEditingTaskId(undefined);
    }
  }, [proposal.id, proposal.status, updateProposalStatus, addToast]);
  
  // Function declarations moved to their respective sections
    if (!fileType) return <File className="h-5 w-5 text-gray-400" />;
    
    const type = fileType.split('/')[0];
    const extension = fileType.split('/').pop();
    
    const iconProps = { className: 'h-5 w-5 text-gray-400' };
    
    switch (type) {
      case 'image':
        return <FileImage {...iconProps} />;
      case 'video':
        return <FileVideo {...iconProps} />;
      case 'audio':
        return <FileAudio {...iconProps} />;
      case 'application':
        if (['pdf'].includes(extension)) return <FileText {...iconProps} />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return <FileArchive {...iconProps} />;
        if (['xls', 'xlsx', 'csv'].includes(extension)) return <FileSpreadsheet {...iconProps} />;
        if (['doc', 'docx'].includes(extension)) return <FileText {...iconProps} />;
        if (['ppt', 'pptx'].includes(extension)) return <FilePieChart {...iconProps} />;
        if (['json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx'].includes(extension)) return <FileCode {...iconProps} />;
        return <File {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Check file size (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      addToast({
        title: 'File too large',
        description: `Some files exceed the maximum size of ${formatFileSize(MAX_FILE_SIZE)}`,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsFileUploading(true);
      
      // Process each file
      const newFiles = await Promise.all(files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            resolve({
              id: generateUUID(),
              filename: file.name,
              type: file.type,
              size: file.size,
              url: URL.createObjectURL(file),
              createdAt: new Date().toISOString(),
              uploadProgress: 100,
              status: 'completed'
            });
          };
          
          reader.onerror = () => {
            resolve({
              id: generateUUID(),
              filename: file.name,
              type: file.type,
              size: file.size,
              error: 'Failed to read file',
              status: 'error'
            });
          };
          
          // Simulate upload progress
          setTimeout(() => {
            reader.readAsDataURL(file);
          }, 500);
        });
      }));
      
      // Update proposal with new files
      await updateProposal(proposal.id, {
        files: [...(proposal.files || []), ...newFiles]
      });
      
      addToast({
        title: 'Files uploaded',
        description: `Successfully uploaded ${newFiles.length} file(s)`,
        variant: 'default'
      });
      
    } catch (err) {
      console.error('Error uploading files:', err);
      addToast({
        title: 'Upload failed',
        description: 'Failed to upload one or more files',
        variant: 'destructive'
      });
    } finally {
      setIsFileUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!proposal.files) return;
    
    try {
      const fileToDelete = proposal.files.find(f => f.id === fileId);
      if (!fileToDelete) return;
      
      // Show confirmation dialog
      if (!window.confirm(`Are you sure you want to delete "${fileToDelete.filename}"?`)) {
        return;
      }
      
      const updatedFiles = proposal.files.filter(file => file.id !== fileId);
      
      await updateProposal(proposal.id, {
        files: updatedFiles
      });
      
      addToast({
        title: 'File deleted',
        description: `"${fileToDelete.filename}" has been removed`,
        variant: 'default'
      });
      
    } catch (err) {
      console.error('Error deleting file:', err);
      addToast({
        title: 'Delete failed',
        description: 'Failed to delete the file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleEditTask = (taskId) => {
    setEditingTaskId(taskId);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = proposal.tasks?.find(t => t.id === taskId);
    if (!taskToDelete) return;
    
    try {
      if (!window.confirm(`Are you sure you want to delete the task "${taskToDelete.title}"?`)) {
        return;
      }
      
      const updatedTasks = proposal.tasks.filter(task => task.id !== taskId);
      
      await updateProposal(proposal.id, {
        tasks: updatedTasks
      });
      
      addToast({
        title: 'Task deleted',
        description: `"${taskToDelete.title}" has been removed`,
        variant: 'default'
      });
      
    } catch (err) {
      console.error('Error deleting task:', err);
      addToast({
        title: 'Delete failed',
        description: 'Failed to delete the task. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Toggle task completion status
  const handleTaskToggle = async (taskId, completed) => {
    try {
      const updatedTasks = proposal.tasks.map(task => 
        task.id === taskId ? { ...task, completed } : task
      );
      
      await updateProposal(proposal.id, {
        tasks: updatedTasks
      });
      
      const task = proposal.tasks.find(t => t.id === taskId);
      if (task) {
        addToast({
          title: `Task ${completed ? 'completed' : 'marked incomplete'}`,
          description: `"${task.title}" has been ${completed ? 'completed' : 'marked as incomplete'}`,
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      addToast({
        title: 'Update failed',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Task form handlers - defined later in the file

  // Sort tasks - incomplete first (ordered by due date), then completed
  const sortedTasks = useMemo(() => {
    if (!proposal.tasks) return [];
    
    return [...proposal.tasks].sort((a, b) => {
      // Incomplete tasks first
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      
      // Then sort by due date (ascending)
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
      
      // If due dates are the same, sort by title
      if (dateA.getTime() === dateB.getTime()) {
        return (a.title || '').localeCompare(b.title || '');
      }
      
      return dateA.getTime() - dateB.getTime();
    });
  }, [proposal.tasks]);
  
  // Calculate task completion stats
  const taskStats = useMemo(() => {
    if (!proposal?.tasks?.length) return { total: 0, completed: 0, percent: 0 };
    
    const total = proposal.tasks.length;
    const completed = proposal.tasks.filter(t => t.completed).length;
    const percent = Math.round((completed / total) * 100) || 0;
    
    return { total, completed, percent };
  }, [proposal.tasks]);
  
  // Determine if the proposal is in a final state
  const isFinalState = useMemo(() => {
    const finalStatuses = ['submitted', 'awarded', 'rejected', 'withdrawn'];
    return finalStatuses.includes(proposal.status);
  }, [proposal.status]);

  // Format due date with relative time
  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return formatDate(dateString, 'MMM d, yyyy');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Button 
          asChild 
          variant="ghost" 
          className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
        >
          <Link to="/dashboard" className="flex items-center">
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Dashboard</span>
          </Link>
        </Button>
      </div>
      
      {/* Main Proposal Card */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
              {proposal.referenceNumber && (
                <p className="text-sm text-gray-500 mt-1">
                  Ref: {proposal.referenceNumber}
                </p>
              )}
            </div>
            <Button asChild variant="outline" className="self-start sm:self-center">
              <Link to={`/proposals/${proposal.id}/edit`}>
                <Edit size={16} className="mr-2" />
                Edit Proposal
              </Link>
            </Button>
          </div>
          
          {/* Status and urgency badges */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className={`${statusColorClass} text-sm`}>
              {getStatusName(proposal.status)}
            </Badge>
            
            <Badge variant="outline" className={`${urgencyBorderClass} text-sm`}>
              {isProposalOverdue 
                ? `Overdue: ${Math.abs(daysUntilDue)} days`
                : `Due in ${daysUntilDue} days`}
              {isProposalOverdue && (
                <AlertTriangle size={14} className="ml-1" />
              )}
            </Badge>
            
            {proposal.opportunityType && (
              <Badge variant="secondary" className="text-sm">
                {proposal.opportunityType}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-6">
          {/* Main info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Agency/Client */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Agency/Client</h3>
              <div className="flex items-center">
                <Building size={18} className="text-gray-400 mr-2" />
                <p className="text-gray-900">{proposal.agency || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Due Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
              <div className="flex items-center">
                <Clock size={18} className={`mr-2 ${
                  isProposalOverdue ? 'text-error-500' : 'text-gray-400'
                }`} />
                <p className={`${
                  isProposalOverdue ? 'text-error-600 font-medium' : 'text-gray-900'
                }`}>
                  {formatDueDate(proposal.dueDate)}
                  {isProposalOverdue && (
                    <span className="ml-1 text-error-500">(Overdue)</span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Budget */}
            {proposal.budget && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Budget</h3>
                <p className="text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: proposal.currency || 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(proposal.budget)}
                </p>
              </div>
            )}
            
            {/* Contact */}
            {proposal.contactName && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Contact</h3>
                <p className="text-gray-900">{proposal.contactName}</p>
                {proposal.contactEmail && (
                  <a 
                    href={`mailto:${proposal.contactEmail}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    {proposal.contactEmail}
                  </a>
                )}
                {proposal.contactPhone && (
                  <p className="text-gray-600 text-sm">{proposal.contactPhone}</p>
                )}
              </div>
            )}
            
            {/* Submission Date */}
            {proposal.submissionDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {isFinalState ? 'Submitted On' : 'Expected Submission'}
                </h3>
                <p className="text-gray-900">
                  {formatDate(proposal.submissionDate, 'Not specified')}
                </p>
              </div>
            )}
            
            {/* Created At */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
              <p className="text-gray-900">
                {formatDate(proposal.createdAt, 'N/A')}
              </p>
            </div>
          </div>
          
          {/* Notes */}
          {proposal.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-line">
                  {proposal.notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Status change section */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Workflow Status
              </h3>
              <div className="flex items-center">
                <span className={`${statusColorClass} px-3 py-1 rounded-full text-sm font-medium`}>
                  {getStatusName(proposal.status)}
                </span>
                
                {/* Status progress indicator */}
                <div className="hidden md:flex items-center ml-6">
                  {STATUS_OPTIONS.map((status, index) => (
                    <React.Fragment key={status.value}>
                      {index > 0 && (
                        <div className={`h-0.5 w-8 ${
                          index <= STATUS_OPTIONS.findIndex(s => s.value === proposal.status) 
                            ? 'bg-primary-500' 
                            : 'bg-gray-200'
                        }`} />
                      )}
                      <div 
                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          index <= STATUS_OPTIONS.findIndex(s => s.value === proposal.status)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index < STATUS_OPTIONS.findIndex(s => s.value === proposal.status) ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => handleStatusChange('previous')}
                disabled={!getPreviousStatus(proposal.status) || isSubmitting}
                variant="outline"
                className="min-w-[120px] justify-center"
              >
                {isSubmitting && editingTaskId === 'status-prev' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronLeft size={16} className="mr-1" />
                )}
                Previous
              </Button>
              
              <Button
                onClick={() => handleStatusChange('next')}
                disabled={!getNextStatus(proposal.status) || isSubmitting}
                className="min-w-[120px] justify-center"
              >
                {isSubmitting && editingTaskId === 'status-next' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <span className="mr-1">Next</span>
                )}
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Files section */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Files & Attachments</h2>
              <p className="text-sm text-gray-500 mt-1">
                {proposal.files?.length || 0} {proposal.files?.length === 1 ? 'file' : 'files'} attached
              </p>
            </div>
            <div>
              <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer">
                <Plus size={16} className="mr-2" />
                <span>Add File</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isFileUploading}
                />
              </label>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isFileUploading && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-center">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-blue-700">Uploading files, please wait...</span>
            </div>
          )}
          
          {proposal.files && proposal.files.length > 0 ? (
            <div className="space-y-2">
              {proposal.files.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="flex items-center min-w-0">
                    <div className="p-2 bg-gray-100 rounded-md mr-3">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.filename}</p>
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(file.createdAt, 'N/A')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(file.url, '_blank')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Download size={16} className="mr-1" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={16} className="mr-1" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-md">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No files yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload files to keep them organized with this proposal
              </p>
              <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer">
                <Plus size={16} className="mr-2" />
                <span>Add your first file</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isFileUploading}
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tasks section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Tasks</h2>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-500">
                  {taskStats.completed} of {taskStats.total} tasks completed
                </p>
                {taskStats.total > 0 && (
                  <div className="hidden sm:flex items-center">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${taskStats.percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{taskStats.percent}%</span>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={addTask} className="mt-2 sm:mt-0">
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {proposal.tasks && proposal.tasks.length > 0 ? (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={{
                    ...task,
                    status: {
                      current: task.completed ? 'completed' : 'in_progress',
                      progress: task.completed ? 100 : 0,
                      lastUpdated: task.updatedAt || new Date().toISOString()
                    },
                    owner: task.assignee || 'Unassigned',
                    urgency: task.priority?.toLowerCase() || 'medium',
                    dueDate: task.dueDate,
                    proposalId: proposal.id
                  }}
                  showProposalLink={false}
                  onEdit={() => handleEditTask(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-md">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add tasks to keep track of what needs to be done for this proposal
              </p>
              <Button onClick={addTask}>
                <Plus size={16} className="mr-2" />
                Add your first task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
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