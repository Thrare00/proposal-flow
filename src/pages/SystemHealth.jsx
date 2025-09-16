import React, { useEffect, useState, useCallback } from "react";
import { getHealth, getCadence } from "../lib/api.js";
import { toast } from "react-toastify";
import { RefreshCw, AlertCircle, CheckCircle, Clock, Zap, Calendar, AlertTriangle } from "lucide-react";

// Status indicators for different health states
const StatusIndicator = ({ status, label }) => {
  const statusConfig = {
    healthy: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      bg: "bg-green-50",
      text: "text-green-800"
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      bg: "bg-yellow-50",
      text: "text-yellow-800"
    },
    error: {
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      bg: "bg-red-50",
      text: "text-red-800"
    },
    loading: {
      icon: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
      bg: "bg-blue-50",
      text: "text-blue-800"
    }
  };

  const config = statusConfig[status] || statusConfig.loading;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      <span className="ml-1.5">{label}</span>
    </div>
  );
};

export default function SystemHealth() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [cadence, setCadence] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    error: 0,
    lastSuccess: null,
    lastError: null
  });

  const calculateStats = (events) => {
    const successEvents = events.filter(e => e.ok);
    const errorEvents = events.filter(e => !e.ok);
    
    return {
      total: events.length,
      success: successEvents.length,
      error: errorEvents.length,
      lastSuccess: successEvents[0]?.timestamp || null,
      lastError: errorEvents[0]?.timestamp || null
    };
  };

  const fetchHealthData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [healthData, cadenceData] = await Promise.all([
        getHealth(),
        getCadence().catch(() => ({})) // Optional cadence data
      ]);

      // Process health events
      const events = (healthData?.events || healthData?.results || [])
        .map(event => ({
          ...event,
          timestamp: event.timestamp || event.ts,
          id: event.id || event._id || '—',
          action: event.action || event.type || 'Unknown',
          error: event.error || event.message || (event.ok ? '' : 'Unknown error')
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50); // Limit to 50 most recent events

      setRows(events);
      setStats(calculateStats(events));
      
      // Set cadence if available
      if (cadenceData?.days || cadenceData?.time) {
        setCadence(cadenceData);
      }
      
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch health data:', e);
      const errorMsg = e.message || 'Failed to load system health data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchHealthData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealthData]);

  // Determine overall system status
  const getSystemStatus = () => {
    if (loading) return 'loading';
    if (error || stats.error > 0) return 'error';
    if (stats.lastSuccess && stats.lastError) {
      const lastSuccess = new Date(stats.lastSuccess);
      const lastError = new Date(stats.lastError);
      return lastError > lastSuccess ? 'error' : 'healthy';
    }
    return stats.total > 0 ? 'healthy' : 'warning';
  };

  const systemStatus = getSystemStatus();
  const statusLabels = {
    healthy: 'All Systems Operational',
    warning: 'System Status Unknown',
    error: 'Service Degradation',
    loading: 'Checking System Status...'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              System Health Dashboard
            </h1>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                {lastUpdated 
                  ? `Last updated ${lastUpdated.toLocaleTimeString()}` 
                  : 'Loading...'}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Zap className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                {cadence ? (
                  `Runs ${cadence.days?.join(', ')} at ${cadence.time} ${cadence.tz || ''}`
                ) : (
                  'Loading schedule...'
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                autoRefresh 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              type="button"
              onClick={fetchHealthData}
              disabled={loading}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h2 className="text-lg leading-6 font-medium text-gray-900">System Status</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Current operational status of the system
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <StatusIndicator 
                  status={systemStatus} 
                  label={statusLabels[systemStatus]} 
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Events
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.total}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Successful
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.success}
                          </div>
                          {stats.total > 0 && (
                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                              {Math.round((stats.success / stats.total) * 100)}%
                            </div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Errors
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.error}
                          </div>
                          {stats.total > 0 && (
                            <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                              {Math.round((stats.error / stats.total) * 100)}%
                            </div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Last Success
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {stats.lastSuccess 
                            ? new Date(stats.lastSuccess).toLocaleString() 
                            : 'N/A'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
              <div className="ml-4 mt-2">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Event Log
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Recent system events and their status
                </p>
              </div>
              <div className="ml-4 mt-2 flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {loading ? 'Loading...' : `Showing ${rows.length} events`}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center">
                        <RefreshCw className="animate-spin h-5 w-5 text-blue-500 mr-2" />
                        Loading events...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-red-600">
                      <div className="flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        {error}
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No events found
                    </td>
                  </tr>
                ) : (
                  rows.map((event, index) => (
                    <tr key={`${event.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.action}</div>
                        <div className="text-xs text-gray-500 font-mono">{event.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.ok ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Success
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {event.error || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
