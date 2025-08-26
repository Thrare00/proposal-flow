import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
// Using plain JavaScript objects instead of TypeScript types
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import CalendarEventForm from '../components/CalendarEventForm.jsx';
import { useProposalContext } from '../contexts/ProposalContext.jsx';

const Calendar = () => {
  const { proposals, customEvents, addCustomEvent, updateCustomEvent, deleteCustomEvent } = useProposalContext();
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingCustomEvent, setEditingCustomEvent] = useState(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);
    
    // Calculate the first day of the week (Sunday)
    const firstDayOfWeek = new Date(startDate);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
    
    // Calculate the last day of the week (Saturday)
    const lastDayOfWeek = new Date(endDate);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + (6 - lastDayOfWeek.getDay()));
    
    return eachDayOfInterval({ start: firstDayOfWeek, end: lastDayOfWeek });
  }, [currentMonth]);

  const handleMonthChange = (direction) => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (day) => {
    setShowEventForm(true);
    setEditingCustomEvent(undefined);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => handleMonthChange('prev')}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Previous Month
            </button>
            <button
              onClick={() => handleMonthChange('next')}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Next Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-8">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {calendarDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-4 rounded-lg ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''} cursor-pointer hover:bg-gray-50 transition-colors duration-200`}
              onClick={() => handleDayClick(day)}
            >
              <div className="text-center mb-4">
                <span className="font-semibold">{day.getDate()}</span>

              </div>
              {customEvents.length > 0 ? (
                <ErrorBoundary>
                  {customEvents.map((event) => (
                    <div key={event.id}>
                      {isSameDay(event.date, day) && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-blue-600 truncate max-w-[120px]">{event.title}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCustomEvent(event);
                                setShowEventForm(true);
                              }}
                              className="p-1 hover:bg-blue-100 rounded-full transition-colors duration-200"
                              title="Edit"
                            >
                              <AlertTriangle size={16} className="text-blue-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCustomEvent(event.id);
                              }}
                              className="p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
                              title="Delete"
                            >
                              <AlertTriangle size={16} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </ErrorBoundary>
              ) : (
                <div className="text-gray-400 text-sm mt-2">No events scheduled</div>
              )}
            </div>
          ))}
        </div>

        {showEventForm && (
          <CalendarEventForm
            onClose={() => {
              setShowEventForm(false);
              setEditingCustomEvent(undefined);
            }}
            onSave={(event) => {
              if (editingCustomEvent) {
                updateCustomEvent(event);
              } else {
                addCustomEvent(event);
              }
              setShowEventForm(false);
            }}
            editingEvent={editingCustomEvent}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Calendar;