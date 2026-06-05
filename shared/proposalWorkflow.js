const LEGACY_STATUS_TO_STAGE = Object.freeze({
  intake: 'ingestion',
  qualification: 'ingestion',
  pre_solicitation: 'strategy',
  research: 'strategy',
  technical_compliance: 'compliance',
  pricing_packaging: 'pricing_strategy',
  pricing_strategy: 'pricing_strategy',
  drafting: 'drafting',
  review: 'red_team',
  google_docs_final: 'final_review',
  submitted: 'final_review',
});

export const PROPOSAL_WORKFLOW_STAGES = Object.freeze([
  {
    id: 'ingestion',
    label: 'Ingestion',
    description: 'Capture the solicitation, source documents, deadline, and governing constraints.',
    prerequisites: [],
    outputs: ['solicitationDocuments', 'opportunity.dueDate', 'opportunity.buyer', 'opportunity.contractType'],
    nextStageInputs: ['complianceMatrix extraction needs solicitationDocuments'],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Extract atomic requirements and build the compliance matrix before drafting.',
    prerequisites: ['ingestion'],
    outputs: ['complianceMatrix', 'requirements', 'evaluationFactors'],
    nextStageInputs: ['strategy needs requirements + evaluationFactors to set win themes'],
  },
  {
    id: 'strategy',
    label: 'Pre-solicitation',
    description: 'Set pre-solicitation posture, win themes, and positioning before drafting.',
    prerequisites: ['compliance'],
    outputs: ['strategy.winThemes', 'strategy.discriminators', 'strategy.risks'],
    nextStageInputs: ['outline needs winThemes + discriminators to assign section purpose'],
  },
  {
    id: 'outline',
    label: 'Outline',
    description: 'Build the annotated outline with section purpose, evaluator questions, and page budget.',
    prerequisites: ['strategy'],
    outputs: ['outline.sections', 'proposalSections'],
    nextStageInputs: ['pricing_strategy needs outline.sections to scope pricing narrative'],
  },
  {
    id: 'pricing_strategy',
    label: 'Pricing Strategy',
    description: 'Define pricing model, cost narrative, competitive positioning, and rate strategy before drafting.',
    prerequisites: ['outline'],
    outputs: ['pricingGovernance', 'pricingGovernance.constraints'],
    nextStageInputs: ['drafting needs pricingGovernance + outline to draft all sections'],
  },
  {
    id: 'drafting',
    label: 'Drafting',
    description: 'Draft sections with evidence and requirement traceability.',
    prerequisites: ['pricing_strategy'],
    outputs: ['proposalSections[].draftText', 'proposalSections[].evidenceLinks'],
    nextStageInputs: ['red_team needs all section drafts for audit scoring'],
  },
  {
    id: 'red_team',
    label: 'AI Review',
    description: 'Audit, score, and improve the rough draft using the AI review lane.',
    prerequisites: ['drafting'],
    outputs: ['redTeamFindings', 'scoring'],
    nextStageInputs: ['final_review needs resolved red team findings + passing scores'],
  },
  {
    id: 'final_review',
    label: 'Final Draft',
    description: 'Open the final draft in Google Docs for human review.',
    prerequisites: ['red_team'],
    outputs: ['submissionPackage'],
    nextStageInputs: [],
  },
]);

export const PROPOSAL_STAGE_IDS = PROPOSAL_WORKFLOW_STAGES.map((stage) => stage.id);

export const STAGE_LABELS = Object.freeze(
  Object.fromEntries(PROPOSAL_WORKFLOW_STAGES.map((stage) => [stage.id, stage.label])),
);

export const DEFAULT_MODEL_ROUTING = Object.freeze({
  extraction: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  compliance: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  strategy: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  outline: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  pricing_strategy: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  technical_draft: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  executive_summary: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  rewrite_polish: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  ai_review: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  escalation_strategy: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  section_drafter: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  low_risk_bulk: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  red_team: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
  final_review: { provider: 'minimax', model: 'MiniMax-M2.5', lane: 'default' },
});

export const PROPOSAL_SECTION_LIBRARY = Object.freeze([
  {
    key: 'executive_summary',
    title: 'Executive Summary',
    purpose: 'Capture the buyer need, your discriminators, and the overall value story.',
    evaluatorQuestion: 'Why is this team the safest and strongest choice for award?',
    pageBudget: 2,
    owner: 'capture_lead',
  },
  {
    key: 'technical_approach',
    title: 'Technical Approach',
    purpose: 'Explain how work will be performed in a compliant, low-risk way.',
    evaluatorQuestion: 'Does the team clearly satisfy the technical requirements and execution risk?',
    pageBudget: 6,
    owner: 'technical_lead',
  },
  {
    key: 'management_plan',
    title: 'Management Plan',
    purpose: 'Show governance, staffing, communications, and quality controls.',
    evaluatorQuestion: 'Can this team manage delivery, staffing, reporting, and coordination reliably?',
    pageBudget: 3,
    owner: 'proposal_manager',
  },
  {
    key: 'staffing_key_personnel',
    title: 'Staffing and Key Personnel',
    purpose: 'Prove the team has the right people, qualifications, and coverage.',
    evaluatorQuestion: 'Are the proposed people and labor plan credible and qualified?',
    pageBudget: 2,
    owner: 'hr_lead',
  },
  {
    key: 'past_performance',
    title: 'Past Performance',
    purpose: 'Map relevant experience and evidence to contract needs.',
    evaluatorQuestion: 'Has this team successfully delivered materially similar work before?',
    pageBudget: 3,
    owner: 'past_performance_lead',
  },
  {
    key: 'quality_control',
    title: 'Quality Control',
    purpose: 'Show how quality, compliance, safety, and corrective action are managed.',
    evaluatorQuestion: 'Will the contractor consistently meet performance standards and documentation requirements?',
    pageBudget: 2,
    owner: 'quality_lead',
  },
  {
    key: 'pricing_narrative',
    title: 'Pricing Narrative',
    purpose: 'Explain pricing logic, assumptions, and cost realism.',
    evaluatorQuestion: 'Is the pricing understandable, justified, and aligned to the approach?',
    pageBudget: 2,
    owner: 'pricing_lead',
  },
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return Math.round((values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length) * 10) / 10;
}

function normalizeScore(value, fallback = 0) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, numeric));
  }
  return fallback;
}

function normalizeRiskLevel(value) {
  const normalized = String(value || '').toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(normalized)) {
    return normalized;
  }
  return 'medium';
}

export function getStageDefinition(stageId) {
  return PROPOSAL_WORKFLOW_STAGES.find((stage) => stage.id === stageId);
}

export function getStageFromLegacyStatus(status) {
  return LEGACY_STATUS_TO_STAGE[status] || 'ingestion';
}

export function createDefaultSection(template, index = 0) {
  return {
    id: `section-${template.key}-${index + 1}`,
    key: template.key,
    title: template.title,
    purpose: template.purpose,
    evaluatorQuestion: template.evaluatorQuestion,
    pageBudget: template.pageBudget,
    owner: template.owner,
    status: 'not_started',
    readiness: 'not_ready',
    draftText: '',
    summary: '',
    evidenceLinks: [],
    requirementIds: [],
    evaluationFactorIds: [],
    redTeamFindingIds: [],
    unresolvedPlaceholders: [],
    lastReviewedAt: null,
    modelUsed: null,
    scorecard: {
      compliance_score: 0,
      persuasiveness_score: 0,
      specificity_score: 0,
      evidence_score: 0,
      risk_score: 100,
    },
  };
}

function createWorkflowStageState() {
  return PROPOSAL_WORKFLOW_STAGES.map((stage) => ({
    stageId: stage.id,
    label: stage.label,
    status: stage.id === 'ingestion' ? 'in_progress' : 'blocked',
    updatedAt: null,
    completedAt: null,
    blocker: '',
  }));
}

function createSubmissionPackage() {
  return {
    attachments: [],
    pageCountLimit: null,
    pageCountActual: null,
    fontCompliance: 'unknown',
    completenessStatus: 'not_started',
    consistencyStatus: 'not_started',
    submissionReadiness: 'blocked',
    unresolvedRedFlags: [],
    finalChecks: {
      requirementCoverageCheck: 'not_started',
      attachmentCompletenessCheck: 'not_started',
      pageCountCheck: 'not_started',
      consistencyCheck: 'not_started',
      terminologyCheck: 'not_started',
    },
  };
}

// ── Pricing Governance ──────────────────────────────────────────────────────
// First-class compliance section for pricing constraints, margin governance,
// bond/insurance/wage/tax/escalation rules, and assumptions needing validation.

export function createPricingGovernance() {
  return {
    constraints: [],
    marginFloor: null,
    riskAdjustmentNotes: '',
    bondInsurance: {
      paymentBondRequired: false,
      performanceBondRequired: false,
      bondPercentage: null,
      insuranceMinimum: null,
      insuranceNotes: '',
    },
    wageDetermination: {
      required: false,
      wageScheduleRef: '',
      notes: '',
    },
    taxEscalation: {
      taxExempt: false,
      escalationClause: false,
      escalationCapPct: null,
      escalationNotes: '',
    },
    assumptions: [],
    reviewStatus: 'not_started',
    reviewedBy: '',
    reviewedAt: null,
    notes: '',
  };
}

export function normalizePricingGovernance(pg = {}) {
  const defaults = createPricingGovernance();
  return {
    constraints: Array.isArray(pg.constraints) ? pg.constraints.map((c, i) => ({
      id: c.id || `pgc-${i + 1}`,
      lineItem: c.lineItem || c.line_item || '',
      constraintType: c.constraintType || c.constraint_type || 'ceiling',
      description: c.description || '',
      threshold: c.threshold ?? null,
      unit: c.unit || '',
      source: c.source || '',
      status: c.status || 'open',
      notes: c.notes || '',
    })) : [],
    marginFloor: pg.marginFloor ?? defaults.marginFloor,
    riskAdjustmentNotes: pg.riskAdjustmentNotes || '',
    bondInsurance: { ...defaults.bondInsurance, ...(pg.bondInsurance || {}) },
    wageDetermination: { ...defaults.wageDetermination, ...(pg.wageDetermination || {}) },
    taxEscalation: { ...defaults.taxEscalation, ...(pg.taxEscalation || {}) },
    assumptions: Array.isArray(pg.assumptions) ? pg.assumptions.map((a, i) => ({
      id: a.id || `pga-${i + 1}`,
      text: a.text || '',
      validated: Boolean(a.validated),
      validatedBy: a.validatedBy || '',
      validatedAt: a.validatedAt || null,
      notes: a.notes || '',
    })) : [],
    reviewStatus: pg.reviewStatus || defaults.reviewStatus,
    reviewedBy: pg.reviewedBy || '',
    reviewedAt: pg.reviewedAt || null,
    notes: pg.notes || '',
  };
}

export function createGovConProposalShape(proposal = {}) {
  const timestamp = proposal.updatedAt || proposal.createdAt || new Date().toISOString();
  return {
    workflow: {
      currentStage: getStageFromLegacyStatus(proposal.status),
      stages: createWorkflowStageState(),
      stageGate: {
        blockedBy: [],
        canDraftWholeProposal: false,
      },
      modelRouting: clone(DEFAULT_MODEL_ROUTING),
      updatedAt: timestamp,
    },
    opportunity: {
      sourceType: proposal.metadata?.sourceType || (proposal.solicitationText ? 'solicitation' : 'manual'),
      solicitationNumber: proposal.metadata?.solicitationNumber || '',
      title: proposal.title || 'Untitled Proposal',
      buyer: proposal.agency || 'Unknown Agency',
      sourceUrl: proposal.sourceUrl || '',
      dueDate: proposal.dueDate || timestamp,
      setAside: '',
      contractType: '',
      estimatedValue: null,
      captureOwner: 'Morpheus',
    },
    solicitationDocuments: [],
    requirements: [],
    evaluationFactors: [],
    complianceMatrix: [],
    pricingGovernance: createPricingGovernance(),
    artifacts: [],
    pastPerformanceRecords: [],
    capabilityStatements: [],
    partnerProfiles: [],
    proposalSections: PROPOSAL_SECTION_LIBRARY.map(createDefaultSection),
    strategy: {
      winThemes: [],
      discriminators: [],
      evaluatorHotButtons: [],
      risks: [],
      executivePositioning: '',
    },
    outline: {
      status: 'not_started',
      notes: '',
      sections: [],
      generatedAt: null,
    },
    complianceStatus: {
      completenessPercent: 0,
      unresolvedGapCount: 0,
      missingEvidenceCount: 0,
      disqualifyingOmissionCount: 0,
      criticalRequirementCount: 0,
      blockedRequirementCount: 0,
    },
    redTeamFindings: [],
    submissionPackage: createSubmissionPackage(),
    scoring: {
      compliance_score: 0,
      persuasiveness_score: 0,
      specificity_score: 0,
      evidence_score: 0,
      risk_score: 100,
      draft_readiness_percent: 0,
      submission_readiness_percent: 0,
      unresolved_gap_count: 0,
      red_team_severity_count: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    },
  };
}

export function getMissingStagePrerequisites(proposal, targetStageId) {
  const definition = getStageDefinition(targetStageId);
  if (!definition) {
    return [];
  }
  const stages = Array.isArray(proposal.workflow?.stages) ? proposal.workflow.stages : [];
  return definition.prerequisites.filter((stageId) => {
    const stageState = stages.find((stage) => stage.stageId === stageId);
    return stageState?.status !== 'completed';
  });
}

export function buildRequirementCoverage(proposal) {
  const matrix = Array.isArray(proposal.complianceMatrix) ? proposal.complianceMatrix : [];
  const requirementIds = uniqueBy(
    matrix.map((item) => item.requirement_id).filter(Boolean),
    (item) => item,
  );
  const completed = matrix.filter((item) => ['covered', 'resolved', 'complete'].includes(String(item.status || '').toLowerCase())).length;
  const gaps = matrix.filter((item) => ['missing', 'blocked', 'open'].includes(String(item.status || '').toLowerCase())).length;
  return {
    totalRequirements: requirementIds.length,
    completed,
    gaps,
    completenessPercent: requirementIds.length ? Math.round((completed / requirementIds.length) * 100) : 0,
  };
}

function normalizeComplianceMatrix(matrix = [], requirements = [], proposalSections = []) {
  const sectionKeys = new Set((proposalSections || []).map((section) => section.key));
  return (Array.isArray(matrix) ? matrix : []).map((item, index) => ({
    id: item.id || `cm-${index + 1}`,
    requirement_id: item.requirement_id || item.requirementId || `req-${index + 1}`,
    source_section: item.source_section || item.sourceSection || item.source || '',
    requirement_text: item.requirement_text || item.requirementText || item.requirement || '',
    requirement_type: item.requirement_type || item.requirementType || 'instruction',
    mandatory_or_scored: item.mandatory_or_scored || item.mandatoryOrScored || 'mandatory',
    proposal_section: item.proposal_section || item.proposalSection || '',
    action_required: item.action_required || item.actionRequired || '',
    evidence_needed: Array.isArray(item.evidence_needed || item.evidenceNeeded)
      ? (item.evidence_needed || item.evidenceNeeded)
      : [item.evidence_needed || item.evidenceNeeded].filter(Boolean),
    owner: item.owner || 'proposal_manager',
    status: item.status || 'open',
    risk_level: normalizeRiskLevel(item.risk_level || item.riskLevel),
    notes: item.notes || '',
    verified: Boolean(item.verified),
  }));
}

