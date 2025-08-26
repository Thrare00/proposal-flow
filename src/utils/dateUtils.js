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

export const isOverdue = (dateString) => {
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    return isBefore(d, new Date()) && !isToday(d)
  } catch {
    return false
  }
}

export const getUrgencyLevel = (dateString) => {
  try {
    const today = new Date()
    const dueDate = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    const daysUntilDue = differenceInDays(startOfDay(dueDate), startOfDay(today))
    
    if (daysUntilDue < 0) return URGENCY_LEVELS.OVERDUE
    if (daysUntilDue === 0) return URGENCY_LEVELS.IMMEDIATE
    if (daysUntilDue <= 1) return URGENCY_LEVELS.HIGH
    if (daysUntilDue <= 3) return URGENCY_LEVELS.MEDIUM
    if (daysUntilDue <= 7) return URGENCY_LEVELS.APPROACHING
    return URGENCY_LEVELS.ON_TRACK
  } catch {
    return URGENCY_LEVELS.ON_TRACK
  }
}

export const getUrgencyColor = (level) => {
  const colorMap = {
    [URGENCY_LEVELS.OVERDUE]: 'bg-red-100 text-red-800',
    [URGENCY_LEVELS.IMMEDIATE]: 'text-error-600 bg-error-50',
    [URGENCY_LEVELS.HIGH]: 'bg-orange-100 text-orange-800',
    [URGENCY_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [URGENCY_LEVELS.LOW]: 'bg-green-100 text-green-800',
    [URGENCY_LEVELS.SOON]: 'text-amber-600 bg-amber-50',
    [URGENCY_LEVELS.APPROACHING]: 'text-blue-600 bg-blue-50',
    [URGENCY_LEVELS.ON_TRACK]: 'text-gray-600 bg-gray-50'
  }
  return colorMap[level] || 'bg-gray-100 text-gray-800'
}

export const getUrgencyBorderColor = (level) => {
  const colorMap = {
    [URGENCY_LEVELS.OVERDUE]: 'border-red-500',
    [URGENCY_LEVELS.IMMEDIATE]: 'border-error-500',
    [URGENCY_LEVELS.HIGH]: 'border-orange-500',
    [URGENCY_LEVELS.MEDIUM]: 'border-yellow-500',
    [URGENCY_LEVELS.LOW]: 'border-green-500',
    [URGENCY_LEVELS.SOON]: 'border-amber-500',
    [URGENCY_LEVELS.APPROACHING]: 'border-blue-500',
    [URGENCY_LEVELS.ON_TRACK]: 'border-gray-300'
  }
  return colorMap[level] || 'border-gray-300'
}

// Date formatting utilities
export const formatDate = (dateString) => format(parseISO(dateString), 'MMM d, yyyy')

export const formatDateWithDay = (dateString) => {
  return format(parseISO(dateString), 'EEE, MMM d, yyyy')
}

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
