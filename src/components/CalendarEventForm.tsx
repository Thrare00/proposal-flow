import React, { useState } from 'react';
import { CalendarEvent } from '../types';

interface CalendarEventFormProps {
  proposalId: string;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onCancel: () => void;
  initialValues?: Omit<CalendarEvent, 'id'>;
  onDelete?: () => void;
}

const CalendarEventForm: React.FC<CalendarEventFormProps> = ({ proposalId, onSave, onCancel, initialValues, onDelete }) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [date, setDate] = useState(initialValues?.date || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [pushNotification, setPushNotification] = useState(initialValues?.pushNotification || false);
  const [notificationTime, setNotificationTime] = useState(initialValues?.notificationTime || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    onSave({ title, date, description, pushNotification, notificationTime });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="form-label" htmlFor="event-title">Event Title</label>
        <input
          id="event-title"
          className="form-input"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="e.g., Internal Review Deadline"
        />
      </div>
      <div>
        <label className="form-label" htmlFor="event-date">Date</label>
        <input
          id="event-date"
          className="form-input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="form-label" htmlFor="event-description">Description (optional)</label>
        <textarea
          id="event-description"
          className="form-input"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="push-notification"
          type="checkbox"
          checked={pushNotification}
          onChange={e => setPushNotification(e.target.checked)}
        />
        <label htmlFor="push-notification" className="form-label mb-0">Enable Push Notification</label>
      </div>
      {pushNotification && (
        <div>
          <label className="form-label" htmlFor="notification-time">Notification Time</label>
          <input
            id="notification-time"
            className="form-input"
            type="datetime-local"
            value={notificationTime}
            onChange={e => setNotificationTime(e.target.value)}
            required
          />
        </div>
      )}
      <div className="flex space-x-2 justify-end">
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn btn-danger mr-auto">Delete</button>
        )}
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" className="btn btn-primary">Save Event</button>
      </div>
    </form>
  );
};

export default CalendarEventForm;
