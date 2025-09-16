import {
  format,
  parseISO,
  isBefore,
  addDays as dfAddDays,
  startOfDay,
  startOfWeek,
  endOfWeek,
  isToday,
  isWithinInterval,
  differenceInDays
} from 'date-fns'

// Export date-fns utilities
export { 
  format, 
  parseISO, 
  isBefore, 
  startOfDay, 
  startOfWeek, 
  endOfWeek, 
  isToday, 
  isWithinInterval,
  differenceInDays 
}

export const addDays = (date, days) => dfAddDays(date, days)

// Urgency level constants
export const URGENCY_LEVELS = {
  OVERDUE: 'overdue',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  IMMEDIATE: 'immediate',
  SOON: 'soon',
  APPROACHING: 'approaching',
  ON_TRACK: 'on_track'
}

/**
 * Checks if a date is overdue
 * @param {string|Date} dateString - The date to check
 * @returns {boolean} True if the date is in the past and not today, false otherwise
 */
export const isOverdue = (dateString) => {
  if (!dateString) return false;
  
  try {
    let date;
    
    // Handle different date formats
    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'string') {
      // Try parsing ISO string first, then fallback to Date constructor
      date = parseISO(dateString);
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }
    } else {
      return false;
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to isOverdue:', dateString);
      return false;
    }
    
    const today = new Date();
    const isPastDate = isBefore(date, today);
    const isTodayDate = isToday(date);
    
    return isPastDate && !isTodayDate;
  } catch (error) {
    console.error('Error in isOverdue:', error);
    return false;
  }
}

/**
 * Determines the urgency level based on the days until the due date
 * @param {string|Date} dateString - The due date to check
 * @returns {string} The urgency level from URGENCY_LEVELS
 */
export const getUrgencyLevel = (dateString) => {
  if (!dateString) return URGENCY_LEVELS.ON_TRACK;
  
  try {
    let dueDate;
    
    // Handle different date formats
    if (dateString instanceof Date) {
      dueDate = dateString;
    } else if (typeof dateString === 'string') {
      // Try parsing ISO string first, then fallback to Date constructor
      dueDate = parseISO(dateString);
      if (isNaN(dueDate.getTime())) {
        dueDate = new Date(dateString);
      }
    } else {
      return URGENCY_LEVELS.ON_TRACK;
    }
    
    // Check if the date is valid
    if (isNaN(dueDate.getTime())) {
      console.warn('Invalid date provided to getUrgencyLevel:', dateString);
      return URGENCY_LEVELS.ON_TRACK;
    }
    
    const today = startOfDay(new Date());
    const daysUntilDue = differenceInDays(startOfDay(dueDate), today);
    
    if (daysUntilDue < 0) return URGENCY_LEVELS.OVERDUE;
    if (daysUntilDue === 0) return URGENCY_LEVELS.IMMEDIATE;
    if (daysUntilDue <= 2) return URGENCY_LEVELS.HIGH;
    if (daysUntilDue <= 7) return URGENCY_LEVELS.SOON;
    if (daysUntilDue <= 14) return URGENCY_LEVELS.APPROACHING;
    
    return URGENCY_LEVELS.ON_TRACK;
  } catch (error) {
    console.error('Error in getUrgencyLevel:', error);
    return URGENCY_LEVELS.ON_TRACK;
  }
}

/**
 * Gets the appropriate color classes for a given urgency level
 * @param {string} level - The urgency level from URGENCY_LEVELS
 * @returns {string} Tailwind CSS classes for the urgency level
 */
