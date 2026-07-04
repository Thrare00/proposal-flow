import { recomputeProposalState } from './proposalWorkflow.js';
import { getRecommendedWindows, normalizePosture } from '../src/lib/pursuitTiming.js';

const PROPOSAL_TYPE_MAP = Object.freeze({
  federal: 'federal',
  commercial: 'commercial',
  state_local: 'state_local',
  local_state: 'state_local',
  state: 'state_local',
  local: 'state_local',
});

const PROPOSAL_STATUS_MAP = Object.freeze({
  intake: 'intake',
  qualification: 'qualification',
  pre_solicitation: 'pre_solicitation',
  research: 'research',
  technical_compliance: 'technical_compliance',
  pricing_strategy: 'pricing_strategy',
  pricing_packaging: 'pricing_strategy',
  drafting: 'drafting',
  review: 'review',
  google_docs_final: 'google_docs_final',
  submitted: 'submitted',
  closed: 'closed',
  outline: 'pre_solicitation',
  internal_review: 'review',
  final_review: 'google_docs_final',
  // Canonical workflow stage IDs (shared/proposalWorkflow.js)
  ingestion: 'intake',
  compliance: 'technical_compliance',
  strategy: 'pre_solicitation',
  red_team: 'review',
});

const DEFAULT_PRE_SOLICITATION = Object.freeze({
  stage: 'research',
  captureComplete: false,
  notes: '',
});

export function normalizeProposalType(value) {
  if (typeof value !== 'string') {
    return 'federal';
  }

  return PROPOSAL_TYPE_MAP[value] || 'federal';
}

export function normalizeProposalStatus(value) {
  if (typeof value !== 'string') {
    return 'intake';
  }

  return PROPOSAL_STATUS_MAP[value] || 'intake';
}

export function normalizeProposalMetadata(metadata = {}, proposal = {}) {
  const normalizedMetadata = metadata && typeof metadata === 'object'
    ? { ...metadata }
    : {};

  normalizedMetadata.workflowSteps = Array.isArray(normalizedMetadata.workflowSteps)
    ? normalizedMetadata.workflowSteps
    : [];

  normalizedMetadata.preSolicitation = {
    ...DEFAULT_PRE_SOLICITATION,
    ...(normalizedMetadata.preSolicitation && typeof normalizedMetadata.preSolicitation === 'object'
      ? normalizedMetadata.preSolicitation
      : {}),
  };

  if (!normalizedMetadata.sourceType) {
    normalizedMetadata.sourceType = (proposal.solicitationTextRaw || proposal.solicitationText) ? 'solicitation' : 'manual';
  }

  normalizedMetadata.intakeAnalysis = normalizedMetadata.intakeAnalysis && typeof normalizedMetadata.intakeAnalysis === 'object'
    ? { ...normalizedMetadata.intakeAnalysis }
    : {};

  normalizedMetadata.rankingMetadata = normalizedMetadata.rankingMetadata && typeof normalizedMetadata.rankingMetadata === 'object'
    ? { ...normalizedMetadata.rankingMetadata }
    : {};

  normalizedMetadata.awardIntel = normalizedMetadata.awardIntel && typeof normalizedMetadata.awardIntel === 'object'
    ? { ...normalizedMetadata.awardIntel }
    : normalizedMetadata.awardIntel || null;

  const resolvedPosture = normalizePosture(
    normalizedMetadata.pursuitPosture
    || normalizedMetadata.captureTiming?.pursuitPosture
    || proposal.pursuitPosture
    || 'either',
  );

  const recommended = getRecommendedWindows(
    proposal.dueDate || normalizedMetadata.dueDate,
    resolvedPosture,
  );

  normalizedMetadata.captureTiming = {
    pursuitPosture: resolvedPosture,
    pursuitBucket: normalizedMetadata.pursuitBucket || proposal.pursuitBucket || recommended.bucket,
    timingBucket: recommended.timingBucket,
    daysOut: Number.isFinite(normalizedMetadata.daysOut) ? normalizedMetadata.daysOut : recommended.daysOut,
    intentToBidDate: normalizedMetadata.intentToBidDate || proposal.intentToBidDate || recommended.intentToBidDate,
    teamingStartDate: normalizedMetadata.teamingStartDate || proposal.teamingStartDate || recommended.teamingStartDate,
    primeOutreachStartDate: normalizedMetadata.primeOutreachStartDate || proposal.primeOutreachStartDate || recommended.primeOutreachStartDate,
    primeOutreachEndDate: normalizedMetadata.primeOutreachEndDate || proposal.primeOutreachEndDate || recommended.primeOutreachEndDate,
    recommendedWindow: recommended,
  };

  normalizedMetadata.rapidResponse = {
    inquiryStatus: normalizedMetadata.rapidResponse?.inquiryStatus || 'none',
    acknowledgedAt: normalizedMetadata.rapidResponse?.acknowledgedAt || null,
    lastInboundAt: normalizedMetadata.rapidResponse?.lastInboundAt || null,
    responseOwner: normalizedMetadata.rapidResponse?.responseOwner || '',
    nextDraftType: normalizedMetadata.rapidResponse?.nextDraftType || '',
    notes: normalizedMetadata.rapidResponse?.notes || '',
  };

  // Structured decisions — go/no-go, bid/no-bid, partner selections
  normalizedMetadata.decisions = Array.isArray(normalizedMetadata.decisions)
    ? normalizedMetadata.decisions
    : [];

  // Proposal-linked blockers (synced from operator updates)
  normalizedMetadata.blockers = Array.isArray(normalizedMetadata.blockers)
    ? normalizedMetadata.blockers
    : [];

  return normalizedMetadata;
}

