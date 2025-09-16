import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import { format } from 'date-fns';
import { cn } from '../lib/utils.js';

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

// Status options
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
];

// Helper function to generate unique IDs for form fields
const useUniqueId = (prefix = '') => {
  const idRef = useRef(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return idRef.current;
};

// Form validation function
const validateForm = (formData) => {
  const errors = {};
  
  // Required fields
  if (!formData.title?.trim()) {
    errors.title = 'Title is required';
  }
  
  // Date validations
  if (formData.dueDate) {
    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(dueDate.getTime())) {
      errors.dueDate = 'Invalid date format';
    } else if (dueDate < today) {
      errors.dueDate = 'Due date cannot be in the past';
    }
  }
  
  // Description length validation
  if (formData.description && formData.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }
  
  return errors;
};

const TaskForm = ({ onClose, proposalId, editingTaskId, onTaskSaved }) => {
  const { addTask, updateTask, getTask, generateUUID } = useProposalContext();
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    dueDate: '',
    assignee: '',
    priority: 'medium',
    status: 'not_started',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'currentUser', // This would come from auth context in a real app
    tags: [],
    attachments: [],
    comments: [],
    timeEstimate: 0, // in minutes
    timeSpent: 0, // in minutes
    subtasks: []
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState({
    priority: false,
    status: false,
    assignee: false
  });
  
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleInputRef = useRef(null);
  
  // Generate unique IDs for form fields
  const titleId = useUniqueId('task-title');
  const descriptionId = useUniqueId('task-description');
  const dueDateId = useUniqueId('task-due-date');
  const ownerId = useUniqueId('task-owner');
  const urgencyId = useUniqueId('task-urgency');
  
  // Focus management for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trap focus inside the modal
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the first focusable element when modal opens
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // If editing an existing task, load its data
  useEffect(() => {
    const loadTask = async () => {
      if (editingTaskId && getTask) {
        try {
          const task = await getTask(editingTaskId);
          if (task) {
            setFormData({
              ...task,
              dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : '',
              status: task.status?.current || 'not_started',
              priority: task.priority || 'medium',
              assignee: task.assignee || '',
              description: task.description || '',
              updatedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error loading task:', error);
        }
      } else {
        // Reset form for new task
        setFormData({
          id: generateUUID ? generateUUID() : `temp-${Date.now()}`,
          title: '',
          description: '',
          dueDate: '',
          assignee: '',
          priority: 'medium',
          status: 'not_started',
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'currentUser',
          tags: [],
          attachments: [],
          comments: [],
          timeEstimate: 0,
          timeSpent: 0,
          subtasks: []
        });
      }
    };
    
    loadTask();
  }, [editingTaskId, getTask, generateUUID]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm(formData);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) {
      // Focus the first field with an error
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.focus();
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const taskData = {
        ...formData,
        proposalId,
        updatedAt: new Date().toISOString()
      };

      if (editingTaskId && updateTask) {
        await updateTask(taskData);
      } else if (addTask) {
        await addTask(taskData);
      }
      
      // Notify parent component that task was saved
      if (onTaskSaved) {
        onTaskSaved(taskData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({
        ...errors,
        submit: 'Failed to save task. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle select field changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If status is set to completed, mark as completed
    if (name === 'status' && value === 'completed') {
      setFormData(prev => ({
        ...prev,
        completed: true
      }));
    }
  };
  
  // Toggle dropdown
  const toggleDropdown = (name) => {
    setIsOpen(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    const formattedDate = date ? format(new Date(date), 'yyyy-MM-dd') : '';
    setFormData(prev => ({
      ...prev,
      dueDate: formattedDate
    }));
  };

  // Get the selected priority and status objects
  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === formData.priority) || PRIORITY_OPTIONS[1];
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === formData.status) || STATUS_OPTIONS[0];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
      ref={modalRef}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <h2 id="task-form-title" className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingTaskId ? 'Edit Task' : 'Create New Task'}
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg p-1.5"
              aria-label="Close dialog"
              ref={closeButtonRef}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {/* Title Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              {errors.title && (
                <span className="text-sm text-red-600 dark:text-red-400" id="title-error">
                  {errors.title}
                </span>
              )}
            </div>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                errors.title ? 'border-red-500' : 'border-gray-300',
                "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              )}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? `${titleId}-error` : undefined}
              placeholder="Enter task title"
              ref={titleInputRef}
              autoComplete="off"
              required
              aria-required="true"
            />
            {errors.title && (
              <p id={`${titleId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center" role="alert">
                <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              {errors.description && (
                <span className="text-sm text-red-600 dark:text-red-400" id="description-error">
                  {errors.description}
                </span>
              )}
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
                errors.description ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="Enter task description"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center" role="alert">
                <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Form Grid for Priority, Status, and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Priority Selector */}
            <div className="relative">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('priority')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 border rounded-md shadow-sm text-left",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                    isOpen.priority ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300"
                  )}
                  aria-haspopup="listbox"
                  aria-expanded={isOpen.priority}
                  aria-labelledby="priority-label"
                >
                  <div className="flex items-center">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${selectedPriority.color.split(' ')[0]}`} />
                    <span>{selectedPriority.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </button>

                {isOpen.priority && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg">
                    <ul
                      className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                      tabIndex={-1}
                      role="listbox"
                      aria-labelledby="priority-label"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <li
                          key={option.value}
                          className="text-gray-900 dark:text-gray-100 select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            handleSelectChange('priority', option.value);
                            toggleDropdown('priority');
                          }}
                          role="option"
                          aria-selected={option.value === formData.priority}
                        >
                          <div className="flex items-center">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${option.color.split(' ')[0]}`} />
                            <span className="font-normal block truncate">{option.label}</span>
                          </div>
                          {option.value === formData.priority && (
                            <span className="text-blue-600 dark:text-blue-400 absolute inset-y-0 right-0 flex items-center pr-4">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Status Selector */}
            <div className="relative">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('status')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 border rounded-md shadow-sm text-left",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                    isOpen.status ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300"
                  )}
                  aria-haspopup="listbox"
                  aria-expanded={isOpen.status}
                  aria-labelledby="status-label"
                >
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedStatus.color}`}>
                      {selectedStatus.label}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </button>

                {isOpen.status && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg">
                    <ul
                      className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                      tabIndex={-1}
                      role="listbox"
                      aria-labelledby="status-label"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <li
                          key={option.value}
                          className="text-gray-900 dark:text-gray-100 select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            handleSelectChange('status', option.value);
                            toggleDropdown('status');
                          }}
                          role="option"
                          aria-selected={option.value === formData.status}
                        >
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
                              {option.label}
                            </span>
                          </div>
                          {option.value === formData.status && (
                            <span className="text-blue-600 dark:text-blue-400 absolute inset-y-0 right-0 flex items-center pr-4">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Due Date Picker */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="date"
                  name="dueDate"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className={cn(
                    "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                    errors.dueDate ? 'border-red-500' : 'border-gray-300'
                  )}
                  aria-invalid={!!errors.dueDate}
                  aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center" role="alert">
                  <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                  {errors.dueDate}
                </p>
              )}
            </div>
          </div>

          {/* Assignee Field */}
          <div>
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assignee
                </label>
                {errors.assignee && (
                  <span className="text-sm text-red-600 dark:text-red-400" id="assignee-error">
                    {errors.assignee}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  className={cn(
                    "w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                    errors.assignee ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="Search team members..."
                  aria-invalid={!!errors.assignee}
                  aria-describedby={errors.assignee ? 'assignee-error' : undefined}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
              {errors.assignee && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center" role="alert">
                  <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                  {errors.assignee}
                </p>
              )}
            </div>

            {/* Time Estimate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="timeEstimate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Estimate (hours)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="timeEstimate"
                    name="timeEstimate"
                    min="0"
                    step="0.5"
                    value={formData.timeEstimate || ''}
                    onChange={handleChange}
                    className={cn(
                      "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
                      "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                      errors.timeEstimate ? 'border-red-500' : 'border-gray-300'
                    )}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="timeSpent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Spent (hours)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="timeSpent"
                    name="timeSpent"
                    min="0"
                    step="0.5"
                    value={formData.timeSpent || ''}
                    onChange={handleChange}
                    className={cn(
                      "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
                      "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                      errors.timeSpent ? 'border-red-500' : 'border-gray-300'
                    )}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>
            {errors.description && (
              <p id={`${descriptionId}-error`} className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={dueDateId} className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id={dueDateId}
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-invalid={!!errors.dueDate}
                aria-describedby={errors.dueDate ? `${dueDateId}-error` : undefined}
              />
            </div>
            {errors.dueDate && (
              <p id={`${dueDateId}-error`} className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                {errors.dueDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={ownerId} className="block text-sm font-medium text-gray-700 mb-1">
              Owner
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id={ownerId}
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter owner name"
              />
            </div>
          </div>

          <div>
            <label htmlFor={urgencyId} className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <select
              id={urgencyId}
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              aria-describedby={`${urgencyId}-help`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <p id={`${urgencyId}-help`} className="mt-1 text-xs text-gray-500">
              Set the priority level for this task
            </p>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {editingTaskId && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                      try {
                        setIsSubmitting(true);
                        await onDeleteTask(editingTaskId);
                        onClose();
                      } catch (error) {
                        console.error('Error deleting task:', error);
                        setErrors({
                          ...errors,
                          submit: 'Failed to delete task. Please try again.'
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Delete Task
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                disabled={isSubmitting || Object.keys(errors).length > 0}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{editingTaskId ? 'Saving...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} className="text-white" aria-hidden="true" />
                    <span>{editingTaskId ? 'Update Task' : 'Create Task'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {errors.submit && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {errors.submit}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

TaskForm.propTypes = {
  /** Function to close the form */
  onClose: PropTypes.func.isRequired,
  /** ID of the proposal this task belongs to */
  proposalId: PropTypes.string.isRequired,
  /** ID of the task being edited (if in edit mode) */
  editingTaskId: PropTypes.string,
  /** Callback when a task is successfully saved */
  onTaskSaved: PropTypes.func,
  /** Callback to delete a task */
  onDeleteTask: PropTypes.func,
};

export default TaskForm;
