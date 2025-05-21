import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext';
import { ProposalType } from '../types';
import { ProposalStatus } from '../types';

const ProposalForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProposal, addProposal, updateProposal, deleteProposal } = useProposalContext();
  
  const existingProposal = id ? getProposal(id) : undefined;
  const isEditing = !!existingProposal;
  
  const [title, setTitle] = useState(existingProposal?.title || '');
  const [agency, setAgency] = useState(existingProposal?.agency || '');
  const [dueDate, setDueDate] = useState(
    existingProposal?.dueDate 
      ? new Date(existingProposal.dueDate).toISOString().slice(0, 10)
      : ''
  );
  const [status, setStatus] = useState<ProposalStatus>(existingProposal?.status || ProposalStatus.INTAKE);
  const [notes, setNotes] = useState(existingProposal?.notes || '');
  const [type, setType] = useState<ProposalType>(existingProposal?.type || ProposalType.FEDERAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  // Reset confirmation after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConfirmingDelete) {
      timer = setTimeout(() => {
        setIsConfirmingDelete(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isConfirmingDelete]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!agency.trim()) {
      newErrors.agency = 'Agency is required';
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
    
    const proposalData = {
      title,
      agency,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(), // Set to noon on the selected date
      status,
      type,
      notes,
    };
    
    let newId;
    if (isEditing && id) {
      updateProposal(id, proposalData);
      newId = id;
    } else {
      newId = addProposal(proposalData);
    }
    
    navigate(`/proposals/${newId}`);
  };
  
  const handleDelete = () => {
    if (!isEditing || !id) return;
    
    if (isConfirmingDelete) {
      deleteProposal(id);
      navigate('/dashboard');
    } else {
      setIsConfirmingDelete(true);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to={isEditing ? `/proposals/${id}` : '/dashboard'} className="text-primary-600 hover:text-primary-800 flex items-center">
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to {isEditing ? 'Proposal Details' : 'Dashboard'}</span>
        </Link>
      </div>
      
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Proposal' : 'Create New Proposal'}</h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update the details of your proposal' : 'Enter the details of your new proposal'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="form-label">Proposal Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`form-input ${errors.title ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="e.g., DoD Training System RFP"
              />
              {errors.title && <p className="text-error-500 text-sm mt-1">{errors.title}</p>}
            </div>
            
            <div>
              <label htmlFor="agency" className="form-label">Agency</label>
              <input
                id="agency"
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className={`form-input ${errors.agency ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="e.g., Department of Defense"
              />
              {errors.agency && <p className="text-error-500 text-sm mt-1">{errors.agency}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="due-date" className="form-label">Due Date</label>
                <input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`form-input ${errors.dueDate ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.dueDate && <p className="text-error-500 text-sm mt-1">{errors.dueDate}</p>}
              </div>
              
              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProposalStatus)}
                  className="form-select"
                >
                  <option value="intake">Intake</option>
                  <option value="outline">Outline</option>
                  <option value="drafting">Drafting</option>
                  <option value="internal_review">Internal Review</option>
                  <option value="final_review">Final Review</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="type" className="form-label">Proposal Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ProposalType)}
                  className="form-select"
                >
                  <option value={ProposalType.COMMERCIAL}>Commercial</option>
                  <option value={ProposalType.LOCAL_STATE}>Local/State</option>
                  <option value={ProposalType.FEDERAL}>Federal</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="form-label">Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                rows={4}
                placeholder="Add any additional notes about this proposal..."
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className={`flex items-center space-x-2 ${
                  isConfirmingDelete
                    ? 'btn bg-error-500 hover:bg-error-600 text-white focus:ring-error-500'
                    : 'btn btn-secondary text-error-600 hover:text-error-700'
                }`}
              >
                <Trash2 size={18} />
                <span>{isConfirmingDelete ? 'Confirm Delete' : 'Delete Proposal'}</span>
              </button>
            ) : (
              <div></div> // Empty div to maintain spacing
            )}
            
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>{isEditing ? 'Update Proposal' : 'Create Proposal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalForm;