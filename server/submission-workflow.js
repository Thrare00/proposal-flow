import { createId, nowIso } from './automation-store.js';

export const REVIEW_DECISIONS = {
  pending: 'pending',
  approved: 'approved',
  needs_changes: 'needs_changes',
  rejected: 'rejected',
};

export function ensureSubmissionReview(proposal) {
  proposal.metadata = proposal.metadata || {};
  proposal.metadata.submissionReview = proposal.metadata.submissionReview || {
    status: REVIEW_DECISIONS.pending,
    requestedAt: null,
    reviewedAt: null,
    reviewer: null,
    notes: '',
    checklist: {
      finalDraftReady: false,
      pricingReady: false,
      attachmentsReady: false,
      portalReady: false,
      approvedByEric: false,
    },
    history: [],
  };
  return proposal.metadata.submissionReview;
}

export function appendSubmissionHistory(review, event) {
  review.history = Array.isArray(review.history) ? review.history : [];
  review.history.unshift({
    id: createId('review_event'),
    at: nowIso(),
    ...event,
  });
  review.history = review.history.slice(0, 50);
}

export function calculateSubmissionReadiness(proposal) {
  const review = ensureSubmissionReview(proposal);
  const generatedArtifacts = proposal.metadata?.generatedArtifacts || [];
  const hasFinalDraft = !!proposal.metadata?.finalDraftText;
  const hasDocx = generatedArtifacts.some((item) => item.type === 'final_draft' && item.docxUrl);
  const hasPdf = generatedArtifacts.some((item) => item.type === 'final_draft' && item.pdfUrl);
  const hasPricingArtifact = generatedArtifacts.some((item) => item.type === 'pricing_quote' || item.type === 'pricing');
  const attachmentCount = Array.isArray(proposal.files) ? proposal.files.length : 0;

  review.checklist.finalDraftReady = hasFinalDraft && (hasDocx || hasPdf);
  review.checklist.pricingReady = review.checklist.pricingReady || hasPricingArtifact;
  review.checklist.attachmentsReady = review.checklist.attachmentsReady || attachmentCount > 0;

  const items = Object.values(review.checklist);
  const completeItems = items.filter(Boolean).length;
  const readinessPercent = Math.round((completeItems / items.length) * 100);
  const readyToSubmit = items.every(Boolean) && review.status === REVIEW_DECISIONS.approved;

  return {
    reviewStatus: review.status,
    checklist: review.checklist,
    readinessPercent,
    readyToSubmit,
    artifactSummary: {
      hasFinalDraft,
      hasDocx,
      hasPdf,
      hasPricingArtifact,
      attachmentCount,
    },
  };
}
