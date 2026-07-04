/**
 * Canonical CRM constants for the Twenty next-gen CRM system.
 *
 * Single source of truth for funnel stages, response statuses,
 * relationship states, blocker statuses, proof states, activity types,
 * and decision-maker roles.
 *
 * Twenty owns: leads, relationships, outreach, follow-up, nurture.
 * Proposal Flow owns: proposals, bids, compliance, submission workflows.
 */

// ── Canonical Funnel Stages ──────────────────────────────────────────
export const FUNNEL_STAGES = [
  'identified',
  'intro_sent',
  'engaged',
  'qualified',
  'proposal_active',
  'submitted',
  'won',
  'completed',
  'nurture',
  'lost',
  'paused',
  'blocked',
];

export const FUNNEL_STAGE_SET = new Set(FUNNEL_STAGES);

export const FUNNEL_STAGE_INDEX = Object.fromEntries(
  FUNNEL_STAGES.map((stage, i) => [stage, i]),
);

/** Active stages where follow-up discipline matters. */
export const ACTIVE_FUNNEL_STAGES = new Set([
  'intro_sent',
  'engaged',
  'qualified',
  'proposal_active',
  'submitted',
]);

/** Terminal stages (won/lost/completed). */
export const TERMINAL_FUNNEL_STAGES = new Set(['won', 'completed', 'lost']);

// ── Response Status ──────────────────────────────────────────────────
export const RESPONSE_STATUSES = [
  'uncontacted',
  'contacted',
  'replied',
  'redirected',
  'no_response',
  'bounced',
  'auto_reply',
  'meeting_requested',
  'docs_requested',
  'quote_requested',
  'disqualified',
  'won',
  'lost',
];

export const RESPONSE_STATUS_SET = new Set(RESPONSE_STATUSES);

// ── Relationship Temperature ─────────────────────────────────────────
export const RELATIONSHIP_TEMPERATURES = ['cold', 'warm', 'active', 'trusted'];

export const RELATIONSHIP_TEMP_SET = new Set(RELATIONSHIP_TEMPERATURES);

// ── Decision Maker Status ────────────────────────────────────────────
export const DECISION_MAKER_STATUSES = [
  'unknown',
  'influencer',
  'decision_maker',
  'gatekeeper',
  'redirect_only',
];

export const DECISION_MAKER_STATUS_SET = new Set(DECISION_MAKER_STATUSES);

// ── Blocker Status ───────────────────────────────────────────────────
export const BLOCKER_STATUSES = [
  'none',
  'waiting_on_buyer',
  'waiting_on_internal',
  'waiting_on_docs',
  'waiting_on_pricing',
  'waiting_on_site_visit',
  'waiting_on_compliance',
  'waiting_on_signature',
  'dead_contact_path',
];

export const BLOCKER_STATUS_SET = new Set(BLOCKER_STATUSES);

// ── Proof State ──────────────────────────────────────────────────────
export const PROOF_STATES = [
  'not_applicable',
  'needed',
  'partial',
  'complete',
  'review_requested',
  'review_received',
];

export const PROOF_STATE_SET = new Set(PROOF_STATES);

// ── Activity Types ───────────────────────────────────────────────────

export const OUTBOUND_ACTIVITY_TYPES = [
  'intro_email',
  'follow_up_email',
  'intro_call',
  'voicemail',
  'intro_text',
  'follow_up_text',
  'portal_submission',
  'vendor_packet_sent',
  'quote_sent',
  'proposal_submitted',
  'check_in',
  'review_request',
  'referral_ask',
];

export const INBOUND_ACTIVITY_TYPES = [
  'reply_received',
  'redirect_received',
  'bounce_received',
  'meeting_request_received',
  'docs_request_received',
  'scope_update_received',
  'award_notice',
  'loss_notice',
];

export const ALL_ACTIVITY_TYPES = [...OUTBOUND_ACTIVITY_TYPES, ...INBOUND_ACTIVITY_TYPES];
export const ACTIVITY_TYPE_SET = new Set(ALL_ACTIVITY_TYPES);
export const OUTBOUND_ACTIVITY_SET = new Set(OUTBOUND_ACTIVITY_TYPES);
export const INBOUND_ACTIVITY_SET = new Set(INBOUND_ACTIVITY_TYPES);

