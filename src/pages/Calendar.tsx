import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckSquare,
  Calendar as CalendarIcon,
  AlertTriangle
} from 'lucide-react';
import { 
  format, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { useProposalContext } from '../contexts/ProposalContext';
import { CalendarEvent } from '../types';
import { isOverdue } from '../utils/dateUtils';

import CalendarEventForm from '../components/CalendarEventForm';

const Calendar = () => {
  const { proposals, customEvents, addCustomEvent, updateCustomEvent, deleteCustomEvent } = useProposalContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingCustomEvent, setEditingCustomEvent] = useState<CalendarEvent | null>(null);
  
  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    const endDate = new Date(monthEnd);
    // Make sure we include enough days to get a complete grid
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); 
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);
  
  // Generate calendar events
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    proposals.forEach(proposal => {
      // Add proposal due date
      events.push({
        id: `proposal-${proposal.id}`,
        title: proposal.title,
        date: proposal.dueDate,
        type: 'proposal',
        relatedId: proposal.id,
        proposalId: proposal.id
      });
      // Add tasks
      proposal.tasks.forEach(task => {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          date: task.dueDate,
          type: 'task',
          relatedId: task.id,
          proposalId: proposal.id
        });
      });
    });
    // Add custom events
    customEvents.forEach(ev => {
      events.push({
        id: ev.id,
        title: ev.title,
        date: ev.date,
        type: 'custom',
        relatedId: ev.id,
        proposalId: ev.proposalId,
      });
    });
    return events;
  }, [proposals, customEvents]);
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, day);
    });
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const goToToday = () => {
    setCurrentMonth(new Date());
  };
  
  // Day of week header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Calendar View</h1>
          <p className="text-gray-600">View proposal and task deadlines by month</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50"
          >
            Today
          </button>
          
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
          
          <h2 className="text-xl font-semibold ml-2">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 min-h-[600px]">
          {calendarDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            
            return (
              <div 
                key={day.toISOString()} 
                className={`min-h-[100px] border-r border-b border-gray-200 last:border-r-0 p-2 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className={`text-right mb-1 ${
                  isCurrentDay 
                    ? 'bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center ml-auto'
                    : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayEvents.map((event) => (
                    event.type === 'custom' ? (
                      <button
                        key={event.id}
                        className={`block text-xs w-full text-left p-1 rounded truncate bg-yellow-100 text-yellow-800 hover:bg-yellow-200`}
                        style={{ outline: 'none', border: 'none' }}
                        onClick={() => {
                          setEditingCustomEvent(customEvents.find(ev => ev.id === event.id) || null);
                          setShowEventForm(true);
                        }}
                      >
                        <div className="flex items-center">
                          <CalendarIcon size={10} className="mr-1 flex-shrink-0" />
                          <span className="truncate flex-1">{event.title}</span>
                        </div>
                      </button>
                    ) : (
                      <Link 
                        key={event.id}
                        to={
                          event.type === 'proposal' 
                            ? `/proposals/${event.proposalId}` 
                            : `/proposals/${event.proposalId}?editTask=${event.relatedId}`
                        }
                        className={`block text-xs p-1 rounded truncate ${
                          event.type === 'proposal'
                            ? isOverdue(event.date) ? 'bg-error-100 text-error-800' : 'bg-primary-100 text-primary-800'
                            : isOverdue(event.date) ? 'bg-error-50 text-error-700' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center">
                          {event.type === 'proposal' ? (
                            <FileText size={10} className="mr-1 flex-shrink-0" />
                          ) : (
                            <CheckSquare size={10} className="mr-1 flex-shrink-0" />
                          )}
                          <span className="truncate flex-1">{event.title}</span>
                          {isOverdue(event.date) && (
                            <AlertTriangle size={10} className="ml-1 flex-shrink-0 text-error-500" />
                          )}
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6 flex space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-primary-100 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Proposal Due Date</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Task Due Date</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-error-100 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Overdue</span>
        </div>
      </div>
    {/* Floating action button to add custom event */}
    <button
      className="fixed bottom-10 right-10 z-50 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg focus:outline-none"
      title="Add Custom Deadline"
      onClick={() => { setEditingCustomEvent(null); setShowEventForm(true); }}
    >
      <CalendarIcon size={28} />
      <span className="sr-only">Add Custom Deadline</span>
    </button>

    {/* Modal for adding/editing custom event */}
    {showEventForm && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
          <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowEventForm(false)}>
            ×
          </button>
          <h3 className="text-lg font-semibold mb-4">{editingCustomEvent ? 'Edit Custom Deadline' : 'Add Custom Deadline'}</h3>
          <CalendarEventForm
            proposalId={editingCustomEvent?.proposalId || ''}
            onSave={(data) => {
              if (editingCustomEvent) {
                // update
                updateCustomEvent(editingCustomEvent.id, data);
              } else {
                addCustomEvent({ ...data, proposalId: '' });
              }
              setShowEventForm(false);
              setEditingCustomEvent(null);
            }}
            onCancel={() => { setShowEventForm(false); setEditingCustomEvent(null); }}
            initialValues={editingCustomEvent}
            onDelete={editingCustomEvent ? () => {
              deleteCustomEvent(editingCustomEvent.id);
              setShowEventForm(false);
              setEditingCustomEvent(null);
            } : undefined}
            type={editingCustomEvent?.type || 'custom'}
          />
        </div>
      </div>
    )}
  </div>
  );
};

export default Calendar;