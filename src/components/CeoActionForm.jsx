import { useState } from 'react';
import { toast } from 'react-toastify';
import { enqueue } from '../lib/enqueue.js';

export default function CeoActionForm({ compact = false, onSuccess }) {
  const [formData, setFormData] = useState({
    subject: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    duration: 30,
    body: '',
    reminder: 15
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      await enqueue(job);
      toast.success('CEO action queued successfully!');
      setFormData({
        subject: '',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
        duration: 30,
        body: '',
        reminder: 15
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error enqueuing CEO action:', error);
      toast.error(`Failed to queue CEO action: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-6 max-w-2xl"}>
      <div>
        <label htmlFor="ceo-subject" className={labelClass}>Subject *</label>
        <input
          id="ceo-subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="E.g., Follow up with client"
          required
          className={inputClass}
        />
      </div>

      <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-4"}>
        <div>
          <label htmlFor="ceo-date" className={labelClass}>Date *</label>
          <input type="date" id="ceo-date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="ceo-time" className={labelClass}>Time *</label>
          <input type="time" id="ceo-time" name="time" value={formData.time} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      <div className={compact ? "grid grid-cols-2 gap-2" : "space-y-6"}>
        <div>
          <label htmlFor="ceo-duration" className={labelClass}>Duration (min) *</label>
          <input type="number" id="ceo-duration" name="duration" min="5" max="1440" value={formData.duration} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="ceo-reminder" className={labelClass}>Reminder (min before) *</label>
          <input type="number" id="ceo-reminder" name="reminder" min="0" max="40320" value={formData.reminder} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      {!compact && (
        <div>
          <label htmlFor="ceo-body" className={labelClass}>Details</label>
          <textarea
            id="ceo-body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            className={inputClass}
            rows={compact ? 2 : 4}
            placeholder="Additional details..."
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
      >
        {isSubmitting ? 'Creating...' : 'Create Reminder'}
      </button>
    </form>
  );
}
