import { parseISO, format, isBefore } from 'date-fns';
import { FileText, CheckSquare, Calendar } from 'lucide-react';

export const getEventColor = (event) => {
  const eventDate = parseISO(event.date);
  const now = new Date();
  
  if (isBefore(now, eventDate)) {
    return 'blue'; // Future events
  }
  
  if (isBefore(parseISO(event.date), now)) {
    return 'red'; // Overdue events
  }
  
  return 'green'; // Completed events
};

export const getEventIcon = (type) => {
  switch (type) {
    case 'proposal':
      return <FileText size={16} className="text-blue-600" />;
    case 'task':
      return <CheckSquare size={16} className="text-green-600" />;
    case 'custom':
      return <Calendar size={16} className="text-gray-600" />;
    default:
      return <Calendar size={16} className="text-gray-600" />;
  }
};

export const formatEventDate = (date) => {
  return format(parseISO(date), 'MMM d, yyyy');
};

export const validateEvent = (event) => {
  const errors = [];
  
  if (!event.title?.trim()) {
    errors.push('Title is required');
  }

  if (!event.date) {
    errors.push('Date is required');
  }

  if (event.type === 'proposal' && !event.proposalId) {
    errors.push('Proposal ID is required for proposal events');
  }

  return errors;
};