// ── Stage Mapping: Twenty raw → canonical funnel ─────────────────────
// Maps Twenty's native opportunity stages to the canonical funnel.
export const TWENTY_STAGE_TO_FUNNEL = {
  NEW: 'identified',
  LEAD: 'identified',
  SCREENING: 'intro_sent',
  MEETING_SCHEDULED: 'engaged',
  MEETING: 'engaged',
  QUALIFIED: 'qualified',
  PROPOSAL_SENT: 'submitted',
  PROPOSAL: 'proposal_active',
  WON: 'won',
  CUSTOMER: 'completed',
  LOST: 'lost',
};

/**
 * Normalize any stage value into the canonical funnel.
 * Accepts Twenty native stages, legacy stages, or already-canonical values.
 */
export function normalizeFunnelStage(raw) {
  if (!raw) return 'identified';
  const upper = String(raw).toUpperCase().trim();
  if (TWENTY_STAGE_TO_FUNNEL[upper]) return TWENTY_STAGE_TO_FUNNEL[upper];
  const lower = String(raw).toLowerCase().trim();
  if (FUNNEL_STAGE_SET.has(lower)) return lower;
  // Legacy Proposal Flow stage mapping
  const legacyMap = {
    intake: 'identified',
    qualification: 'qualified',
    pre_solicitation: 'qualified',
    research: 'qualified',
    technical_compliance: 'proposal_active',
    pricing_strategy: 'proposal_active',
    drafting: 'proposal_active',
    review: 'proposal_active',
    red_team: 'proposal_active',
    final_review: 'proposal_active',
    google_docs_final: 'submitted',
    submitted: 'submitted',
    awarded: 'won',
    lead: 'identified',
    proposal_sent: 'submitted',
  };
  if (legacyMap[lower]) return legacyMap[lower];
  return 'identified';
}

// ── Saved View Definitions ───────────────────────────────────────────
export const SAVED_VIEWS = [
  {
    id: 'due_today',
    name: 'Due Today',
    description: 'Opportunities and tasks with next action due today',
    filter: (opp, now) => {
      const today = now.toISOString().slice(0, 10);
      return opp.next_action_date && opp.next_action_date.slice(0, 10) === today;
    },
  },
  {
    id: 'overdue',
    name: 'Overdue',
    description: 'Opportunities and tasks past their next action date',
    filter: (opp, now) =>
      opp.next_action_date && new Date(opp.next_action_date) < now
      && !TERMINAL_FUNNEL_STAGES.has(opp.funnel_stage),
  },
  {
    id: 'replies_to_process',
    name: 'Replies To Process',
    description: 'Opportunities where a reply was received but not yet processed',
    filter: (opp) => opp.response_status === 'replied',
  },
  {
    id: 'intro_sent_no_reply',
    name: 'Intro Sent, No Reply',
    description: 'Opportunities where intro was sent but no response received',
    filter: (opp) =>
      opp.funnel_stage === 'intro_sent'
      && (opp.response_status === 'contacted' || opp.response_status === 'no_response'),
  },
  {
    id: 'proposal_active',
    name: 'Proposal Active',
    description: 'Opportunities in active proposal development',
    filter: (opp) => opp.funnel_stage === 'proposal_active',
  },
  {
    id: 'submitted_awaiting',
    name: 'Submitted Awaiting Decision',
    description: 'Proposals submitted and awaiting buyer decision',
    filter: (opp) => opp.funnel_stage === 'submitted',
  },
  {
    id: 'won_missing_proof',
    name: 'Won Missing Proof/Review',
    description: 'Won opportunities missing proof documentation or review',
    filter: (opp) =>
      opp.funnel_stage === 'won'
      && opp.proof_state !== 'complete'
      && opp.proof_state !== 'not_applicable',
  },
  {
    id: 'nurture_due',
    name: 'Nurture Due',
    description: 'Nurture-stage relationships due for a touch',
    filter: (opp, now) =>
      opp.funnel_stage === 'nurture'
      && opp.urgencyState !== 'hot',
  },
  {
    id: 'blocked',
    name: 'Blocked',
    description: 'Opportunities with active blockers',
    filter: (opp) =>
      opp.blocker_status && opp.blocker_status !== 'none',
  },
];

export const SAVED_VIEW_IDS = SAVED_VIEWS.map((v) => v.id);
