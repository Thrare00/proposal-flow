import { 
  format, 
  differenceInDays, 
  isBefore, 
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';

import { URGENCY_LEVELS, type UrgencyLevel } from '../types';

export const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM d, yyyy');
};

export const formatDateWithDay = (dateString: string): string => {
  return format(parseISO(dateString), 'EEE, MMM d, yyyy');
};

export const isOverdue = (dateString: string): boolean => {
  const date = parseISO(dateString);
  const today = new Date();
  return isBefore(date, today);
};

export const getUrgencyLevel = (dueDate: string): UrgencyLevel => {
  const today = new Date();
  const dueDateObj = parseISO(dueDate);
  const daysUntilDue = differenceInDays(dueDateObj, today);
  
  if (daysUntilDue < 0) return URGENCY_LEVELS.Critical;
  if (daysUntilDue <= 2) return URGENCY_LEVELS.Critical;
  if (daysUntilDue <= 7) return URGENCY_LEVELS.High;
  if (daysUntilDue <= 14) return URGENCY_LEVELS.Medium;
  return URGENCY_LEVELS.Low;
};

export const getUrgencyColor = (urgency: UrgencyLevel): string => {
  switch (urgency) {
    case URGENCY_LEVELS.Critical: return 'bg-error-100 text-error-800';
    case URGENCY_LEVELS.High: return 'bg-warning-100 text-warning-800';
    case URGENCY_LEVELS.Medium: return 'bg-accent-100 text-accent-800';
    case URGENCY_LEVELS.Low: return 'bg-success-100 text-success-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getUrgencyBorderColor = (urgency: UrgencyLevel): string => {
  switch (urgency) {
    case URGENCY_LEVELS.Critical: return 'border-error-300';
    case URGENCY_LEVELS.High: return 'border-warning-300';
    case URGENCY_LEVELS.Medium: return 'border-accent-300';
    case URGENCY_LEVELS.Low: return 'border-success-300';
    default: return 'border-gray-300';
  }
};

export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  const dueDateObj = parseISO(dueDate);
  return differenceInDays(dueDateObj, today);
};

export const getCurrentWeekDays = (): Date[] => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday as first day
  const end = endOfWeek(today, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start, end });
};

export const getMonthDays = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return eachDayOfInterval({ start, end });
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return isWithinInterval(date, { start: startDate, end: endDate });
};

export const isSameDate = (date1: string, date2: string): boolean => {
  return isSameDay(parseISO(date1), parseISO(date2));
};

export const getNextMonth = (date: Date): Date => {
  return addMonths(date, 1);
};

export const getPreviousMonth = (date: Date): Date => {
  return subMonths(date, 1);
};

export const getDatesBetween = (startDate: string, endDate: string): Date[] => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return eachDayOfInterval({ start, end });
};