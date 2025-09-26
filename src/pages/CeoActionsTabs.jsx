import React, { useEffect, useMemo, useState } from 'react';
import CeoActions from './CeoActions.jsx';
import Calendar from './Calendar.jsx';
import Reminders from './Reminders.jsx';
import Reports from './Reports.jsx';
import Directories from './Directories.jsx';
import { getReports } from '../lib/api.js';

export default function CeoActionsTabs() {
  const [tab, setTab] = useState('ceo');
  const [latestDaily, setLatestDaily] = useState(null);
  const [latestWeekly, setLatestWeekly] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState(null);

  useEffect(() => {
    if (tab !== 'reports') return;
    let mounted = true;
    (async () => {
      try {
        setLoadingReports(true);
        setReportsError(null);
        const data = await getReports();
        const items = Array.isArray(data?.reports) ? data.reports : (Array.isArray(data) ? data : []);
        // Find most recent Daily and Weekly by updated time
        const byUpdated = (a, b) => new Date(b.updatedTime || b.createdTime) - new Date(a.updatedTime || a.createdTime);
        const daily = items.filter(r => /Daily Report/i.test(r.name)).sort(byUpdated)[0] || null;
        const weekly = items.filter(r => /Weekly Report/i.test(r.name)).sort(byUpdated)[0] || null;
        if (!mounted) return;
        setLatestDaily(daily);
        setLatestWeekly(weekly);
      } catch (e) {
        if (!mounted) return;
        setReportsError(e.message || 'Failed to load reports');
      } finally {
        if (mounted) setLoadingReports(false);
      }
    })();
    return () => { mounted = false; };
  }, [tab]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">CEO Actions</h1>
      <div className="border-b mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button className={`py-2 border-b-2 ${tab==='ceo'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('ceo')}>Checklist</button>
          <button className={`py-2 border-b-2 ${tab==='calendar'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('calendar')}>Calendar</button>
          <button className={`py-2 border-b-2 ${tab==='reminders'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('reminders')}>Reminders</button>
          <button className={`py-2 border-b-2 ${tab==='directories'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('directories')}>Directories</button>
          <button className={`py-2 border-b-2 ${tab==='reports'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`} onClick={()=>setTab('reports')}>Reports</button>
        </nav>
      </div>

      {tab==='ceo' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">CEO Actions Checklist</h2>
          {/* Reuse Reminders as a checklist view */}
          <Reminders />
        </div>
      )}
      {tab==='calendar' && <Calendar />}
      {tab==='reminders' && <Reminders />}
      {tab==='directories' && <Directories />}
      {tab==='reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Reports</h2>
          {reportsError && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">{reportsError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <h3 className="font-medium mb-2">Previous Daily Report</h3>
              {loadingReports ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : latestDaily ? (
                <div className="text-sm">
                  <div className="mb-2">{latestDaily.name}</div>
                  <a className="text-blue-600 hover:underline" href={latestDaily.webViewLink} target="_blank" rel="noreferrer">Open</a>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No daily report found.</p>
              )}
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <h3 className="font-medium mb-2">Current Weekly Report</h3>
              {loadingReports ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : latestWeekly ? (
                <div className="text-sm">
                  <div className="mb-2">{latestWeekly.name}</div>
                  <a className="text-blue-600 hover:underline" href={latestWeekly.webViewLink} target="_blank" rel="noreferrer">Open</a>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No weekly report found.</p>
              )}
            </div>
          </div>
          {/* Full list below for convenience */}
          <Reports />
        </div>
      )}
    </div>
  );
}
