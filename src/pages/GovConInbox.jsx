import React, { useMemo, useState } from 'react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ActivityFilterBar from '../components/activity/ActivityFilterBar.jsx';
import ActivityFeed from '../components/activity/ActivityFeed.jsx';
import ActivityCoverageNote from '../components/activity/ActivityCoverageNote.jsx';

// ── Event type registry ─────────────────────────────────────────────────────
const TYPE_META = {
  submission: { label: 'Submissions' },
  stage_change: { label: 'Stage Changes' },
  outreach: { label: 'Outreach' },
  workflow: { label: 'Workflow' },
};
const TYPE_ORDER = ['submission', 'stage_change', 'outreach', 'workflow'];

// Sources that are genuinely NOT recorded anywhere queryable (honest disclosure).
const MISSING_SOURCES = [
  {
    label: 'Gmail drafts & sends',
    reason: 'Emails composed from the old GovCon Inbox “draft/send” buttons were fired to Gmail without writing a record. Only worker-dispatched outreach is logged.',
  },
  {
    label: 'Discord notifications',
    reason: 'Proposal-Flow posts to Discord fire-and-forget and keeps no activity log of them.',
  },
  {
    label: 'Introductions sent',
    reason: 'No distinct “introduction” event type is stored yet — these appear under Outreach once the dispatch record captures a lane/template.',
  },
];

/**
 * Flatten every per-proposal event stream carried on the proposal objects into a
 * single typed, reverse-chronological feed. All data is real and already present
 * in useProposalContext — no separate endpoint, no fabricated events.
 */
function buildEvents(proposals) {
  const events = [];
  for (const p of proposals || []) {
    const meta = p.metadata || {};
    const proposalTitle = p.title || 'Untitled';

    // Submissions
    if (meta.submittedAt) {
      events.push({
        id: `${p.id}:submitted`,
        ts: meta.submittedAt,
        type: 'submission',
        label: 'Proposal submitted',
        proposalId: p.id,
        proposalTitle,
      });
    }

    // Stage changes (stageHandoffs: from -> to)
    (Array.isArray(p.stageHandoffs) ? p.stageHandoffs : []).forEach((h, i) => {
      if (!h || !h.timestamp) return;
      events.push({
        id: `${p.id}:handoff:${i}:${h.timestamp}`,
        ts: h.timestamp,
        type: 'stage_change',
        label: h.from && h.to ? `Stage: ${h.from} → ${h.to}` : 'Stage advanced',
        proposalId: p.id,
        proposalTitle,
        meta: { from: h.from, to: h.to, signal: h.signal },
      });
    });

    // Outreach dispatches
    (Array.isArray(meta.outreachDispatches) ? meta.outreachDispatches : []).forEach((d, i) => {
      const ts = d.dispatchedAt || d.createdAt;
      if (!ts) return;
      events.push({
        id: `${p.id}:outreach:${d.id || i}`,
        ts,
        type: 'outreach',
        label: d.subject ? `Outreach: ${d.subject}` : `Outreach email ${d.mode || 'queued'}`,
        proposalId: p.id,
        proposalTitle,
        meta: {
          to: Array.isArray(d.to) ? d.to.join(', ') : d.to,
          mode: d.mode,
          status: d.status,
        },
      });
    });

    // Workflow steps (labeled, timestamped work log)
    (Array.isArray(meta.workflowSteps) ? meta.workflowSteps : []).forEach((s, i) => {
      if (!s || !s.timestamp) return;
      events.push({
        id: `${p.id}:step:${s.id || i}`,
        ts: s.timestamp,
        type: 'workflow',
        label: s.label || 'Workflow step',
        proposalId: p.id,
        proposalTitle,
        meta: { stage: s.stage, status: s.status },
      });
    });
  }

  events.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  return events;
}

export default function GovConInbox() {
  const { proposals, isLoading } = useProposalContext();
  const [activeTypes, setActiveTypes] = useState([]); // empty = all
  const [query, setQuery] = useState('');

  const allEvents = useMemo(() => buildEvents(proposals), [proposals]);

  const typeChips = useMemo(
    () =>
      TYPE_ORDER.map((id) => ({
        id,
        label: TYPE_META[id].label,
        count: allEvents.filter((e) => e.type === id).length,
      })),
    [allEvents]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents.filter((e) => {
      if (activeTypes.length > 0 && !activeTypes.includes(e.type)) return false;
      if (q) {
        const hay = `${e.proposalTitle} ${e.label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allEvents, activeTypes, query]);

  const toggleType = (id) =>
    setActiveTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageHeader
        title="Activity"
        subtitle="Submissions, stage changes, and outreach across every proposal"
      />

      <ActivityCoverageNote missingSources={MISSING_SOURCES} />

      <ActivityFilterBar
        types={typeChips}
        active={activeTypes}
        onToggle={toggleType}
        query={query}
        onQuery={setQuery}
      />

      {isLoading && allEvents.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rare-crimson" />
        </div>
      ) : (
        <ActivityFeed
          events={filtered}
          emptyNote={
            allEvents.length === 0
              ? 'No recorded activity yet. Stage changes, submissions, and worker-dispatched outreach will appear here as they happen.'
              : 'No activity matches the current filters.'
          }
        />
      )}
    </div>
  );
}
