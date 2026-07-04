import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, AlertTriangle, X, Check, Download, Loader2 } from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import { normalizeProposalType } from '../../shared/proposalNormalization.js';
import { PURSUIT_POSTURES, getRecommendedWindows } from '../lib/pursuitTiming.js';

// Confirmation Dialog Component
const ConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
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
    warning: 'bg-yellow-600 hover:bg-yellow-700',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start">
          <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
            variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <AlertTriangle className={`h-6 w-6 ${variant === 'danger' ? 'text-red-600' : 'text-blue-600'}`} aria-hidden="true" />
          </div>
          <div className="ml-4">
            <h3 id="dialog-title" className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${variantClasses[variant] || variantClasses.default}`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:col-start-1 sm:mt-0 sm:text-sm"
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
  
  const captureTiming = existingProposal?.metadata?.captureTiming || {};
  const [formData, setFormData] = useState({
    title: existingProposal?.title || '',
    agency: existingProposal?.agency || '',
    dueDate: existingProposal?.dueDate 
      ? new Date(existingProposal.dueDate).toISOString().slice(0, 10)
      : '',
    status: existingProposal?.status || 'intake',
    notes: existingProposal?.notes || '',
    type: normalizeProposalType(existingProposal?.type) || 'federal',
    pursuitPosture: captureTiming.pursuitPosture || 'either',
    intentToBidDate: captureTiming.intentToBidDate || '',
    teamingStartDate: captureTiming.teamingStartDate || '',
    primeOutreachStartDate: captureTiming.primeOutreachStartDate || '',
    primeOutreachEndDate: captureTiming.primeOutreachEndDate || '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formIsDirty, setFormIsDirty] = useState(false);
  const initialFormData = useRef(JSON.stringify(formData));
  const [solicitationUrl, setSolicitationUrl] = useState('');
  const [fetchingDoc, setFetchingDoc] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);

  const handleFetchDocument = async () => {
    if (!solicitationUrl.trim()) return;
    setFetchingDoc(true);
    setFetchResult(null);
    try {
      const resp = await fetch('/api/proposals/fetch-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: solicitationUrl.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setFetchResult({ error: data.error || 'Failed to fetch document' });
      } else if (data.note && !data.text) {
        setFetchResult({ warning: data.note });
      } else {
        setFormData(prev => ({
          ...prev,
          notes: prev.notes
            ? `${prev.notes}\n\n--- Fetched from ${data.sourceUrl} ---\n${data.text}`
            : `--- Fetched from ${data.sourceUrl} ---\n${data.text}`,
        }));
        setFetchResult({ success: true, note: data.note || `Fetched ${data.text.length} characters from ${data.filename}` });
      }
    } catch (err) {
      setFetchResult({ error: err.message });
    } finally {
      setFetchingDoc(false);
    }
  };
  
  // Track form changes
  useEffect(() => {
    const currentData = JSON.stringify(formData);
    setFormIsDirty(initialFormData.current !== currentData);
  }, [formData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: value
      };

      if (name === 'dueDate' || name === 'pursuitPosture') {
        const recommended = getRecommendedWindows(next.dueDate, next.pursuitPosture);
        next.intentToBidDate = recommended.intentToBidDate || next.intentToBidDate;
        next.teamingStartDate = recommended.teamingStartDate || next.teamingStartDate;
        next.primeOutreachStartDate = recommended.primeOutreachStartDate || next.primeOutreachStartDate;
        next.primeOutreachEndDate = recommended.primeOutreachEndDate || next.primeOutreachEndDate;
      }

      return next;
    });
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
      const recommended = getRecommendedWindows(formData.dueDate, formData.pursuitPosture);
      const proposalData = {
        title: formData.title.trim(),
        agency: formData.agency.trim(),
        dueDate: new Date(`${formData.dueDate}T12:00:00`).toISOString(),
        status: formData.status,
        type: normalizeProposalType(formData.type),
        notes: formData.notes.trim(),
        metadata: {
          ...(existingProposal?.metadata || {}),
          captureTiming: {
            pursuitPosture: recommended.pursuitPosture,
            pursuitBucket: recommended.bucket,
            timingBucket: recommended.timingBucket,
            daysOut: recommended.daysOut,
            intentToBidDate: formData.intentToBidDate || recommended.intentToBidDate,
            teamingStartDate: formData.teamingStartDate || recommended.teamingStartDate,
            primeOutreachStartDate: formData.primeOutreachStartDate || recommended.primeOutreachStartDate,
            primeOutreachEndDate: formData.primeOutreachEndDate || recommended.primeOutreachEndDate,
          },
        },
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
      
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {isEditing ? 'Edit Proposal' : 'New Proposal'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6" noValidate>
          {errors.form && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
              {errors.form}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 ${
                  errors.title ? 'border-red-300 dark:border-red-500' : ''
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
              <label htmlFor="agency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Agency <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="agency"
                name="agency"
                value={formData.agency}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 ${
                  errors.agency ? 'border-red-300 dark:border-red-500' : ''
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
              <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 ${
                  errors.dueDate ? 'border-red-300 dark:border-red-500' : ''
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
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                aria-label="Select proposal status"
              >
                <option value="intake">Intake</option>
                <option value="qualification">Qualification</option>
                <option value="pre_solicitation">Pre-Solicitation Brief</option>
                <option value="research">Research</option>
                <option value="technical_compliance">Technical / Compliance</option>
                <option value="pricing_strategy">Pricing Strategy</option>
                <option value="drafting">Claude Drafting</option>
                <option value="review">ChatGPT Review</option>
                <option value="google_docs_final">Google Docs Final</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                aria-label="Select proposal type"
              >
                <option value="federal">Federal</option>
                <option value="state_local">State / Local</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label htmlFor="pursuitPosture" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pursuit Posture
              </label>
              <select
                id="pursuitPosture"
                name="pursuitPosture"
                value={formData.pursuitPosture}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                {PURSUIT_POSTURES.map((posture) => (
                  <option key={posture.value} value={posture.value}>{posture.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="intentToBidDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Intent to Bid Date
              </label>
              <input type="date" id="intentToBidDate" name="intentToBidDate" value={formData.intentToBidDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            </div>

            <div>
              <label htmlFor="teamingStartDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Planned Teaming Start
              </label>
              <input type="date" id="teamingStartDate" name="teamingStartDate" value={formData.teamingStartDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            </div>

            <div>
              <label htmlFor="primeOutreachStartDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Prime Outreach Start
              </label>
              <input type="date" id="primeOutreachStartDate" name="primeOutreachStartDate" value={formData.primeOutreachStartDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            </div>

            <div>
              <label htmlFor="primeOutreachEndDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Prime Outreach End
              </label>
              <input type="date" id="primeOutreachEndDate" name="primeOutreachEndDate" value={formData.primeOutreachEndDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="solicitationUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Fetch Solicitation from URL
              </label>
              <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Paste a SAM.gov, beta.sam.gov, or other solicitation URL to auto-import text</p>
              <div className="flex gap-2 mt-1">
                <input
                  type="url"
                  id="solicitationUrl"
                  value={solicitationUrl}
                  onChange={(e) => setSolicitationUrl(e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="https://sam.gov/opp/..."
                />
                <button
                  type="button"
                  onClick={handleFetchDocument}
                  disabled={fetchingDoc || !solicitationUrl.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {fetchingDoc ? <Loader2 size={16} className="animate-spin mr-1" /> : <Download size={16} className="mr-1" />}
                  Fetch
                </button>
              </div>
              {fetchResult?.error && (
                <p className="mt-1 text-sm text-red-600">{fetchResult.error}</p>
              )}
              {fetchResult?.warning && (
                <p className="mt-1 text-sm text-amber-600">{fetchResult.warning}</p>
              )}
              {fetchResult?.success && (
                <p className="mt-1 text-sm text-green-600">{fetchResult.note}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
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
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
        <div className="fixed bottom-0 left-0 right-0 border-t border-yellow-200 bg-yellow-50 p-4 shadow-lg dark:border-yellow-900/40 dark:bg-yellow-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center">
                <div className="flex-shrink-0 pt-0.5">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-200">
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
                  className="mr-3 text-sm font-medium text-yellow-700 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:text-yellow-200 dark:hover:text-yellow-100"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-md border border-transparent bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
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
