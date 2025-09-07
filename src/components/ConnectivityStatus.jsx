import { useEffect, useState } from 'react';
import { checkConnectivity } from '../lib/enqueue';

export default function ConnectivityStatus() {
  const [status, setStatus] = useState({ 
    ok: null, 
    loading: true,
    lastChecked: null,
    status: '',
    statusText: ''
  });

  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      const result = await checkConnectivity();
      setStatus({
        ok: result.ok,
        status: result.status,
        statusText: result.statusText,
        loading: false,
        lastChecked: new Date()
      });
    } catch (error) {
      setStatus({
        ok: false,
        error: error.message,
        loading: false,
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    checkStatus();
    // Check every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (status.loading) {
    return (
      <div className="text-sm px-4 py-2 bg-yellow-100 text-yellow-800">
        <span className="inline-flex items-center">
          <span className="w-2 h-2 mr-2 bg-yellow-500 rounded-full"></span>
          Checking connection...
        </span>
      </div>
    );
  }

  if (status.ok) {
    return (
      <div 
        className="text-sm px-4 py-2 bg-green-100 text-green-800 cursor-help"
        title={`Status: ${status.status} ${status.statusText}`}
      >
        <span className="inline-flex items-center">
          <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
          Connected{status.lastChecked && ` - Last checked: ${status.lastChecked.toLocaleTimeString()}`}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="text-sm px-4 py-2 bg-red-100 text-red-800 cursor-help"
      title={`${status.error || 'Connection failed'} (${status.status})`}
    >
      <span className="inline-flex items-center">
        <span className="w-2 h-2 mr-2 bg-red-500 rounded-full"></span>
        Disconnected - Please check your internet connection
      </span>
    </div>
  );
}