// Valid intake lane values. Drives the 5-column intake view.
export const INTAKE_LANES = Object.freeze([
  'active_pursuit',  // score >= 65 — cleared for proposal workflow
  'review_queue',    // score 45–64 — needs human decision before activating
  'watchlist',       // score < 45 — monitor only
  'award_intel',     // already awarded / award notice — never active, intel only
  'archive',         // closed, submitted, expired, or manually retired
]);

/**
 * Derive intake lane from proposal state.
 * Returns null if still unclassified (housekeeping will backfill once scored).
 * Does NOT override a value already present — call only when intakeLane is null/unknown.
 */
// A NOGO / no-bid / declined decision retires an opportunity. Any of these
// signals means the item should drop off the active board (→ archive lane).
export function isNoGoOutcome(proposal = {}) {
  const meta = proposal.metadata || {};
  const oc = String(proposal.outcomeStatus || '').toLowerCase();
  if (['no_bid', 'no-bid', 'nobid', 'lost', 'declined', 'rejected'].includes(oc)) return true;
  if (String(proposal.status || '').toLowerCase() === 'declined') return true;
  const decisions = Array.isArray(meta.decisions) ? meta.decisions : [];
  return decisions.some((d) =>
    ['no_go', 'no-go', 'nogo', 'no_bid', 'no-bid', 'rejected', 'declined'].includes(
      String(d && d.decision || '').toLowerCase()
    )
  );
}

export function deriveIntakeLane(proposal) {
  const meta = proposal.metadata || {};
  const notesLower = (proposal.notes || '').toLowerCase();
  const titleLower = (proposal.title || '').toLowerCase();
  const combined = `${titleLower} ${notesLower}`;

  // Hard gate: award intel (check before archive so awards don't silently disappear)
  if (
    meta.isAwardNotice ||
    meta.awardIntel ||
    combined.includes('award notice') ||
    combined.includes('awarded to') ||
    combined.includes('contract award')
  ) return 'award_intel';

  // Hard gate: NOGO/no-bid/declined → archive (keeps NOGO'd items off the active board)
  if (isNoGoOutcome(proposal)) return 'archive';

  // Hard gate: archive
  if (proposal.status === 'closed' || proposal.status === 'submitted') return 'archive';
  if (proposal.dueDate) {
    const due = new Date(proposal.dueDate);
    if (!isNaN(due) && due < new Date()) return 'archive';
  }

  // Score-based routing (prefer morpheusScore when present — it's the patched intake value)
  const score = meta.morpheusScore ?? meta.fitScore ?? null;
  if (score === null) return null; // unscored — housekeeping will backfill
  if (score >= 65) return 'active_pursuit';
  if (score >= 45) return 'review_queue';
  return 'watchlist';
}

export function normalizeProposal(proposal = {}) {
  const timestamp = new Date().toISOString();
  const normalized = {
    ...proposal,
    title: proposal.title || 'Untitled Proposal',
    agency: proposal.agency || 'Unknown Agency',
    dueDate: proposal.dueDate || timestamp,
    status: normalizeProposalStatus(proposal.status),
    notes: typeof proposal.notes === 'string' ? proposal.notes : '',
    solicitationText: typeof proposal.solicitationText === 'string' ? proposal.solicitationText : '',
    solicitationTextRaw: typeof proposal.solicitationTextRaw === 'string'
      ? proposal.solicitationTextRaw
      : (typeof proposal.solicitationText === 'string' ? proposal.solicitationText : ''),
    type: normalizeProposalType(proposal.type),
    createdAt: proposal.createdAt || timestamp,
    updatedAt: proposal.updatedAt || proposal.createdAt || timestamp,
    tasks: Array.isArray(proposal.tasks) ? proposal.tasks : [],
    files: Array.isArray(proposal.files) ? proposal.files : [],
    metadata: normalizeProposalMetadata(proposal.metadata, proposal),
    // intakeLane: set at intake or backfilled by housekeeping. Preserved if already a valid lane.
    intakeLane: INTAKE_LANES.includes(proposal.intakeLane) ? proposal.intakeLane : null,
  };

  // Auto-derive lane if none set yet (so new proposals don't sit unclassified until housekeeping)
  if (!normalized.intakeLane) {
    normalized.intakeLane = deriveIntakeLane(normalized) ?? null;
  }

  return recomputeProposalState(normalized);
}
