import { format, differenceInDays, isBefore, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval, isSameDay, addMonths, subMonths } from 'date-fns';
export const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
};
export const formatDateWithDay = (dateString) => {
    return format(parseISO(dateString), 'EEE, MMM d, yyyy');
};
export const isOverdue = (dateString) => {
    const date = parseISO(dateString);
    const today = new Date();
    return isBefore(date, today);
};
export const getUrgencyLevel = (dueDate) => {
    const today = new Date();
    const dueDateObj = parseISO(dueDate);
    const daysUntilDue = differenceInDays(dueDateObj, today);
    if (daysUntilDue < 0)
        return 'critical'; // Overdue
    if (daysUntilDue <= 2)
        return 'critical';
    if (daysUntilDue <= 7)
        return 'high';
    if (daysUntilDue <= 14)
        return 'medium';
    return 'low';
};
export const getUrgencyColor = (urgency) => {
    switch (urgency) {
        case 'critical': return 'bg-error-100 text-error-800';
        case 'high': return 'bg-warning-100 text-warning-800';
        case 'medium': return 'bg-accent-100 text-accent-800';
        case 'low': return 'bg-success-100 text-success-800';
        default: return 'bg-gray-100 text-gray-800';
    }
    ;
};
export const getUrgencyBorderColor = (urgency) => {
    switch (urgency) {
        case 'critical': return 'border-error-300';
        case 'high': return 'border-warning-300';
        case 'medium': return 'border-accent-300';
        case 'low': return 'border-success-300';
        default: return 'border-gray-300';
    }
};
export const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const dueDateObj = parseISO(dueDate);
    return differenceInDays(dueDateObj, today);
};
export const getCurrentWeekDays = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday as first day
    const end = endOfWeek(today, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
};
export const getMonthDays = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
};
export const isDateInRange = (date, startDate, endDate) => {
    return isWithinInterval(date, { start: startDate, end: endDate });
};
export const isSameDate = (date1, date2) => {
    return isSameDay(parseISO(date1), parseISO(date2));
};
export const getNextMonth = (date) => {
    return addMonths(date, 1);
};
export const getPreviousMonth = (date) => {
    return subMonths(date, 1);
};
export const getDatesBetween = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return eachDayOfInterval({ start, end });
};
//# sourceMappingURL=dateUtils.js.map