export const getUrgencyColor = (level) => {
  const colorMap = {
    [URGENCY_LEVELS.OVERDUE]: 'bg-red-100 text-red-800',
    [URGENCY_LEVELS.IMMEDIATE]: 'bg-red-100 text-red-800',
    [URGENCY_LEVELS.HIGH]: 'bg-orange-100 text-orange-800',
    [URGENCY_LEVELS.SOON]: 'bg-yellow-100 text-yellow-800',
    [URGENCY_LEVELS.APPROACHING]: 'bg-blue-100 text-blue-800',
    [URGENCY_LEVELS.ON_TRACK]: 'bg-green-100 text-green-800',
    [URGENCY_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800', // Alias for backward compatibility
    [URGENCY_LEVELS.LOW]: 'bg-green-100 text-green-800', // Alias for backward compatibility
    [URGENCY_LEVELS.SOON]: 'text-amber-600 bg-amber-50',
    [URGENCY_LEVELS.APPROACHING]: 'text-blue-600 bg-blue-50',
    [URGENCY_LEVELS.ON_TRACK]: 'text-gray-600 bg-gray-50'
  };
  
  // Fallback to medium priority if level is not found
  return colorMap[level] || 'bg-gray-100 text-gray-800';
}

/**
 * Gets the appropriate border color class for a given urgency level
 * @param {string} level - The urgency level from URGENCY_LEVELS
 * @returns {string} Tailwind CSS border color class
 */
export const getUrgencyBorderColor = (level) => {
  const colorMap = {
    [URGENCY_LEVELS.OVERDUE]: 'border-red-500',
    [URGENCY_LEVELS.IMMEDIATE]: 'border-red-500',
    [URGENCY_LEVELS.HIGH]: 'border-orange-500',
    [URGENCY_LEVELS.SOON]: 'border-yellow-500',
    [URGENCY_LEVELS.APPROACHING]: 'border-blue-500',
    [URGENCY_LEVELS.ON_TRACK]: 'border-green-500',
    [URGENCY_LEVELS.MEDIUM]: 'border-yellow-500', // Alias for backward compatibility
    [URGENCY_LEVELS.LOW]: 'border-green-500', // Alias for backward compatibility
    [URGENCY_LEVELS.APPROACHING]: 'border-blue-500',
    [URGENCY_LEVELS.ON_TRACK]: 'border-gray-300'
  };
  
  // Fallback to gray border if level is not found
  return colorMap[level] || 'border-gray-300';
}

/**
 * Formats a date string into a readable format (e.g., 'Jan 1, 2023')
 * @param {string|Date} dateString - The date to format
 * @param {string} [fallback='-'] - The string to return if date is invalid
 * @returns {string} Formatted date string or fallback
 */
export const formatDate = (dateString, fallback = '-') => {
  if (!dateString) return fallback;
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDate:', dateString);
      return fallback;
    }
    
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error in formatDate:', error);
    return fallback;
  }
};

/**
 * Formats a date string with day of week (e.g., 'Mon, Jan 1, 2023')
 * @param {string|Date} dateString - The date to format
 * @param {string} [fallback='-'] - The string to return if date is invalid
 * @returns {string} Formatted date string with day or fallback
 */
export const formatDateWithDay = (dateString, fallback = '-') => {
  if (!dateString) return fallback;
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDateWithDay:', dateString);
      return fallback;
    }
    
    return format(date, 'EEE, MMM d, yyyy');
  } catch (error) {
    console.error('Error in formatDateWithDay:', error);
    return fallback;
  }
};

export const formatISO = (date) => {
  return date.toISOString()
}

export const getDaysUntilDue = (dueDate) => {
  const today = new Date()
  const dueDateObj = typeof dueDate === 'string' ? parseISO(dueDate) : new Date(dueDate)
  return differenceInDays(dueDateObj, today)
}

export const getCurrentWeekDays = () => {
  const today = new Date()
  const start = startOfWeek(today)
  const end = endOfWeek(today)
  return eachDayOfInterval({ start, end })
}

export const getMonthDays = (date) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return eachDayOfInterval({ start, end })
}

export const isDateInRange = (date, startDate, endDate) => {
  return isWithinInterval(
    typeof date === 'string' ? parseISO(date) : date,
    { 
      start: typeof startDate === 'string' ? parseISO(startDate) : startDate,
      end: typeof endDate === 'string' ? parseISO(endDate) : endDate
    }
  )
}

export const getNextMonth = (date) => {
  return addMonths(date, 1)
}

export const getPreviousMonth = (date) => {
  return subMonths(date, 1)
}

export const getDatesBetween = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  return eachDayOfInterval({ start, end })
}

export const formatDistanceToNow = (date, options = {}) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, new Date(), { 
    addSuffix: true,
    ...options 
  })
}

export const getDaysDifference = (date1, date2) => {
  return differenceInDays(parseISO(date2), parseISO(date1));
};

export const addDaysFromNow = (date, days) => {
  return addDays(parseISO(date), days);
};