function normalizeSection(section, template) {
  const scorecard = section?.scorecard || {};
  return {
    ...createDefaultSection(template),
    ...(section || {}),
    key: template.key,
    title: section?.title || template.title,
    purpose: section?.purpose || template.purpose,
    evaluatorQuestion: section?.evaluatorQuestion || template.evaluatorQuestion,
    pageBudget: Number(section?.pageBudget || template.pageBudget || 0),
    owner: section?.owner || template.owner,
    evidenceLinks: Array.isArray(section?.evidenceLinks) ? section.evidenceLinks : [],
    requirementIds: Array.isArray(section?.requirementIds) ? section.requirementIds : [],
    evaluationFactorIds: Array.isArray(section?.evaluationFactorIds) ? section.evaluationFactorIds : [],
    redTeamFindingIds: Array.isArray(section?.redTeamFindingIds) ? section.redTeamFindingIds : [],
    unresolvedPlaceholders: Array.isArray(section?.unresolvedPlaceholders) ? section.unresolvedPlaceholders : [],
    scorecard: {
      compliance_score: normalizeScore(scorecard.compliance_score),
      persuasiveness_score: normalizeScore(scorecard.persuasiveness_score),
      specificity_score: normalizeScore(scorecard.specificity_score),
      evidence_score: normalizeScore(scorecard.evidence_score),
      risk_score: normalizeScore(scorecard.risk_score, 100),
    },
  };
}

function normalizeWorkflow(workflow = {}, status) {
  const currentStage = workflow.currentStage && PROPOSAL_STAGE_IDS.includes(workflow.currentStage)
    ? workflow.currentStage
    : getStageFromLegacyStatus(status);
  const stageStates = Array.isArray(workflow.stages) && workflow.stages.length
    ? workflow.stages
    : createWorkflowStageState();

  return {
    currentStage,
    updatedAt: workflow.updatedAt || new Date().toISOString(),
    modelRouting: {
      ...clone(DEFAULT_MODEL_ROUTING),
      ...(workflow.modelRouting || {}),
    },
    stageGate: {
      blockedBy: Array.isArray(workflow.stageGate?.blockedBy) ? workflow.stageGate.blockedBy : [],
      canDraftWholeProposal: Boolean(workflow.stageGate?.canDraftWholeProposal),
    },
    stages: PROPOSAL_WORKFLOW_STAGES.map((definition) => {
      const existing = stageStates.find((item) => item.stageId === definition.id) || {};
      return {
        stageId: definition.id,
        label: definition.label,
        status: existing.status || (definition.id === 'ingestion' ? 'in_progress' : 'blocked'),
        updatedAt: existing.updatedAt || null,
        completedAt: existing.completedAt || null,
        blocker: existing.blocker || '',
      };
    }),
  };
}

function normalizeRedTeamFindings(findings = []) {
  return (Array.isArray(findings) ? findings : []).map((finding, index) => ({
    id: finding.id || `rt-${index + 1}`,
    title: finding.title || 'Unnamed finding',
    description: finding.description || '',
    severity: normalizeRiskLevel(finding.severity),
    sectionKey: finding.sectionKey || '',
    requirementId: finding.requirementId || '',
    status: finding.status || 'open',
    recommendedFix: finding.recommendedFix || '',
    verified: Boolean(finding.verified),
  }));
}

function normalizeSubmissionPackage(submissionPackage = {}) {
  const normalized = {
    ...createSubmissionPackage(),
    ...(submissionPackage || {}),
  };
  normalized.attachments = Array.isArray(normalized.attachments) ? normalized.attachments : [];
  normalized.unresolvedRedFlags = Array.isArray(normalized.unresolvedRedFlags) ? normalized.unresolvedRedFlags : [];
  normalized.finalChecks = {
    ...createSubmissionPackage().finalChecks,
    ...(normalized.finalChecks || {}),
  };
  return normalized;
}

export function recomputeProposalState(proposal) {
  const govConDefaults = createGovConProposalShape(proposal);
  const workflow = normalizeWorkflow(proposal.workflow, proposal.status);
  const sections = PROPOSAL_SECTION_LIBRARY.map((template) => {
    const existing = (proposal.proposalSections || []).find((section) => section.key === template.key);
    return normalizeSection(existing, template);
  });
  const complianceMatrix = normalizeComplianceMatrix(
    proposal.complianceMatrix,
    proposal.requirements,
    sections,
  );
  const pricingGovernance = normalizePricingGovernance(proposal.pricingGovernance);
  const redTeamFindings = normalizeRedTeamFindings(proposal.redTeamFindings);
  const scoring = {
    ...govConDefaults.scoring,
    ...(proposal.scoring || {}),
  };

  const coverage = buildRequirementCoverage({
    ...proposal,
    complianceMatrix,
  });

  const sectionReadinessCount = sections.filter((section) => ['review_ready', 'ready', 'complete'].includes(section.readiness)).length;
  const completedStageIds = new Set(
    workflow.stages.filter((stage) => stage.status === 'completed').map((stage) => stage.stageId),
  );
  const complianceScore = coverage.completenessPercent;
  const persuasivenessScore = average(sections.map((section) => section.scorecard.persuasiveness_score));
  const specificityScore = average(sections.map((section) => section.scorecard.specificity_score));
  const evidenceScore = average(sections.map((section) => section.scorecard.evidence_score));
  const riskScore = average(sections.map((section) => section.scorecard.risk_score));

  const redTeamSeverityCount = {
    critical: redTeamFindings.filter((finding) => finding.severity === 'critical' && finding.status !== 'resolved').length,
    high: redTeamFindings.filter((finding) => finding.severity === 'high' && finding.status !== 'resolved').length,
    medium: redTeamFindings.filter((finding) => finding.severity === 'medium' && finding.status !== 'resolved').length,
    low: redTeamFindings.filter((finding) => finding.severity === 'low' && finding.status !== 'resolved').length,
  };

  const unresolvedGapCount = complianceMatrix.filter((item) => ['open', 'missing', 'blocked'].includes(String(item.status || '').toLowerCase())).length;
  const missingEvidenceCount = complianceMatrix.filter((item) => (item.evidence_needed || []).length > 0 && !item.verified).length;
  const disqualifyingOmissionCount = complianceMatrix.filter((item) => item.mandatory_or_scored === 'mandatory' && ['missing', 'blocked'].includes(String(item.status || '').toLowerCase())).length;

  const sectionReadinessRatio = sections.length > 0 ? (sectionReadinessCount / sections.length) : 0;
  const clampedComplianceScore = normalizeScore(complianceScore);
  const clampedEvidenceScore = normalizeScore(evidenceScore);
  const clampedRiskScore = normalizeScore(riskScore);
  const draftReadinessPercent = Math.round(
    (clampedComplianceScore * 0.3) + (sectionReadinessRatio * 100 * 0.4) + (clampedEvidenceScore * 0.15) + ((100 - clampedRiskScore) * 0.15),
  );

  const finalChecks = normalizeSubmissionPackage(proposal.submissionPackage).finalChecks;
  const finalCheckValues = Object.values(finalChecks);
  const finalCheckScore = finalCheckValues.length
    ? Math.round((finalCheckValues.filter((value) => value === 'completed').length / finalCheckValues.length) * 100)
    : 0;
  const submissionReadinessPercent = Math.max(0, Math.min(100, Math.round(
    (draftReadinessPercent * 0.55) + (finalCheckScore * 0.25) + ((redTeamSeverityCount.critical + redTeamSeverityCount.high === 0) ? 20 : 0),
  )));

  // Auto-complete stages before currentStage based on stage order
  const currentStageIndex = PROPOSAL_STAGE_IDS.indexOf(workflow.currentStage);
  if (currentStageIndex > 0) {
    for (const stage of workflow.stages) {
      const stageIndex = PROPOSAL_STAGE_IDS.indexOf(stage.stageId);
      if (stageIndex >= 0 && stageIndex < currentStageIndex && stage.status !== 'completed') {
        stage.status = 'completed';
        stage.completedAt = stage.completedAt || workflow.updatedAt || new Date().toISOString();
        stage.blocker = '';
      }
    }
  }

  // Rebuild completedStageIds after auto-completion
  const updatedCompletedStageIds = new Set(
    workflow.stages.filter((stage) => stage.status === 'completed').map((stage) => stage.stageId),
  );

  workflow.stageGate = {
    blockedBy: getMissingStagePrerequisites({ workflow }, workflow.currentStage),
    canDraftWholeProposal: updatedCompletedStageIds.has('pricing_strategy'),
  };

  workflow.stages = workflow.stages.map((stage) => {
    const missingPrerequisites = getMissingStagePrerequisites({ workflow }, stage.stageId);
    let nextStatus = stage.status;
    if (stage.stageId === workflow.currentStage && stage.status !== 'completed') {
      nextStatus = missingPrerequisites.length === 0 ? 'in_progress' : 'blocked';
    }
    if (stage.stageId !== workflow.currentStage && stage.status !== 'completed') {
      nextStatus = missingPrerequisites.length === 0 ? 'ready' : 'blocked';
    }
    return {
      ...stage,
      status: nextStatus,
      blocker: missingPrerequisites.length ? `Missing prerequisite: ${missingPrerequisites.join(', ')}` : '',
    };
  });

  return {
    ...proposal,
    workflow,
    opportunity: {
      ...govConDefaults.opportunity,
      ...(proposal.opportunity || {}),
      title: proposal.title || proposal.opportunity?.title || govConDefaults.opportunity.title,
      buyer: proposal.agency || proposal.opportunity?.buyer || govConDefaults.opportunity.buyer,
      dueDate: proposal.dueDate || proposal.opportunity?.dueDate || govConDefaults.opportunity.dueDate,
    },
    solicitationDocuments: Array.isArray(proposal.solicitationDocuments) ? proposal.solicitationDocuments : [],
    requirements: Array.isArray(proposal.requirements) ? proposal.requirements : [],
    evaluationFactors: Array.isArray(proposal.evaluationFactors) ? proposal.evaluationFactors : [],
    complianceMatrix,
    pricingGovernance,
    artifacts: Array.isArray(proposal.artifacts) ? proposal.artifacts : [],
    pastPerformanceRecords: Array.isArray(proposal.pastPerformanceRecords) ? proposal.pastPerformanceRecords : [],
    capabilityStatements: Array.isArray(proposal.capabilityStatements) ? proposal.capabilityStatements : [],
    partnerProfiles: Array.isArray(proposal.partnerProfiles) ? proposal.partnerProfiles : [],
    proposalSections: sections,
    strategy: {
      ...govConDefaults.strategy,
      ...(proposal.strategy || {}),
      winThemes: Array.isArray(proposal.strategy?.winThemes) ? proposal.strategy.winThemes : [],
      discriminators: Array.isArray(proposal.strategy?.discriminators) ? proposal.strategy.discriminators : [],
      evaluatorHotButtons: Array.isArray(proposal.strategy?.evaluatorHotButtons) ? proposal.strategy.evaluatorHotButtons : [],
      risks: Array.isArray(proposal.strategy?.risks) ? proposal.strategy.risks : [],
    },
    outline: {
      ...govConDefaults.outline,
      ...(proposal.outline || {}),
      sections: Array.isArray(proposal.outline?.sections) ? proposal.outline.sections : [],
    },
    complianceStatus: {
      completenessPercent: coverage.completenessPercent,
      unresolvedGapCount,
      missingEvidenceCount,
      disqualifyingOmissionCount,
      criticalRequirementCount: complianceMatrix.filter((item) => item.risk_level === 'critical').length,
      blockedRequirementCount: complianceMatrix.filter((item) => String(item.status || '').toLowerCase() === 'blocked').length,
    },
    redTeamFindings,
    submissionPackage: normalizeSubmissionPackage(proposal.submissionPackage),
    scoring: {
      ...scoring,
      compliance_score: complianceScore,
      persuasiveness_score: persuasivenessScore,
      specificity_score: specificityScore,
      evidence_score: evidenceScore,
      risk_score: riskScore,
      draft_readiness_percent: Math.max(0, Math.min(100, draftReadinessPercent)),
      submission_readiness_percent: submissionReadinessPercent,
      unresolved_gap_count: unresolvedGapCount,
      red_team_severity_count: redTeamSeverityCount,
    },
  };
}

export function updateWorkflowStage(proposal, nextStageId, updates = {}) {
  const normalized = recomputeProposalState(proposal);
  if (!PROPOSAL_STAGE_IDS.includes(nextStageId)) {
    return normalized;
  }
  const timestamp = new Date().toISOString();

  // Record handoff from current stage before advancing
  const fromStageId = normalized.workflow.currentStage;
  if (fromStageId && fromStageId !== nextStageId) {
    const handoff = buildStageHandoff(normalized, fromStageId, nextStageId);
    normalized.stageHandoffs = Array.isArray(normalized.stageHandoffs)
      ? normalized.stageHandoffs
      : [];
    normalized.stageHandoffs.push(handoff);
  }

  normalized.workflow.currentStage = nextStageId;
  normalized.workflow.updatedAt = timestamp;
  normalized.workflow.stages = normalized.workflow.stages.map((stage) => {
    if (stage.stageId === nextStageId) {
      return {
        ...stage,
        status: updates.status || 'in_progress',
        updatedAt: timestamp,
        blocker: updates.blocker || '',
      };
    }
    return stage;
  });
  return recomputeProposalState(normalized);
}

// ── Stage Handoff Contracts ──────────────────────────────────────────────────

/** Check if a stage's expected outputs are present on the proposal. */
export function validateStageOutputs(proposal, stageId) {
  const stage = PROPOSAL_WORKFLOW_STAGES.find((s) => s.id === stageId);
  if (!stage || !stage.outputs) return { valid: true, missing: [], present: [] };

  const missing = [];
  const present = [];

  for (const outputPath of stage.outputs) {
    const clean = outputPath.replace(/\[\]/g, '');
    const hasData = resolveOutputPath(proposal, clean);
    if (hasData) {
      present.push(outputPath);
    } else {
      missing.push(outputPath);
    }
  }

  return { valid: missing.length === 0, missing, present };
}

function resolveOutputPath(obj, dotPath) {
  const parts = dotPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return false;
    current = current[part];
  }
  if (current == null) return false;
  if (Array.isArray(current)) return current.length > 0;
  if (typeof current === 'string') return current.trim().length > 0;
  if (typeof current === 'object') return Object.keys(current).length > 0;
  return true;
}

/** Build a structured handoff record when transitioning between stages. */
export function buildStageHandoff(proposal, fromStageId, toStageId) {
  const fromStage = PROPOSAL_WORKFLOW_STAGES.find((s) => s.id === fromStageId);
  const toStage = PROPOSAL_WORKFLOW_STAGES.find((s) => s.id === toStageId);
  const outputValidation = fromStage ? validateStageOutputs(proposal, fromStageId) : { valid: true, missing: [], present: [] };

  return {
    from: fromStageId,
    to: toStageId,
    timestamp: new Date().toISOString(),
    outputsProduced: outputValidation.present,
    outputsMissing: outputValidation.missing,
    outputsValid: outputValidation.valid,
    nextStageExpects: toStage?.nextStageInputs || [],
    signal: outputValidation.valid ? 'clean' : 'incomplete',
  };
}

/** Get the current stage's readiness to advance — what outputs exist and what's missing. */
export function getStageAdvanceReadiness(proposal) {
  const currentStage = proposal.workflow?.currentStage;
  if (!currentStage) return null;
  const stageIdx = PROPOSAL_STAGE_IDS.indexOf(currentStage);
  const nextStageId = stageIdx >= 0 && stageIdx < PROPOSAL_STAGE_IDS.length - 1
    ? PROPOSAL_STAGE_IDS[stageIdx + 1]
    : null;

  const outputCheck = validateStageOutputs(proposal, currentStage);
  const nextStage = nextStageId ? PROPOSAL_WORKFLOW_STAGES.find((s) => s.id === nextStageId) : null;

  return {
    currentStage,
    nextStage: nextStageId,
    outputsValid: outputCheck.valid,
    outputsPresent: outputCheck.present,
    outputsMissing: outputCheck.missing,
    nextStageExpects: nextStage?.nextStageInputs || [],
    canAdvance: outputCheck.valid,
  };
}
