/**
 * GovCon-specific alert computations: stale inbound detection,
 * teaming-window visibility, and official-email action summaries.
 *
 * All functions are pure reads against the proposal DB — no mutations.
 */

import { computeUrgencyState, PRESSURE_THRESHOLDS } from './bridge/growth-constants.js';

// ── Stale Inbound Alerts ─────────────────────────────────────────────────────
// An "inbound" is any proposal whose source indicates external origin
// (solicitation, RFP, inquiry, teaming request) that has not received a
// meaningful outbound touch within threshold days.

const INBOUND_SOURCES = new Set([
  'solicitation', 'rfp', 'rfq', 'rfi', 'inquiry', 'inbound',
  'teaming_request', 'sam_gov', 'portal', 'email_inbound',
]);

const STALE_INBOUND_DAYS = {
  urgent: 2,
  high: 3,
  medium: 5,
  low: 10,
};

function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

function isInbound(proposal) {
  const source = (
    proposal.metadata?.source ||
    proposal.metadata?.type ||
    proposal.source ||
    ''
  ).toLowerCase().replace(/[\s-]/g, '_');
  return INBOUND_SOURCES.has(source);
}

export function detectStaleInbounds(proposals) {
  const alerts = [];
  const now = new Date().toISOString();

  for (const p of proposals) {
    if (!isInbound(p)) continue;
    if (['submitted', 'won', 'lost', 'archived', 'cancelled'].includes(p.status)) continue;

    const meta = p.metadata || {};
    const lastTouch = meta.lastOutreachDispatchAt
      || meta.lastMeaningfulDate
      || p.updatedAt
      || p.createdAt;
    const days = daysSince(lastTouch);
    const priority = meta.priority || p.priority || 'medium';
    const threshold = STALE_INBOUND_DAYS[priority] || STALE_INBOUND_DAYS.medium;

    if (days >= threshold) {
      const urgency = computeUrgencyState(lastTouch, meta.currentMilestone || 'identified');
      alerts.push({
        proposalId: p.id,
        title: p.title,
        agency: p.agency || '',
        solicitationNumber: meta.solicitationNumber || '',
        contactEmail: meta.contactEmail || p.contactEmail || '',
        contactName: meta.contactName || p.contactName || '',
        priority,
        urgency,
        daysSinceLastTouch: days,
        threshold,
        lastTouchAt: lastTouch || null,
        dueDate: meta.dueDate || p.dueDate || null,
        source: meta.source || meta.type || p.source || '',
        suggestedAction: days >= threshold * 2
          ? 'escalate'
          : 'follow_up',
        suggestedTemplate: days >= threshold * 2
          ? 'stale-followup-escalation'
          : 'stale-followup',
        computedAt: now,
      });
    }
  }

  // Most urgent first
  alerts.sort((a, b) => {
    const urgencyOrder = { stale: 0, warning: 1, watch: 2, hot: 3 };
    return (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4)
      || a.daysSinceLastTouch - b.daysSinceLastTouch;
  });

  return alerts;
}

// ── Teaming Window Visibility ────────────────────────────────────────────────
// Shows proposals where a teaming arrangement is relevant and the window
// to form/respond to teaming is closing.

const TEAMING_WINDOW_DAYS = 14; // default teaming response window

export function computeTeamingWindows(proposals) {
  const windows = [];
  const now = Date.now();

  for (const p of proposals) {
    if (['submitted', 'won', 'lost', 'archived', 'cancelled'].includes(p.status)) continue;
    const meta = p.metadata || {};

    // Explicit teaming fields
    const teamingDeadline = meta.teamingDeadline || meta.teamingResponseDeadline || null;
    const dueDate = meta.dueDate || p.dueDate || null;
    const hasTeamingIntent = !!(
      meta.teamingPartner ||
      meta.teamingRole ||
      meta.isTeaming ||
      (p.title || '').toLowerCase().includes('teaming') ||
      (meta.source || '').toLowerCase().includes('teaming')
    );

    if (!hasTeamingIntent && !teamingDeadline) continue;

    // If no explicit teaming deadline, derive from dueDate minus buffer
    const effectiveDeadline = teamingDeadline
      || (dueDate ? new Date(new Date(dueDate).getTime() - TEAMING_WINDOW_DAYS * 86_400_000).toISOString() : null);

    if (!effectiveDeadline) continue;

    const msRemaining = new Date(effectiveDeadline).getTime() - now;
    const daysRemaining = Math.ceil(msRemaining / 86_400_000);

    // Only show windows that are within 30 days or past due
    if (daysRemaining > 30) continue;

    let windowStatus;
    if (daysRemaining < 0) windowStatus = 'expired';
    else if (daysRemaining <= 2) windowStatus = 'critical';
    else if (daysRemaining <= 7) windowStatus = 'closing';
    else windowStatus = 'open';

    windows.push({
      proposalId: p.id,
      title: p.title,
      agency: p.agency || '',
      solicitationNumber: meta.solicitationNumber || '',
      teamingPartner: meta.teamingPartner || null,
      teamingRole: meta.teamingRole || null, // 'prime' | 'sub'
      contactEmail: meta.contactEmail || p.contactEmail || '',
      contactName: meta.contactName || p.contactName || '',
      teamingDeadline: effectiveDeadline,
      proposalDueDate: dueDate,
      daysRemaining,
      windowStatus,
      suggestedTemplate: windowStatus === 'expired'
        ? 'stale-followup'
        : 'teaming-deadline-reminder',
    });
  }

  // Most critical first
  windows.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return windows;
}

// ── Official Email Dispatch History (read-only summary) ──────────────────────

export function getOfficialDispatchSummary(proposals) {
  const dispatches = [];

  for (const p of proposals) {
    const records = p.metadata?.outreachDispatches || [];
    for (const d of records) {
      if (d.gmail?.provider === 'smtp' || d.lane === 'official_govcon') {
        dispatches.push({
          proposalId: p.id,
          proposalTitle: p.title,
          ...d,
        });
      }
    }
  }

  dispatches.sort((a, b) => (b.dispatchedAt || b.createdAt || '').localeCompare(a.dispatchedAt || a.createdAt || ''));
  return dispatches.slice(0, 50);
}
