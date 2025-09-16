import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, AlertTriangle, X, Check } from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';

// Confirmation Dialog Component
const ConfirmationDialog = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'default' 
}) => {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && e.ctrlKey) onConfirm();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);
  
  // Focus trap and auto-focus
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div 
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start">
          <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
            variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <AlertTriangle className={`h-6 w-6 ${variant === 'danger' ? 'text-red-600' : 'text-blue-600'}`} aria-hidden="true" />
          </div>
          <div className="ml-4">
            <h3 id="dialog-title" className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${variantClasses[variant] || variantClasses.default} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

const ProposalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProposal, addProposal, updateProposal, deleteProposal } = useProposalContext();
  
  const existingProposal = id ? getProposal(id) : undefined;
  const isEditing = !!existingProposal;
  
  const [formData, setFormData] = useState({
    title: existingProposal?.title || '',
    agency: existingProposal?.agency || '',
    dueDate: existingProposal?.dueDate 
      ? new Date(existingProposal.dueDate).toISOString().slice(0, 10)
      : '',
    status: existingProposal?.status || 'intake',
    notes: existingProposal?.notes || '',
    type: existingProposal?.type || 'federal'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formIsDirty, setFormIsDirty] = useState(false);
  const initialFormData = useRef(JSON.stringify(formData));
  
  // Track form changes
  useEffect(() => {
    const currentData = JSON.stringify(formData);
    setFormIsDirty(initialFormData.current !== currentData);
  }, [formData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.agency.trim()) {
      newErrors.agency = 'Agency is required';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // If form is not dirty, don't show confirmation
    if (!formIsDirty) {
      saveProposal();
      return;
    }
    
    // Show confirmation dialog for unsaved changes
    setShowSaveConfirm(true);
  };
  
  const saveProposal = async () => {
    setIsSubmitting(true);
    
    try {
      const proposalData = {
        title: formData.title.trim(),
        agency: formData.agency.trim(),
        dueDate: new Date(`${formData.dueDate}T12:00:00`).toISOString(),
        status: formData.status,
        type: formData.type,
        notes: formData.notes.trim(),
      };
      
      let newId;
      if (isEditing && id) {
        await updateProposal(id, proposalData);
        newId = id;
      } else {
        newId = await addProposal(proposalData);
      }
      
      // Update initial form data to match saved data
      initialFormData.current = JSON.stringify({
        ...formData,
        id: newId
      });
      
      navigate(`/proposals/${newId}`, { 
        state: { 
          message: isEditing ? 'Proposal updated successfully!' : 'Proposal created successfully!',
          variant: 'success'
        } 
      });
    } catch (error) {
      console.error('Error saving proposal:', error);
      setErrors({
        form: 'Failed to save proposal. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      setShowSaveConfirm(false);
    }
  };
  
  const confirmDelete = () => {
    if (!isEditing || !id) return;
    setShowDeleteConfirm(true);
  };
  
  const handleDelete = async () => {
    try {
      await deleteProposal(id);
      navigate('/dashboard', { 
        state: { 
          message: 'Proposal deleted successfully!',
          variant: 'success'
        } 
      });
    } catch (error) {
      console.error('Error deleting proposal:', error);
      setErrors({
        form: 'Failed to delete proposal. Please try again.'
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link 
          to={isEditing ? `/proposals/${id}` : '/dashboard'} 
          className="text-primary-600 hover:text-primary-800 flex items-center"
          state={{ fromForm: true }}
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to {isEditing ? 'Proposal Details' : 'Dashboard'}</span>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">
            {isEditing ? 'Edit Proposal' : 'New Proposal'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6" noValidate>
          {errors.form && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md" role="alert">
              {errors.form}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  errors.title ? 'border-red-300' : ''
                }`}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
                required
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600" id="title-error" role="alert">
                  {errors.title}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="agency" className="block text-sm font-medium text-gray-700">
                Agency <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="agency"
                name="agency"
                value={formData.agency}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  errors.agency ? 'border-red-300' : ''
                }`}
                aria-invalid={!!errors.agency}
                aria-describedby={errors.agency ? 'agency-error' : undefined}
                required
              />
              {errors.agency && (
                <p className="mt-2 text-sm text-red-600" id="agency-error" role="alert">
                  {errors.agency}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  errors.dueDate ? 'border-red-300' : ''
                }`}
                aria-invalid={!!errors.dueDate}
                aria-describedby={errors.dueDate ? 'duedate-error' : undefined}
                required
              />
              {errors.dueDate && (
                <p className="mt-2 text-sm text-red-600" id="duedate-error" role="alert">
                  {errors.dueDate}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                aria-label="Select proposal status"
              >
                <option value="intake">Intake</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="awarded">Awarded</option>
                <option value="not_awarded">Not Awarded</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                aria-label="Select proposal type"
              >
                <option value="federal">Federal</option>
                <option value="state">State</option>
                <option value="local">Local</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Add any additional notes or details about this proposal..."
                aria-label="Proposal notes"
              />
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={confirmDelete}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  }`}
                  aria-label="Delete proposal"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Proposal
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  if (formIsDirty) {
                    if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                      navigate(isEditing ? `/proposals/${id}` : '/dashboard');
                    }
                  } else {
                    navigate(isEditing ? `/proposals/${id}` : '/dashboard');
                  }
                }}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formIsDirty}
                className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSubmitting 
                    ? 'bg-primary-400' 
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                } ${!formIsDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {isEditing ? 'Update' : 'Create'} Proposal
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Save Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSaveConfirm}
        onConfirm={saveProposal}
        onCancel={() => setShowSaveConfirm(false)}
        title={isEditing ? 'Update Proposal' : 'Create New Proposal'}
        message={`Are you sure you want to ${isEditing ? 'update' : 'create'} this proposal?`}
        confirmText={isSubmitting ? 'Saving...' : 'Confirm'}
        variant="default"
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Proposal"
        message="Are you sure you want to delete this proposal? This action cannot be undone."
        confirmText={isSubmitting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />
      
      {/* Unsaved Changes Prompt */}
      {formIsDirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center">
                <div className="flex-shrink-0 pt-0.5">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <p className="ml-3 text-sm text-yellow-700">
                  <span>You have unsaved changes.</span>
                </p>
              </div>
              <div className="flex-shrink-0 sm:ml-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(JSON.parse(initialFormData.current));
                    setFormIsDirty(false);
                  }}
                  className="mr-3 text-sm font-medium text-yellow-700 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalForm;