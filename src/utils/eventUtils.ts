import { CalendarEvent, CalendarEventType } from '../types/index.js';
import { parseISO, format, isBefore, isOverdue } from 'date-fns';

export const getEventColor = (event: CalendarEvent): string => {
  const eventDate = parseISO(event.date);
  const now = new Date();
  
  if (isBefore(now, eventDate)) {
    return 'blue'; // Future events
  }
  
  if (isOverdue(event.date)) {
    return 'red'; // Overdue events
  }
  
  return 'green'; // Completed events
};

export const getEventIcon = (type: CalendarEventType): JSX.Element => {
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

export const formatEventDate = (date: string): string => {
  return format(parseISO(date), 'MMM d, yyyy');
};

export const validateEvent = (event: Partial<CalendarEvent>): string[] => {
  const errors: string[] = [];
  
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
