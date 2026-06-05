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
  outline: 'pre_solicitation',
  internal_review: 'review',
  final_review: 'google_docs_final',
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
    normalizedMetadata.sourceType = proposal.solicitationText ? 'solicitation' : 'manual';
  }

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
    type: normalizeProposalType(proposal.type),
    createdAt: proposal.createdAt || timestamp,
    updatedAt: proposal.updatedAt || proposal.createdAt || timestamp,
    tasks: Array.isArray(proposal.tasks) ? proposal.tasks : [],
    files: Array.isArray(proposal.files) ? proposal.files : [],
    metadata: normalizeProposalMetadata(proposal.metadata, proposal),
  };

  return recomputeProposalState(normalized);
}
