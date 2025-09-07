import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { enqueue } from '../lib/enqueue.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

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
      await enqueue({
        id: `dir-${Date.now()}`,
        action: 'log_directory',
        payload: formData
      });
      toast.success('Directory entry submitted successfully!');
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
      <h1 className="text-2xl font-bold mb-6">Directory Management</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="portal">Portal</Label>
          <select
            id="portal"
            name="portal"
            value={formData.portal}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">Select a portal</option>
            {PORTAL_OPTIONS.map(portal => (
              <option key={portal.id} value={portal.id}>
                {portal.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">Select status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
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
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Save Directory'}
          </Button>
        </div>
      </form>
    </div>
  );
}