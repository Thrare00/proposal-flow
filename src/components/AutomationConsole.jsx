import React, { useState, useEffect, useCallback } from 'react';
import { enqueue } from '../lib/enqueue';
import { getHealth } from '../lib/api';

export default function AutomationConsole() {
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        action: "log_directory",
        payload: {
          Portal: "BidNet",
          URL: "https://www.bidnetdirect.com/",
          Status: "Started"
        }
      },
      null, 2
    )
  );
  
  const [submitting, setSubmitting] = useState(false);
  const [lastEnqueue, setLastEnqueue] = useState(null);
  const [lastProcessed, setLastProcessed] = useState(null);
  const [error, setError] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch health status periodically when drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;
    
    const fetchStatus = async () => {
      try {
        const health = await getHealth();
        if (health?.last_processed) {
          setLastProcessed({
            ts: health.last_processed.timestamp,
            action: health.last_processed.action,
            ok: health.last_processed.success
          });
        }
      } catch (e) {
        console.error('Error fetching health status:', e);
      }
    };

    // Initial fetch
    fetchStatus();
    
    // Set up interval for periodic refresh
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isDrawerOpen]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate JSON
      const job = JSON.parse(payload);
      
      // Send to queue
      await enqueue(job);
      
      // Update UI
      const now = new Date().toISOString();
      setLastEnqueue(now);
      
      // Refresh health status
      const health = await getHealth();
      if (health?.last_processed) {
        setLastProcessed({
          ts: health.last_processed.timestamp,
          action: health.last_processed.action,
          ok: health.last_processed.success
        });
      }
      
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [payload]);

  const handleReset = useCallback(() => {
    setPayload(JSON.stringify(
      {
        action: "log_directory",
        payload: {
          Portal: "BidNet",
          URL: "https://www.bidnetdirect.com/",
          Status: "Started"
        }
      },
      null, 2
    ));
    setError(null);
  }, []);

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (!isDrawerOpen) {
    return (
      <button 
        onClick={() => setIsDrawerOpen(true)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Open Automation Console"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsDrawerOpen(false)}></div>
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Automation Console</h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close panel</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="payload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Payload (JSON)
                  </label>
                  <textarea
                    id="payload"
                    rows={10}
                    className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${
                      error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    disabled={submitting}
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Invalid JSON: {error}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {submitting ? 'Sending...' : 'Send to Automation'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Reset
                  </button>
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400 w-32">Last Sent:</span>
                    <span className="font-mono text-sm">
                      {lastEnqueue ? formatTimestamp(lastEnqueue) : '—'}
                    </span>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">Last Processed:</span>
                    <div className="flex-1">
                      {lastProcessed ? (
                        <div>
                          <span className="font-medium">{lastProcessed.action}</span>
                          <span className="mx-2">•</span>
                          <span className={lastProcessed.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {lastProcessed.ok ? 'success' : 'failed'}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatTimestamp(lastProcessed.ts)}
                          </span>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
