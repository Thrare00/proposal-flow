import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { enqueue } from '../lib/enqueue';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function CeoActions() {
  const [formData, setFormData] = useState({
    subject: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    duration: 30,
    body: '',
    reminder: 15
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Combine date and time into a single ISO string
    const startDateTime = new Date(`${formData.date}T${formData.time}`);
    
    const job = {
      id: `ceo-${Date.now()}`,
      action: 'outlook_reminder',
      payload: {
        Subject: formData.subject,
        Start: startDateTime.toISOString(),
        DurationMinutes: parseInt(formData.duration, 10),
        Body: formData.body,
        ReminderMinutesBeforeStart: parseInt(formData.reminder, 10)
      }
    };

    try {
      const result = await enqueue(job);
      toast.success('CEO action queued successfully!');
      console.log('Enqueue result:', result);
      // Reset form
      setFormData({
        subject: '',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
        duration: 30,
        body: '',
        reminder: 15
      });
    } catch (error) {
      console.error('Error enqueuing CEO action:', error);
      toast.error(`Failed to queue CEO action: ${error.message}`);
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
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">CEO Action Item</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="E.g., Follow up with client"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes) *</Label>
          <Input
            type="number"
            id="duration"
            name="duration"
            min="5"
            max="1440"
            value={formData.duration}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminder">Reminder (minutes before) *</Label>
          <Input
            type="number"
            id="reminder"
            name="reminder"
            min="0"
            max="40320" // 4 weeks in minutes
            value={formData.reminder}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Details</Label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Additional details about this action item..."
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Reminder...' : 'Create Reminder'}
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
