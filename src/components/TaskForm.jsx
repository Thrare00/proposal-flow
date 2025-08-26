import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';

// Helper function to generate unique IDs for form fields
const useUniqueId = (prefix = '') => {
  const idRef = useRef(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return idRef.current;
};

// Form validation function
const validateForm = (formData) => {
  const errors = {};
  if (!formData.title.trim()) {
    errors.title = 'Title is required';
  }
  if (formData.dueDate && new Date(formData.dueDate) < new Date().setHours(0, 0, 0, 0)) {
    errors.dueDate = 'Due date cannot be in the past';
  }
  return errors;
};

const TaskForm = ({ onClose, proposalId, editingTaskId }) => {
  const { addTask, updateTask, getTask, generateUUID } = useProposalContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    owner: '',
    urgency: 'low',
    status: { current: 'in_progress' }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  
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
    if (editingTaskId && getTask) {
      const task = getTask(editingTaskId);
      if (task) {
        setFormData({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          status: { current: task.status.current }
        });
      }
    }
  }, [editingTaskId, getTask]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm(formData);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) {
      // Focus the first field with an error
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.getElementById(`${firstErrorField}-error`);
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
        id: editingTaskId || (generateUUID ? generateUUID() : `temp-${Date.now()}`),
        createdAt: new Date().toISOString()
      };

      if (editingTaskId && updateTask) {
        await updateTask(taskData);
      } else if (addTask) {
        await addTask(taskData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      // In a real app, you might want to show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'urgency' ? value : 
              name === 'status' ? { current: value } : 
              value
    }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
      ref={modalRef}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="task-form-title" className="text-xl font-semibold">
            {editingTaskId ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button 
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-1 rounded"
            aria-label="Close dialog"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor={titleId} className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id={titleId}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? `${titleId}-error` : undefined}
            />
            {errors.title && (
              <p id={`${titleId}-error`} className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                <AlertCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={descriptionId} className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id={descriptionId}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
            />
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

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="text-white" aria-hidden="true" />
                  <span>Save Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
