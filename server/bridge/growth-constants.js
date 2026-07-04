/**
 * Growth-critical constants: milestones, enums, activity rules, pressure model.
 *
 * Single source of truth for the growth layer across the bridge,
 * Twenty client, dashboard, and automation surfaces.
 */

export const MILESTONES = [
  'identified',
  'introduced',
  'first_response',
  'first_conversation',
  'network_connected',
  'proof_shared',
  'objection_or_need_surfaced',
  'qualified',
  'concrete_ask_made',
  'followup_cadence_active',
  'opportunity_or_referral_opened',
  'nurture',
];

export const MILESTONE_INDEX = Object.fromEntries(MILESTONES.map((milestone, index) => [milestone, index]));

export function nextMilestoneAfter(current) {
  const index = MILESTONE_INDEX[current];
  if (index == null || index >= MILESTONES.length - 1) return null;
  return MILESTONES[index + 1];
}

export const OBJECTION_TYPES = [
  'price',
  'scope',
  'trust',
  'timing',
  'budget',
  'authority',
  'process',
  'no_response',
  'other',
];

// Growth-layer internal temps (used for urgency modeling).
// Canonical CRM relationship temps are in shared/crm-constants.js: cold, warm, active, trusted
export const RELATIONSHIP_TEMPS = ['cold', 'warm', 'hot', 'compounding', 'dormant'];

export const ASK_TYPES = [
  'intro',
  'meeting',
  'quote',
  'vendor_packet',
  'registration',
  'proposal',
  'referral',
  'information',
  'capability_brief',
  'decision',
];

export const DECISION_MAKER_STATUSES = [
  'unknown',
  'influencer',
  'recommender',
  'decision_maker',
  'gatekeeper',
  'procurement',
  'owner_exec',
];

export const URGENCY_STATES = ['hot', 'watch', 'warning', 'stale'];

export const VENDOR_REG_STATUSES = ['pending', 'done', 'paywalled_blocked'];

export const MEANINGFUL_ACTIVITY_TYPES = [
  'real_intro_sent',
  'reply_received',
  'real_call_held',
  'connection_made',
  'proof_capability_sent',
  'portal_progress',
  'docs_submitted',
  'registration_submitted',
  'followup_ask_made',
  'intro_request_made',
  'referral_received',
  'proposal_submitted',
  'receipt_confirmed',
  'blocker_resolved',
  'next_action_completed',
];

export const NON_MEANINGFUL_PATTERNS = [
  'internal_note_only',
  'passive_browse',
  'duplicate_low_value_followup',
  'generic_record_edit',
];

export function isMeaningfulActivity(activity) {
  if (!activity) return false;

  if (activity.activity_type) {
    if (MEANINGFUL_ACTIVITY_TYPES.includes(activity.activity_type)) return true;
    if (NON_MEANINGFUL_PATTERNS.includes(activity.activity_type)) return false;
  }

  const channel = (activity.channel || activity.type || '').toLowerCase();
  const outcome = (activity.outcome || '').toLowerCase();
  const body = (activity.body || '').toLowerCase();
  const title = (activity.title || '').toLowerCase();

  if (['call', 'in-person'].includes(channel)) return true;
  if (channel === 'email' && (outcome || body.length > 50)) return true;
  if (channel === 'portal' && outcome) return true;

  if (channel === 'note') {
    if (outcome) return true;
    if (/\b(completed|submitted|contacted|identified|sent|called|met|resolved|registered|followed.up|responded|reviewed|approved|awarded|signed|delivered)\b/.test(title)) return true;
    if (body.length > 50) return true;
    return false;
  }

  return !!outcome;
}

export const PRESSURE_THRESHOLDS = {
  hot: 0,
  watch: 5,
  warning: 10,
  stale: 21,
};

export function computeUrgencyState(lastMeaningfulDate, currentMilestone) {
  if (!lastMeaningfulDate) return 'watch';

  const daysSince = Math.floor((Date.now() - new Date(lastMeaningfulDate).getTime()) / 86400000);
  const multiplier = currentMilestone === 'nurture' ? 3 : 1;

  if (daysSince < PRESSURE_THRESHOLDS.watch * multiplier) return 'hot';
  if (daysSince < PRESSURE_THRESHOLDS.warning * multiplier) return 'watch';
  if (daysSince < PRESSURE_THRESHOLDS.stale * multiplier) return 'warning';
  return 'stale';
}

export function buildEscalation({
  who,
  account,
  contact,
  whyCritical,
  nextAction,
  owner,
  deadline,
  desiredOutcome,
}) {
  return {
    who: who || account || 'unknown',
    account: account || null,
    contact: contact || null,
    whyCritical: whyCritical || '',
    nextAction: nextAction || '',
    owner: owner || 'unassigned',
    deadline: deadline || null,
    desiredOutcome: desiredOutcome || '',
    generatedAt: new Date().toISOString(),
  };
}
