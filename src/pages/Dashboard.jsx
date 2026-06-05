import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import { getPursuitBucket, daysUntilDate } from '../lib/pursuitTiming.js';
import CaptureTimeline from '../components/CaptureTimeline.jsx';
import MustSubmitPanel from '../components/MustSubmitPanel.jsx';

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString();
}

export default function Dashboard() {
  const { proposals = [] } = useProposalContext();

  const upcomingTeaming = useMemo(() => {
    return [...proposals]
      .filter((proposal) => proposal.metadata?.captureTiming?.primeOutreachStartDate)
      .sort((a, b) => new Date(a.metadata.captureTiming.primeOutreachStartDate) - new Date(b.metadata.captureTiming.primeOutreachStartDate))
      .slice(0, 5);
  }, [proposals]);

  const staleInbound = useMemo(() => {
    return proposals.filter((proposal) => {
      const rapid = proposal.metadata?.rapidResponse || {};
      return ['new_inbound', 'contact_found', 'draft_needed'].includes(rapid.inquiryStatus) && !rapid.acknowledgedAt;
    });
  }, [proposals]);

  const staleTeaming = useMemo(() => {
    const now = new Date();
    return proposals.filter((p) => {
      if (p.status === 'closed' || p.status === 'submitted') return false;
      const timing = p.metadata?.captureTiming;
      if (!timing?.primeOutreachStartDate) return false;
      const start = new Date(timing.primeOutreachStartDate);
      if (start > now) return false;
      return !timing.teamingConfirmed;
    });
  }, [proposals]);

  const b2622 = useMemo(() => proposals.find((proposal) => proposal.solicitation_number === 'B-2622LM'), [proposals]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Proposal Flow intake now supports early watch, teaming timing, and fast-response follow-up.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Stale inbound</p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{staleInbound.length}</p>
          <p className="mt-1 text-xs text-amber-800">Unacknowledged inbound contacts.</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-900">Stale teaming</p>
          <p className="mt-2 text-3xl font-bold text-rose-950">{staleTeaming.length}</p>
          <p className="mt-1 text-xs text-rose-800">Outreach window open, no action taken.</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Teaming windows</p>
          <p className="mt-2 text-3xl font-bold text-blue-950">{upcomingTeaming.length}</p>
          <p className="mt-1 text-xs text-blue-800">Nearest prime outreach windows.</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">180-day watch</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">{proposals.filter((proposal) => { const d = daysUntilDate(proposal.dueDate); return d !== null && d >= 0 && d <= 180; }).length}</p>
          <p className="mt-1 text-xs text-emerald-800">Active capture horizon records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MustSubmitPanel proposals={proposals} />
        </div>
        <div className="lg:col-span-2">
          <CaptureTimeline proposals={proposals} />
        </div>
      </div>

      {b2622 && (
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Highlighted opportunity</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">{b2622.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{b2622.agency} • {b2622.solicitation_number}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Bonfire portal</span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">Due {formatDate(b2622.dueDate)}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">{getPursuitBucket(daysUntilDate(b2622.dueDate)).label}</span>
              </div>
            </div>
            <a href={b2622.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:underline">Open source</a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Upcoming teaming windows</h2>
          <div className="mt-3 space-y-3">
            {upcomingTeaming.length === 0 && <p className="text-sm text-gray-500">No outreach windows scheduled yet.</p>}
            {upcomingTeaming.map((proposal) => (
              <div key={proposal.id} className="rounded border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{proposal.title}</p>
                <p className="text-sm text-gray-600">{proposal.agency}</p>
                <p className="mt-1 text-sm text-gray-700">Prime outreach: {formatDate(proposal.metadata.captureTiming.primeOutreachStartDate)} to {formatDate(proposal.metadata.captureTiming.primeOutreachEndDate)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Stale inbound checklist</h2>
          <div className="mt-3 space-y-3">
            {staleInbound.length === 0 && <p className="text-sm text-gray-500">Nothing stale right now.</p>}
            {staleInbound.map((proposal) => (
              <div key={proposal.id} className="rounded border border-amber-200 bg-amber-50 p-3">
                <p className="font-medium text-amber-950">{proposal.title}</p>
                <p className="text-sm text-amber-900">Status: {proposal.metadata?.rapidResponse?.inquiryStatus || 'new_inbound'}</p>
                <p className="mt-1 text-sm text-amber-800">Create or send an acknowledgment draft within 3 to 5 minutes.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Stale teaming windows</h2>
          <div className="mt-3 space-y-3">
            {staleTeaming.length === 0 && <p className="text-sm text-gray-500">No stale teaming windows.</p>}
            {staleTeaming.map((proposal) => (
              <div key={proposal.id} className="rounded border border-rose-200 bg-rose-50 p-3">
                <p className="font-medium text-rose-950">{proposal.title}</p>
                <p className="text-sm text-rose-900">{proposal.agency}</p>
                <p className="mt-1 text-sm text-rose-800">Outreach opened {formatDate(proposal.metadata.captureTiming.primeOutreachStartDate)} — no teaming confirmed.</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/board" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
          <h2 className="text-xl font-semibold">Flow Board</h2>
          <p className="text-gray-600">View and manage your proposals</p>
        </Link>
        <Link to="/reminders" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
          <h2 className="text-xl font-semibold">Reminders</h2>
          <p className="text-gray-600">View upcoming deadlines</p>
        </Link>
        <Link to="/calendar" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <p className="text-gray-600">View your schedule</p>
        </Link>
      </div>
    </div>
  );
}
