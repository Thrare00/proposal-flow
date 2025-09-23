import React, { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { setCadence, getHealth, getCadence } from "../lib/api.js";
import { Clock, Info, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
  if (!isOpen) return null;
  
  const dialogRef = useRef(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && e.ctrlKey) onConfirm();
    };
    
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);
  
  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll('button');
      if (focusable.length > 0) focusable[0].focus();
    }
  }, [isOpen]);
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div 
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="ml-4">
            <h3 id="dialog-title" className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
            autoFocus
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Common timezones for better UX with user-friendly display names
const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "America/Adak", label: "Hawaii-Aleutian" },
  { value: "Pacific/Honolulu", label: "Hawaii" }
];

// Helper to format timezone offset
const formatOffset = (date) => {
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Helper to get timezone display name
const getTimezoneDisplayName = (timezone) => {
  try {
    const commonTz = COMMON_TIMEZONES.find(tz => tz.value === timezone);
    if (commonTz) return commonTz.label;
    
    const date = new Date();
    const options = { 
      timeZone: timezone, 
      timeZoneName: 'long',
      timeStyle: 'long',
      hour12: false
    };
    const formatted = new Intl.DateTimeFormat('en-US', options)
      .formatToParts(date)
      .find(part => part.type === 'timeZoneName')?.value || timezone;
    
    return formatted;
  } catch (e) {
    return timezone;
  }
};

export default function CadenceSettings() {
  const [days, setDays] = useState(["MON", "WED"]);
  const [time, setTime] = useState("09:00");
  const [tz, setTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [customTz, setCustomTz] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastProcessed, setLastProcessed] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState(null);
  const formRef = useRef(null);
  const lastFocusedElement = useRef(null);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Format current time in selected timezone
  const currentTimeInTz = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(currentTime);
    } catch (e) {
      return 'Invalid timezone';
    }
  }, [tz, currentTime]);
  
  // Get timezone offset for display
  const timezoneOffset = useMemo(() => {
    try {
      const date = new Date();
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
      return formatOffset(tzDate);
    } catch (e) {
      return '';
    }
  }, [tz]);

  // Load existing cadence settings
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const [cadence, health] = await Promise.all([
          getCadence().catch(() => ({})), // Gracefully handle if not implemented
          getHealth().catch(() => ({}))  // Gracefully handle if not available
        ]);

        if (cadence.days) setDays(cadence.days);
        if (cadence.time) setTime(cadence.time);
        if (cadence.tz) {
          setTz(cadence.tz);
          if (!COMMON_TIMEZONES.includes(cadence.tz)) {
            setCustomTz(cadence.tz);
          }
        }
        if (health?.last_processed?.timestamp) {
          setLastProcessed(new Date(health.last_processed.timestamp));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleDay = (day) => {
    setDays(prev => {
      const newDays = prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));
      return newDays;
    });
  };

  const handleTimezoneChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setTz(customTz || Intl.DateTimeFormat().resolvedOptions().timeZone);
    } else {
      setTz(value);
      setCustomTz('');
    }
  };
  
  const handleCustomTzChange = (e) => {
    const value = e.target.value;
    setCustomTz(value);
    if (value) {
      setTz(value);
    }
  };

  const validateForm = () => {
    if (days.length === 0) {
      toast.error('Please select at least one day');
      return false;
    }
    if (!time) {
      toast.error('Please select a time');
      return false;
    }
    if (!tz) {
      toast.error('Please select a timezone');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const formData = { 
      days, 
      time: time.padStart(5, '0'), // Ensure HH:MM format
      tz 
    };
    
    // Show confirmation dialog
    setFormData(formData);
    lastFocusedElement.current = document.activeElement;
    setShowConfirm(true);
  };
  
  const confirmSave = async () => {
    if (!formData) return;
    
    setShowConfirm(false);
    setIsSaving(true);
    
    try {
      const response = await setCadence(formData);
      
      if (response?.success) {
        toast.success(response.rebuilt 
          ? "Cadence applied & triggers rebuilt successfully!"
          : "Cadence settings saved successfully!"
        );
        
        // Refresh health data
        try {
          const health = await getHealth();
          if (health?.last_processed?.timestamp) {
            setLastProcessed(new Date(health.last_processed.timestamp));
          }
        } catch (healthError) {
          console.warn('Could not refresh health status:', healthError);
        }
      } else {
        throw new Error(response?.error || 'Failed to save cadence settings');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(`Error: ${error.message || 'Failed to save settings'}`);
    } finally {
      setIsSaving(false);
      // Return focus to the last focused element
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Cadence Settings</h1>
        <p className="text-gray-600">
          Configure when and how often the system should process proposals.
        </p>
      </div>

      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="space-y-6"
        onKeyDown={handleFormKeyDown}
        aria-label="Cadence settings form"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Processing Days
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select processing days">
            {ALL_DAYS.map(day => {
              const isSelected = days.includes(day);
              return (
                <button
                  key={day}
                  id={`day-${day}`}
                  type="button"
                  onClick={() => toggleDay(day)}
                  onKeyDown={(e) => handleDayKeyDown(day, e)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Select days when the system should process proposals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              Processing Time (24h)
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm p-2 border"
              required
              aria-required="true"
              aria-describedby="time-help"
            />
            <p className="mt-1 text-sm text-gray-500">
              Time of day to process proposals
            </p>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <div className="relative">
              <select
                id="timezone"
                value={COMMON_TIMEZONES.some(tzObj => tzObj.value === tz) ? tz : 'custom'}
                onChange={handleTimezoneChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm p-2 border"
                aria-describedby="timezone-help"
              >
                <option value="" disabled>Select a timezone</option>
                {COMMON_TIMEZONES.map(tzObj => (
                  <option key={tzObj.value} value={tzObj.value}>
                    {tzObj.label} ({formatOffset(new Date(new Date().toLocaleString('en-US', { timeZone: tzObj.value })))})
                  </option>
                ))}
                <option value="custom">Custom timezone...</option>
              </select>
            
            {(!COMMON_TIMEZONES.some(tzObj => tzObj.value === tz) || customTz) && (
              <div className="mt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={customTz}
                    onChange={handleCustomTzChange}
                    placeholder="Enter IANA timezone (e.g., America/New_York)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm p-2 border pr-10"
                    aria-describedby="timezone-help"
                  />
                  {tz && !COMMON_TIMEZONES.some(tzObj => tzObj.value === tz) && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">
                        {timezoneOffset}
                      </span>
                    </div>
                  )}
                </div>
                {tz && (
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <Info className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span>{getTimezoneDisplayName(tz)}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0" />
              <span>Current time: {currentTimeInTz} {timezoneOffset}</span>
            </div>
            <p id="timezone-help" className="mt-1 text-xs text-gray-500">
              Selected timezone will be used for all scheduled processing
            </p>
          </div>
        </div>

        {lastProcessed && (
          <div className="text-sm text-gray-500">
            Last processed: {lastProcessed.toLocaleString()}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
            aria-label="Cancel changes and reload page"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={isSaving}
            aria-live="polite"
          >
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              <span>Save Settings <span className="text-xs opacity-70">(Ctrl+Enter)</span></span>
            )}
          </button>
        </div>
        {/* Close any remaining section wrapper inside the form */}
        </div>
      </form>
      
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={confirmSave}
        onCancel={() => {
          setShowConfirm(false);
          if (lastFocusedElement.current) {
            lastFocusedElement.current.focus();
          }
        }}
        title="Confirm Schedule Change"
        message="Are you sure you want to update the processing schedule? This will affect when the system processes proposals."
        confirmText="Update Schedule"
      />
    </div>
  );
}
