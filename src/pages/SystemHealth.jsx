import { useEffect, useState, useCallback } from "react";
import { getHealth } from "../lib/api";
import { toast } from "react-toastify";

export default function SystemHealth() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealth();
      // Handle different response formats
      const events = data?.events || data?.results || [];
      const processedEvents = Array.isArray(events) 
        ? events.slice(-20).reverse()
        : [];
      setRows(processedEvents);
    } catch (e) {
      console.error('Failed to fetch health data:', e);
      setError(e.message || 'Failed to load system health data');
      toast.error('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [fetchHealthData]);

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Health</h1>
        <button 
          onClick={fetchHealthData}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="text-sm text-gray-600">
        {loading ? 'Loading...' : `Showing latest ${rows.length} events`}
      </div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">OK</th>
              <th className="px-3 py-2 text-left">Error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>
                  Loading events...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-3 py-4 text-center text-red-600" colSpan={5}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-500 text-center" colSpan={5}>
                  No events found
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.id}-${i}`} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.timestamp || r.ts ? (
                      new Date(r.timestamp || r.ts).toLocaleString()
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.id || '—'}</td>
                  <td className="px-3 py-2">{r.action || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      r.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {String(r.ok)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-red-600 text-sm">{r.error || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
