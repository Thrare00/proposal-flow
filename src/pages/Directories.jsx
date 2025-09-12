import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { enqueue } from '../lib/enqueue.js';
import { format } from 'date-fns';
import { Button, Input, Label } from '@/components/ui';

// Inline styles for form elements
const formStyles = {
  container: 'max-w-2xl mx-auto p-6 bg-white rounded-lg shadow',
  form: 'space-y-4',
  formGroup: 'space-y-2',
  label: 'block text-sm font-medium text-gray-700',
  input: 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
  select: 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
  button: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50',
  checkbox: 'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
};

const PORTAL_OPTIONS = [
  { id: 'sam', name: 'SAM.gov', url: 'https://sam.gov' },
  { id: 'dsbs', name: 'DSBS', url: 'https://dsbs.sba.gov' },
  { id: 'sba-subnet', name: 'SBA SubNet', url: 'https://web.sba.gov/subnet' },
  { id: 'gsa-ebuy', name: 'GSA eBuy Vendor Profile', url: 'https://www.gsaelibrary.gsa.gov' },
  { id: 'georgia-pr', name: 'Georgia Procurement Registry', url: 'https://fscm.teamworks.georgia.gov/psc/supp/' },
  { id: 'bonfire', name: 'Bonfire (Forsyth)', url: 'https://forsythco.bonfirehub.com/' },
  { id: 'bidnet', name: 'BidNet Direct', url: 'https://www.bidnetdirect.com/' },
  { id: 'atlanta', name: 'City of Atlanta Procurement', url: 'https://www.atlantaga.gov/government/departments/procurement' },
];

const STATUS_OPTIONS = [
  'Started',
  'In Progress',
  'Submitted',
  'Approved',
  'Rejected'
];

export default function Directories() {
  const [formData, setFormData] = useState({
    portal: '',
    url: '',
    username: '',
    status: '',
    submittedDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoRegister, setAutoRegister] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.portal) {
      const portal = PORTAL_OPTIONS.find(p => p.id === formData.portal);
      if (portal) {
        setFormData(prev => ({
          ...prev,
          url: portal.url
        }));
      }
    }
  }, [formData.portal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (autoRegister) {
        // Enqueue registration job
        const job = {
          id: `dir-${Date.now()}`,
          action: "register_vendor",
          payload: {
            portal: PORTAL_OPTIONS.find(p => p.id === formData.portal)?.name || formData.portal,
            portalUrl: formData.url,
            company: "Rare Earth Ltd",
            contact: { 
              name: "Eric White", 
              phone: "478-718-1278", 
              email: "admin@thrarecontracting.com" 
            },
            notes: formData.notes || ""
          }
        };
        await enqueue(job);
        toast.success('Vendor registration job enqueued successfully!');
      } else {
        // Original directory entry submission
        await enqueue({
          type: 'directory_entry',
          payload: formData
        });
        toast.success('Directory entry submitted successfully!');
      }
      
      // Reset form
      setFormData({
        portal: '',
        url: '',
        username: '',
        status: '',
        submittedDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting directory entry:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Directory Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="portal">Portal *</Label>
            <select
              id="portal"
              name="portal"
              className="w-full border rounded px-3 py-2"
              value={formData.portal}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, portal: e.target.value }))
              }
              required
            >
              <option value="" disabled>Select a portal</option>
              {PORTAL_OPTIONS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL *</Label>
          <Input
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            name="status"
            className="w-full border rounded px-3 py-2"
            value={formData.status}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, status: e.target.value }))
            }
            required
          >
            <option value="" disabled>Select status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="submittedDate">Submitted Date</Label>
          <Input
            type="date"
            id="submittedDate"
            name="submittedDate"
            value={formData.submittedDate}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoRegister"
            checked={autoRegister}
            onChange={(e) => setAutoRegister(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoRegister" className="text-sm font-medium text-gray-700">
            Auto-register vendor
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Save Entry'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}