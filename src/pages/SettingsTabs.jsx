import React, { useEffect, useState } from 'react';
import CadenceSettings from './CadenceSettings.jsx';
import SystemHealth from './SystemHealth.jsx';

export default function SettingsTabs() {
  const [tab, setTab] = useState('cadence');

  // Initialize from ?tab= query param
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const initial = params.get('tab');
      if (initial === 'cadence' || initial === 'health') {
        setTab(initial);
      }
    } catch {}
  }, []);

  // Keep URL in sync (replaceState to avoid history spam)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url);
    } catch {}
  }, [tab]);

  const tabs = [
    { id: 'cadence', label: 'Cadence' },
    { id: 'health', label: 'System Health' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Settings</h1>
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto pb-px" aria-label="Tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {tab === 'cadence' && <CadenceSettings />}
        {tab === 'health' && <SystemHealth />}
      </div>
    </div>
  );
}
