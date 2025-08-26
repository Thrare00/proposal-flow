import React, { useState } from 'react';
import { X } from 'lucide-react';
import { generateUUID } from '../utils/uuidUtils.js';
import { isValid } from 'date-fns';
import ErrorBoundary from '../components/ErrorBoundary.jsx';

const CalendarEventForm = ({ onClose, onSave, editingEvent }) => {
  const [title, setTitle] = useState(editingEvent?.title || '');
  const [date, setDate] = useState(editingEvent ? new Date(editingEvent.date).toISOString() : new Date().toISOString());
  const [notification, setNotification] = useState(editingEvent?.notification || null);
  const [type, setType] = useState(editingEvent?.type || 'custom');
  const [proposalId, setProposalId] = useState(editingEvent?.proposalId || '');
  const [errors, setErrors] = useState({});
  const [pushNotification, setPushNotification] = useState(false);
  const [notificationTime, setNotificationTime] = useState('');

  const validateForm = () => {
    
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    } else if (!isValid(new Date(date))) {
      newErrors.date = 'Invalid date format';
    } else if (new Date(date) > new Date()) {
      newErrors.date = 'Date cannot be in the future';
    }

    if (type === 'proposal') {
      if (!proposalId) {
        newErrors.proposalId = 'Proposal ID is required for proposal events';
      } else if (!/^[A-Za-z0-9-]+$/.test(proposalId)) {
        newErrors.proposalId = 'Proposal ID must only contain letters, numbers, and hyphens';
      }
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const event = {
      id: editingEvent?.id || generateUUID(),
      title,
      date: new Date(date),
      type,
      proposalId,
      relatedId: editingEvent?.relatedId,
      status: {
        current: 'pending',
        progress: 0,
        lastUpdated: new Date().toISOString()
      },
      notification: pushNotification ? {
        enabled: true,
        time: notificationTime
      } : null
    };

    onSave(event);
    onClose();
  };

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (new Date(selectedDate) <= new Date()) {
                      setDate(selectedDate);
                    } else {
                      setErrors({ ...errors, date: 'Date cannot be in the future' });
                    }
                  }}
                  className={`w-full px-3 py-2 border ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="custom">Custom Event</option>
                  <option value="proposal">Proposal</option>
                  <option value="task">Task</option>
                </select>
              </div>

              {type === 'proposal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposal ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={proposalId}
                      onChange={(e) => setProposalId(e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        errors.proposalId ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., PROJ-123"
                    />
                    {errors.proposalId && (
                      <p className="text-red-500 text-sm mt-1">{errors.proposalId}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <input
                    id="push-notification"
                    type="checkbox"
                    checked={pushNotification}
                    onChange={e => {
                      setPushNotification(e.target.checked);
                      if (e.target.checked) {
                        setNotification({
                          enabled: true,
                          time: notificationTime || new Date().toISOString()
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span>Enable Push Notification</span>
                </label>
              </div>

              {pushNotification && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification Time</label>
                  <input
                    type="datetime-local"
                    value={notificationTime}
                    onChange={e => {
                      setNotificationTime(e.target.value);
                      if (notification) {
                        setNotification(prev => ({
                          ...prev,
                          time: e.target.value
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

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

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    Object.keys(errors).length > 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {editingEvent ? 'Update' : 'Create'} Event
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CalendarEventForm;
