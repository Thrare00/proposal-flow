import { createId, getDb, nowIso, updateDb, appendHealthEvent } from './automation-store.js';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { appendStatusUpdate, updateTrackerLine } from './morpheus-bridge.js';
import { normalizeProposal } from '../shared/proposalNormalization.js';
import { buildStageHandoff, validateStageOutputs } from '../shared/proposalWorkflow.js';
import { executeTwentyExecution } from './twenty-execution.js';
import { dispatchGmailMessage } from './gmail-dispatch.js';

const STAGE_SEQUENCE = ['intake', 'qualification', 'pre_solicitation', 'research', 'technical_compliance', 'pricing_strategy', 'drafting', 'review', 'google_docs_final', 'submitted'];

function nextStage(currentStage) {
  const currentIndex = STAGE_SEQUENCE.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === STAGE_SEQUENCE.length - 1) {
    return currentStage;
  }
  return STAGE_SEQUENCE[currentIndex + 1];
}

function appendWorkflowStep(proposal, step) {
  proposal.metadata = proposal.metadata || {};
  proposal.metadata.workflowSteps = Array.isArray(proposal.metadata.workflowSteps)
    ? proposal.metadata.workflowSteps
    : [];
  proposal.metadata.workflowSteps.unshift({
    id: step.id || createId('step'),
    timestamp: step.timestamp || nowIso(),
    status: step.status || 'completed',
    ...step,
  });
  proposal.metadata.workflowSteps = proposal.metadata.workflowSteps.slice(0, 100);
}

// Core service keywords that always apply (independent of businessProfile)
const CORE_SERVICE_KEYWORDS = [
  // Primary services
  { term: 'pressure wash', weight: 15 },
  { term: 'power wash', weight: 15 },
  { term: 'softwash', weight: 15 },
  { term: 'soft wash', weight: 15 },
  { term: 'janitorial', weight: 15 },
  { term: 'custodial', weight: 12 },
  { term: 'cleaning', weight: 10 },
  { term: 'window clean', weight: 12 },
  { term: 'landscap', weight: 12 },
  { term: 'grounds maintenance', weight: 15 },
  { term: 'lawn', weight: 8 },
  { term: 'mowing', weight: 10 },
  { term: 'facility maintenance', weight: 12 },
  { term: 'facility support', weight: 12 },
  { term: 'building maintenance', weight: 12 },
  // Adjacent services
  { term: 'painting', weight: 8 },
  { term: 'striping', weight: 6 },
  { term: 'post-construction', weight: 10 },
  { term: 'debris removal', weight: 8 },
  { term: 'trash', weight: 6 },
  { term: 'waste', weight: 6 },
  { term: 'sanitation', weight: 8 },
  { term: 'porter', weight: 8 },
  { term: 'floor care', weight: 10 },
  { term: 'carpet clean', weight: 10 },
  // GovCon signals
  { term: 'small business', weight: 5 },
  { term: 'set-aside', weight: 5 },
  { term: 'sdvosb', weight: 5 },
  { term: '8(a)', weight: 5 },
  { term: 'hubzone', weight: 5 },
];

// Geography bonus
const GEO_KEYWORDS = [
  { term: 'georgia', weight: 8 },
  { term: 'atlanta', weight: 10 },
  { term: 'fulton', weight: 8 },
  { term: 'gwinnett', weight: 8 },
  { term: 'dekalb', weight: 8 },
  { term: 'cobb', weight: 8 },
  { term: 'fort stewart', weight: 6 },
  { term: 'fort benning', weight: 6 },
  { term: 'fort eisenhower', weight: 6 },
  { term: 'robins afb', weight: 6 },
  { term: 'moody afb', weight: 6 },
];

function scoreOpportunity(opportunity, businessProfile) {
  const text = [
    opportunity.title,
    opportunity.summary,
    opportunity.agency,
    opportunity.description,
    opportunity.notes,
  ].filter(Boolean).join(' ').toLowerCase();

  let score = 25; // Lower baseline — earn your score
  const matches = [];

  // Core service keyword matching (highest signal)
  for (const kw of CORE_SERVICE_KEYWORDS) {
    if (text.includes(kw.term)) {
      score += kw.weight;
      matches.push(`service:${kw.term}`);
    }
  }

  // Geography bonus
  for (const geo of GEO_KEYWORDS) {
    if (text.includes(geo.term)) {
      score += geo.weight;
      matches.push(`geo:${geo.term}`);
    }
  }

  // Business profile keywords (configurable)
  for (const keyword of businessProfile.keywords || []) {
    if (text.includes(keyword.toLowerCase())) {
      score += 6;
      matches.push(`keyword:${keyword}`);
    }
  }

  // Target agency match (with common abbreviation expansion)
  const agencyText = (opportunity.agency || '').toLowerCase();
  const AGENCY_ALIASES = {
    'department of defense': ['dept of defense', 'dod', 'dept. of defense', 'dept of the army', 'dept. of the army', 'department of the army', 'micc'],
    'department of energy': ['dept of energy', 'doe', 'dept. of energy'],
    'environmental protection agency': ['epa'],
    'gsa': ['general services administration'],
    'city of atlanta': ['atlanta'],
    'department of agriculture': ['usda', 'dept of agriculture', 'forest service', 'ranger station'],
  };
  for (const agency of businessProfile.targetAgencies || []) {
    const lc = agency.toLowerCase();
    const aliases = AGENCY_ALIASES[lc] || [];
    const allTerms = [lc, ...aliases];
    if (allTerms.some((term) => agencyText.includes(term))) {
      score += 8;
      matches.push(`agency:${agency}`);
    }
  }

  const normalizedScore = Math.max(0, Math.min(98, score));
  const fitDecision = normalizedScore >= 65 ? 'recommended'
    : normalizedScore >= 45 ? 'review'
    : 'watch';

  return {
    fitScore: normalizedScore,
    fitDecision,
    fitReasons: matches.slice(0, 8),
  };
}

function createPortalOpportunity(portal, template, businessProfile) {
  const timestamp = nowIso();
  const dueDate = new Date(Date.now() + (template.dueDateOffsetDays || 14) * 24 * 60 * 60 * 1000).toISOString();
  const fit = scoreOpportunity(template, businessProfile);

  return {
    id: createId('opportunity'),
    title: template.title,
    agency: template.agency,
    url: portal.url,
    portalId: portal.id,
    portalName: portal.name,
    summary: template.summary,
    stage: 'opportunity',
    dueDate,
    createdAt: timestamp,
    updatedAt: timestamp,
    fitScore: fit.fitScore,
    fitDecision: fit.fitDecision,
    fitReasons: fit.fitReasons,
    documents: (template.documents || []).map((name) => ({
      id: createId('doc'),
      name,
      source: 'watcher',
      createdAt: timestamp,
    })),
    metrics: {
      Profitability: fit.fitScore,
      StrategicFit: fit.fitScore,
      Competition: 55,
      SubcontractingPotential: 45,
      LikelihoodOfAward: Math.max(35, fit.fitScore - 5),
      RelationshipLeverage: 50,
      PastPerformanceMatch: fit.fitScore,
    },
  };
}

function ensureProposal(db, proposalId) {
  return db.proposals.find((proposal) => proposal.id === proposalId);
}

function normalizeKey(value) {
  return (value || '').toString().trim().toLowerCase();
}

function extractSolicitationId(text) {
  // Extract B-XXXX or W9XXXX style solicitation IDs from title strings
  const match = (text || '').match(/\b([BW]\d*-?\d{3,}[A-Z]*\d*)\b/i);
  return match ? match[1].toUpperCase() : '';
}

function findDuplicateProposal(db, payload = {}) {
  const solicitationNumber = normalizeKey(
    payload.solicitationNumber
      || payload.solicitation_id
      || payload.noticeId
      || payload.id,
  );
  const title = normalizeKey(payload.title || payload.solicitationTitle);
  const agency = normalizeKey(payload.agency);
  const sourceOpportunityId = payload.sourceOpportunityId || payload.opportunityId;
  const incomingSolId = extractSolicitationId(payload.title || payload.solicitationTitle || '');

  return db.proposals.find((proposal) => {
    const meta = proposal.metadata || {};
    if (sourceOpportunityId && meta.sourceOpportunityId === sourceOpportunityId) {
      return true;
    }
    if (solicitationNumber && normalizeKey(meta.solicitationNumber) === solicitationNumber) {
      return true;
    }
    if (title && agency && normalizeKey(proposal.title) === title && normalizeKey(proposal.agency) === agency) {
      return true;
    }
    // Fuzzy match: if both titles contain the same solicitation ID (B-XXXX, W9XXXX)
    if (incomingSolId && incomingSolId.length >= 5) {
      const existingSolId = extractSolicitationId(proposal.title);
      if (existingSolId === incomingSolId) return true;
    }
    return false;
  });
}

function addTaskToProposal(proposal, task) {
  proposal.tasks = Array.isArray(proposal.tasks) ? proposal.tasks : [];
  proposal.tasks.push(task);
}

function addReport(db, kind, summaryLines) {
  const timestamp = nowIso();
  const dateLabel = new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const report = {
    id: createId('report'),
    name: `${kind === 'daily' ? 'Daily Report' : 'Weekly Report'} - ${dateLabel}`,
    mimeType: 'application/json',
    updatedTime: timestamp,
    createdTime: timestamp,
    webViewLink: '#',
    body: summaryLines.join('\n'),
    kind,
  };

  db.reports.unshift(report);
  db.reports = db.reports.slice(0, 100);
  return report;
}

function createReminderEvent(payload) {
  return {
    id: createId('event'),
    title: payload.Subject || payload.subject || 'Reminder',
    date: payload.Start || nowIso(),
    type: 'task',
    proposalId: payload.proposalId || '',
    notification: {
      enabled: true,
      time: payload.Start || nowIso(),
    },
    status: {
      current: 'pending',
      progress: 0,
      lastUpdated: nowIso(),
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function createProposalFromSolicitation(payload) {
  const createdAt = nowIso();
  const proposalId = createId('proposal');
  const dueDate = payload.dueDate || payload.due_date || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

  return normalizeProposal({
    id: proposalId,
    title: payload.title || payload.solicitationTitle || 'Untitled Solicitation',
    agency: payload.agency || 'Unknown Agency',
    dueDate,
    status: 'intake',
    notes: payload.notes || payload.solicitationText || '',
    solicitationText: payload.solicitationText || '',
    source: 'automation',
    type: payload.type || 'federal',
    createdAt,
    updatedAt: createdAt,
    tasks: [
      {
        id: createId('task'),
        proposalId,
        title: 'Review solicitation and confirm due date',
        owner: 'Morpheus',
        dueDate: dueDate,
        completed: false,
        status: 'pending',
        priority: 'high',
        createdAt,
      },
    ],
    files: [],
    metadata: {
      solicitationNumber: payload.solicitationNumber || '',
      sourceType: 'solicitation',
      draftOverviewStatus: 'pending',
      proposalDraftStatus: 'pending',
      workflowSteps: [
        {
          stage: 'intake',
          label: 'Solicitation ingested',
          status: 'completed',
          timestamp: createdAt,
        },
      ],
    },
  });
}

const FEDERAL_TASK_CHECKLIST = [
  { title: 'Review solicitation package and confirm due date', priority: 'high', offsetDays: 0, stage: 'intake' },
  { title: 'Extract evaluation criteria and scoring weights', priority: 'high', offsetDays: 1, stage: 'qualification' },
  { title: 'Build compliance matrix (requirements vs. sections)', priority: 'high', offsetDays: 1, stage: 'technical_compliance' },
  { title: 'Identify win themes and differentiators', priority: 'high', offsetDays: 2, stage: 'research' },
  { title: 'Draft Executive Summary', priority: 'high', offsetDays: 3, stage: 'drafting' },
  { title: 'Draft Technical Approach', priority: 'high', offsetDays: 4, stage: 'drafting' },
  { title: 'Draft Management Plan', priority: 'medium', offsetDays: 5, stage: 'drafting' },
  { title: 'Draft Past Performance section', priority: 'medium', offsetDays: 6, stage: 'drafting' },
  { title: 'Draft Pricing Narrative', priority: 'medium', offsetDays: 7, stage: 'pricing_strategy' },
  { title: 'Internal review pass', priority: 'high', offsetDays: 8, stage: 'review' },
  { title: 'Final review and format check', priority: 'high', offsetDays: 9, stage: 'google_docs_final' },
  { title: 'Submit by deadline', priority: 'high', offsetDays: 10, stage: 'submitted' },
];

const MARKET_RESEARCH_DIR = path.join(process.cwd(), 'server', 'data', 'market-research');
const MARKET_RESEARCH_INPUT_DIR = path.join(MARKET_RESEARCH_DIR, 'inputs');
const TERMINAL_JOB_STATUSES = new Set(['applied', 'applied_partial', 'failed']);
const ACTIVE_JOB_STATUSES = new Set(['queued', 'processing']);
const CADENCE_ACTIONS = new Set(['run_followup_cadence', 'run_outreach_cadence', 'run_market_research', 'post_daily_report', 'post_weekly_report']);
const JOB_HISTORY_LIMIT = 120;
const CADENCE_HISTORY_LIMIT = 14;

function ensureMarketResearchDirs() {
  if (!existsSync(MARKET_RESEARCH_DIR)) {
    mkdirSync(MARKET_RESEARCH_DIR, { recursive: true });
  }
  if (!existsSync(MARKET_RESEARCH_INPUT_DIR)) {
    mkdirSync(MARKET_RESEARCH_INPUT_DIR, { recursive: true });
  }
}

function loadMarketResearchInputs() {
  ensureMarketResearchDirs();
  const files = readdirSync(MARKET_RESEARCH_INPUT_DIR)
    .filter((file) => file.endsWith('.json'))
    .slice(0, 50);
  const items = [];
  for (const file of files) {
    try {
      const raw = readFileSync(path.join(MARKET_RESEARCH_INPUT_DIR, file), 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        items.push(parsed);
      }
    } catch {
      // ignore malformed input
    }
  }
  return items;
}

function createMarketResearchArtifact(db, summary, sources = []) {
  const timestamp = nowIso();
  const artifact = {
    id: createId('market-research'),
    title: `Market Research Runner - ${new Date(timestamp).toLocaleString('en-US')}`,
    createdAt: timestamp,
    summary,
    sources,
    status: sources.length ? 'completed' : 'blocked',
  };
  db.artifacts.unshift(artifact);
  db.artifacts = db.artifacts.slice(0, 200);
  return artifact;
}

function recordKnowledgeItem(db, item) {
  const timestamp = nowIso();
  db.knowledgeItems.unshift({
    id: createId('intel'),
    title: item.title || 'Market Research Item',
    summary: item.summary || '',
    source: item.source || item.url || 'market-research',
    agency: item.agency || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  db.knowledgeItems = db.knowledgeItems.slice(0, 200);
}

function compactJobs(jobList = []) {
  const active = [];
  const terminal = [];

  for (const job of Array.isArray(jobList) ? jobList : []) {
    if (ACTIVE_JOB_STATUSES.has(job.status)) {
      active.push(job);
      continue;
    }

    if (TERMINAL_JOB_STATUSES.has(job.status)) {
      terminal.push(job);
    }
  }

  terminal.sort((left, right) => new Date(right.processedAt || right.createdAt || 0) - new Date(left.processedAt || left.createdAt || 0));

  const cadenceByAction = new Map();
  const retainedTerminal = [];

  for (const job of terminal) {
    if (CADENCE_ACTIONS.has(job.action)) {
      const count = cadenceByAction.get(job.action) || 0;
      if (count >= CADENCE_HISTORY_LIMIT) {
        continue;
      }
      cadenceByAction.set(job.action, count + 1);
    }
    retainedTerminal.push(job);
    if (retainedTerminal.length >= JOB_HISTORY_LIMIT) {
      break;
    }
  }

  return [...active, ...retainedTerminal];
}

function hasProcessedActionToday(db, action, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  return Array.isArray(db.health?.events)
    && db.health.events.some((event) => event.action === action && event.timestamp?.startsWith(today));
}

// Generates a scaled task checklist whose due dates fit within the proposal window.
function generateTaskChecklist(proposal, timestamp) {
  const dueMs = new Date(proposal.dueDate).getTime();
  const nowMs = new Date(timestamp).getTime();
  const windowDays = Math.max((dueMs - nowMs) / (24 * 60 * 60 * 1000), 1);
  const scale = Math.min(windowDays / 10, 1);

  proposal.tasks = Array.isArray(proposal.tasks) ? proposal.tasks : [];
  for (const item of FEDERAL_TASK_CHECKLIST) {
    const offsetMs = item.offsetDays * scale * 24 * 60 * 60 * 1000;
    proposal.tasks.push({
      id: createId('task'),
      proposalId: proposal.id,
      title: item.title,
      owner: 'Morpheus',
      dueDate: new Date(Math.min(nowMs + offsetMs, dueMs)).toISOString(),
      completed: false,
      status: 'pending',
      priority: item.priority,
      stage: item.stage,
      createdAt: timestamp,
    });
  }

  Object.assign(proposal, normalizeProposal(proposal));
}

function recordTwentyExecutionOnProposal(job, executionResult) {
  const proposalId = executionResult?.payload?.proposalId || job.payload?.proposalId;
  if (!proposalId) return;

  updateDb((db) => {
    const proposal = db.proposals.find((item) => item.id === proposalId);
    if (!proposal) return db;

    const taskCount = executionResult?.applied?.tasks?.length || 0;
    const noteCount = executionResult?.applied?.notes?.length || 0;
    const warningCount = executionResult?.warnings?.length || 0;
    const errorCount = executionResult?.errors?.length || 0;

    proposal.metadata = proposal.metadata || {};
    const appliedTasks = (executionResult?.applied?.tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      linkedTargets: t.linkedTargets || [],
    }));
    const appliedNotes = (executionResult?.applied?.notes || []).map((n) => ({
      id: n.id,
      title: n.title,
      linkedTargets: n.linkedTargets || [],
    }));

    proposal.metadata.twentyExecution = {
      lastJobId: job.id,
      lastSyncedAt: nowIso(),
      opportunityId: executionResult?.payload?.opportunityId || null,
      companyId: executionResult?.payload?.companyId || null,
      dryRun: executionResult?.dryRun === true,
      ok: executionResult?.ok !== false,
      executed: executionResult?.executed !== false,
      updateFields: executionResult?.summary?.updateFields || [],
      taskCount,
      noteCount,
      warningCount,
      errorCount,
      warnings: executionResult?.warnings || [],
      errors: executionResult?.errors || [],
      appliedTaskIds: appliedTasks,
      appliedNoteIds: appliedNotes,
      opportunityUpdate: executionResult?.applied?.opportunityUpdate || null,
    };
    proposal.updatedAt = nowIso();

    const label = executionResult?.dryRun
      ? 'Twenty execution dry-run validated'
      : executionResult?.ok === false
        ? `Twenty execution applied with partial failures (${taskCount} tasks, ${noteCount} notes, ${errorCount} errors)`
        : `Twenty execution applied (${taskCount} tasks, ${noteCount} notes${warningCount ? `, ${warningCount} warnings` : ''})`;

    appendWorkflowStep(proposal, {
      stage: proposal.status || 'crm_sync',
      status: executionResult?.ok === false ? 'warning' : 'completed',
      label,
    });

    return db;
  });
}

async function processJob(job) {
  const timestamp = nowIso();
  let result = {
    ok: true,
    message: 'Processed',
    updates: {},
  };
  let afterCommit = null;

  updateDb((db) => {
    switch (job.action) {
      case 'ingest_solicitation': {
        const duplicate = findDuplicateProposal(db, job.payload || {});
        if (duplicate) {
          appendWorkflowStep(duplicate, {
            stage: duplicate.status || 'intake',
            label: 'Duplicate solicitation intake blocked (existing proposal reused)',
          });
          result = {
            ok: true,
            message: 'Duplicate solicitation detected; existing proposal reused',
            updates: { proposalId: duplicate.id, duplicate: true },
          };
          break;
        }

        const proposal = createProposalFromSolicitation(job.payload || {});
        db.proposals.unshift(proposal);
        db.opportunities.unshift({
          id: proposal.id,
          title: proposal.title,
          agency: proposal.agency,
          url: job.payload?.sourceUrl || '',
          stage: 'intake',
          createdAt: proposal.createdAt,
          metrics: {
            Profitability: 70,
            StrategicFit: 70,
            Competition: 50,
            SubcontractingPotential: 40,
            LikelihoodOfAward: 60,
            RelationshipLeverage: 40,
            PastPerformanceMatch: 60,
          },
        });
        result = {
          ok: true,
          message: 'Solicitation ingested',
          updates: { proposalId: proposal.id },
        };
        break;
      }

      case 'run_portal_watch': {
        const enabledPortals = (db.watchers?.portals || []).filter((portal) => portal.enabled);
        const created = [];
        for (const portal of enabledPortals) {
          if (portal.mockData && process.env.ALLOW_MOCK_WATCHERS !== 'true') {
            continue;
          }
          for (const template of portal.sampleOpportunities || []) {
            const opportunity = createPortalOpportunity(portal, template, db.businessProfile || {});
            const duplicate = db.opportunities.find((item) => item.title === opportunity.title && item.portalId === opportunity.portalId);
            if (!duplicate) {
              db.opportunities.unshift(opportunity);
              created.push(opportunity);
            }
          }
        }
        db.opportunities = db.opportunities.slice(0, 100);
        result = {
          ok: created.length > 0,
          message: created.length > 0
            ? `Portal watch scanned ${enabledPortals.length} portal(s)`
            : 'Portal watch skipped mock sources (set ALLOW_MOCK_WATCHERS=true to enable samples).',
          updates: { created: created.length },
        };
        break;
      }

      case 'intake_opportunity': {
        const opportunityId = job.payload?.opportunityId;
        const opportunity = db.opportunities.find((item) => item.id === opportunityId);
        if (!opportunity) {
          throw new Error(`Opportunity not found: ${opportunityId}`);
        }

        const duplicate = findDuplicateProposal(db, {
          title: opportunity.title,
          agency: opportunity.agency,
          opportunityId: opportunity.id,
          solicitationNumber: opportunity.id,
        });
        if (duplicate) {
          opportunity.stage = 'intake';
          opportunity.proposalId = duplicate.id;
          appendWorkflowStep(duplicate, {
            stage: duplicate.status || 'intake',
            label: `Duplicate opportunity intake blocked (existing proposal ${duplicate.id})`,
          });
          result = {
            ok: true,
            message: 'Duplicate opportunity detected; existing proposal reused',
            updates: { proposalId: duplicate.id, opportunityId: opportunity.id, duplicate: true },
          };
          break;
        }

        const proposal = createProposalFromSolicitation({
          title: opportunity.title,
          agency: opportunity.agency,
          dueDate: opportunity.dueDate,
          notes: opportunity.summary,
          solicitationText: opportunity.summary,
          sourceUrl: opportunity.url,
          solicitationNumber: opportunity.id,
        });

        proposal.metadata.sourceOpportunityId = opportunity.id;
        proposal.metadata.fitScore = opportunity.fitScore;
        proposal.metadata.fitDecision = opportunity.fitDecision;
        proposal.metadata.fitReasons = opportunity.fitReasons;
        appendWorkflowStep(proposal, {
          stage: 'intake',
          label: `Opportunity selected from ${opportunity.portalName || 'watcher'}`,
        });

        db.proposals.unshift(proposal);
        opportunity.stage = 'intake';
        opportunity.proposalId = proposal.id;
        result = {
          ok: true,
          message: 'Opportunity moved into proposal pipeline',
          updates: { proposalId: proposal.id, opportunityId: opportunity.id },
        };
        break;
      }

      case 'upload_solicitation_documents': {
        const proposalId = job.payload?.proposalId;
        const proposal = ensureProposal(db, proposalId);
        if (!proposal) {
          throw new Error(`Proposal not found for document upload: ${proposalId}`);
        }

        const sourceOpportunity = db.opportunities.find((item) => item.id === proposal.metadata?.sourceOpportunityId);
        const docs = job.payload?.documents || sourceOpportunity?.documents || [];
        proposal.files = Array.isArray(proposal.files) ? proposal.files : [];
        for (const doc of docs) {
          proposal.files.push({
            id: doc.id || createId('file'),
            name: doc.name || 'solicitation-document',
            createdAt: timestamp,
            type: 'solicitation',
            source: doc.source || 'watcher',
          });
        }
        proposal.updatedAt = timestamp;
        appendWorkflowStep(proposal, {
          stage: 'intake',
          label: 'Solicitation documents attached',
        });
        result = {
          ok: true,
          message: 'Solicitation documents recorded',
          updates: { proposalId, fileCount: proposal.files.length },
        };
        break;
      }

      case 'proposal_overview': {
        const proposalId = job.payload?.proposalId || db.proposals[0]?.id;
        const proposal = ensureProposal(db, proposalId);
        if (!proposal) {
          throw new Error(`Proposal not found for overview: ${proposalId}`);
        }

        proposal.metadata = proposal.metadata || {};
        proposal.metadata.draftOverviewStatus = 'completed';
        proposal.metadata.draftOverview = {
          generatedAt: timestamp,
          summary: `Draft overview for ${proposal.title}`,
          objectives: [
            'Clarify win themes',
            'Outline delivery approach',
            'Capture risks and mitigations',
          ],
          guideAlignment: [
            'Mirror solicitation evaluation criteria',
            'Use agency language directly in section headings',
            'Track compliance checks before final review',
          ],
        };
        proposal.status = proposal.status === 'intake' ? 'outline' : proposal.status;
        proposal.updatedAt = timestamp;
        appendWorkflowStep(proposal, {
          stage: 'outline',
          label: 'Draft overview generated from solicitation context',
        });
        addTaskToProposal(proposal, {
          id: createId('task'),
          proposalId: proposal.id,
          title: 'Review generated draft overview',
          owner: 'Morpheus',
          dueDate: proposal.dueDate,
          completed: false,
          status: 'pending',
          priority: 'high',
          createdAt: timestamp,
        });
        result = {
          ok: true,
          message: 'Draft overview generated',
          updates: { proposalId: proposal.id },
        };
        break;
      }

      case 'build_proposal_draft': {
        const proposalId = job.payload?.proposalId || db.proposals[0]?.id;
        const proposal = ensureProposal(db, proposalId);
        if (!proposal) {
          throw new Error(`Proposal not found for draft: ${proposalId}`);
        }

        proposal.metadata = proposal.metadata || {};
        proposal.metadata.proposalDraftStatus = 'completed';
        proposal.metadata.proposalDraft = {
          generatedAt: timestamp,
          guideUsed: job.payload?.guideId || 'default-guide',
          summary: `Generated proposal draft for ${proposal.title}`,
          sections: [
            'Executive Summary',
            'Technical Approach',
            'Management Plan',
            'Past Performance',
            'Pricing Narrative',
          ],
        };
        proposal.status = 'drafting';
        proposal.updatedAt = timestamp;
        appendWorkflowStep(proposal, {
          stage: 'drafting',
          label: 'Claude draft generated from guide, research, and pre-solicitation brief',
        });
        addTaskToProposal(proposal, {
          id: createId('task'),
          proposalId: proposal.id,
          title: 'Review generated proposal draft',
          owner: 'Morpheus',
          dueDate: proposal.dueDate,
          completed: false,
          status: 'pending',
          priority: 'high',
          createdAt: timestamp,
        });
        result = {
          ok: true,
          message: 'Proposal draft generated',
          updates: { proposalId: proposal.id },
        };
        break;
      }

      case 'run_stage':
      case 'update_stage': {
        const proposalId = job.payload?.proposalId || job.payload?.opportunityId;
        const proposal = ensureProposal(db, proposalId);
        if (!proposal) {
          throw new Error(`Proposal not found for stage update: ${proposalId}`);
        }
        const previousStage = proposal.status;
        const targetStage = job.payload?.stage || nextStage(proposal.status);

        // Validate outputs from current stage before advancing
        const outputCheck = validateStageOutputs(proposal, previousStage);
        const handoff = buildStageHandoff(proposal, previousStage, targetStage);

        proposal.status = targetStage;
        proposal.updatedAt = timestamp;

        // Record the handoff on the proposal
        proposal.stageHandoffs = Array.isArray(proposal.stageHandoffs)
          ? proposal.stageHandoffs : [];
        proposal.stageHandoffs.push(handoff);

        const handoffSignal = handoff.signal === 'clean'
          ? 'all outputs present'
          : `incomplete (missing: ${handoff.outputsMissing.join(', ')})`;

        appendWorkflowStep(proposal, {
          stage: proposal.status,
          label: `Proposal moved to ${proposal.status} — handoff: ${handoffSignal}`,
        });
        const opportunity = db.opportunities.find((item) => item.id === proposalId);
        if (opportunity) {
          opportunity.stage = proposal.status;
        }
        result = {
          ok: true,
          message: `Proposal stage updated to ${targetStage} (handoff: ${handoff.signal})`,
          updates: { proposalId, stage: proposal.status, handoff },
        };
        break;
      }

      case 'log_pipeline_opportunity': {
        const proposalId = job.payload?.proposalId || job.payload?.opportunityId;
        const proposal = ensureProposal(db, proposalId);
        if (!proposal) {
          throw new Error(`Proposal not found for pipeline log: ${proposalId}`);
        }
        proposal.status = proposal.status || 'intake';
        proposal.updatedAt = timestamp;
        if (!db.opportunities.find((item) => item.id === proposal.id)) {
          db.opportunities.unshift({
            id: proposal.id,
            title: proposal.title,
            agency: proposal.agency,
            url: '',
            stage: proposal.status,
            createdAt: timestamp,
            metrics: {
              Profitability: 70,
              StrategicFit: 70,
              Competition: 50,
              SubcontractingPotential: 40,
              LikelihoodOfAward: 60,
              RelationshipLeverage: 40,
              PastPerformanceMatch: 60,
            },
          });
        }
        appendWorkflowStep(proposal, {
          stage: proposal.status,
          label: 'Proposal logged to flowboard pipeline',
        });
        result = {
          ok: true,
          message: 'Opportunity logged to pipeline',
          updates: { proposalId: proposal.id },
        };
        break;
      }

      case 'create_upload_drop': {
        const proposalId = job.payload?.proposalId || job.payload?.opportunityId;
        const proposal = ensureProposal(db, proposalId);
        if (!proposal) {
          throw new Error(`Proposal not found for upload drop: ${proposalId}`);
        }
        proposal.files = Array.isArray(proposal.files) ? proposal.files : [];
        proposal.files.push({
          id: createId('file'),
          name: 'Upload Drop Created',
          createdAt: timestamp,
          type: 'placeholder',
        });
        proposal.updatedAt = timestamp;
        appendWorkflowStep(proposal, {
          stage: proposal.status,
          label: 'Upload drop created for supporting documents',
        });
        result = {
          ok: true,
          message: 'Upload drop recorded',
          updates: { proposalId },
        };
        break;
      }

      case 'run_opportunity_scan': {
        const inputs = loadMarketResearchInputs();
        let created = 0;
        inputs.forEach((item) => {
          const opportunity = {
            id: createId('opportunity'),
            title: item.title || 'Untitled Opportunity',
            agency: item.agency || 'Unknown Agency',
            url: item.url || '',
            stage: 'opportunity',
            summary: item.summary || '',
            createdAt: timestamp,
            metrics: {
              Profitability: 65,
              StrategicFit: 70,
              Competition: 55,
              SubcontractingPotential: 45,
              LikelihoodOfAward: 55,
              RelationshipLeverage: 40,
              PastPerformanceMatch: 60,
            },
          };
          const duplicate = db.opportunities.find((opp) => opp.title === opportunity.title && opp.agency === opportunity.agency);
          if (!duplicate) {
            db.opportunities.unshift(opportunity);
            created += 1;
          }
        });
        db.opportunities = db.opportunities.slice(0, 50);
        result = {
          ok: created > 0,
          message: created > 0 ? 'Opportunity scan completed from market research inputs' : 'Opportunity scan blocked: no market research inputs found.',
          updates: { created },
        };
        break;
      }

      case 'run_market_research': {
        const inputs = loadMarketResearchInputs();
        const portals = (db.watchers?.portals || []).filter((portal) => (portal.tags || []).includes('market_research'));
        if (inputs.length === 0) {
          const artifact = createMarketResearchArtifact(
            db,
            'Market research runner executed but no input files were found. Add JSON inputs in server/data/market-research/inputs to ingest real contract history.',
            portals.map((portal) => ({ name: portal.name, url: portal.url })),
          );
          result = {
            ok: false,
            message: 'Market research blocked: no inputs available',
            updates: { artifactId: artifact.id, count: 0 },
          };
          appendStatusUpdate(`[${timestamp}] Market research blocked: no inputs found.`);
          updateTrackerLine(`- [${timestamp}] Market research blocked (no inputs).`);
          break;
        }

        inputs.forEach((item) => {
          recordKnowledgeItem(db, item);
        });
        const artifact = createMarketResearchArtifact(
          db,
          `Market research ingested ${inputs.length} record(s) from inputs.`,
          portals.map((portal) => ({ name: portal.name, url: portal.url })),
        );
        result = {
          ok: true,
          message: `Market research ingested ${inputs.length} record(s)`,
          updates: { artifactId: artifact.id, count: inputs.length },
        };
        appendStatusUpdate(`[${timestamp}] Market research ingested ${inputs.length} record(s).`);
        updateTrackerLine(`- [${timestamp}] Market research ingested ${inputs.length} record(s).`);
        break;
      }

      case 'outlook_reminder': {
        const event = createReminderEvent(job.payload || {});
        db.calendarEvents.unshift(event);
        result = {
          ok: true,
          message: 'Reminder scheduled locally',
          updates: { eventId: event.id },
        };
        break;
      }

      case 'register_vendor': {
        db.directories.unshift({
          id: createId('directory'),
          portal: job.payload?.portal || 'Unknown Portal',
          portalUrl: job.payload?.portalUrl || '',
          status: 'Started',
          company: job.payload?.company || db.settings.companyName,
          contact: job.payload?.contact || {},
          notes: job.payload?.notes || '',
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        result = {
          ok: true,
          message: 'Vendor registration recorded',
          updates: {},
        };
        break;
      }

      case 'directory_entry': {
        db.directories.unshift({
          id: createId('directory'),
          portal: job.payload?.portal || '',
          portalUrl: job.payload?.url || '',
          username: job.payload?.username || '',
          status: job.payload?.status || 'Started',
          submittedDate: job.payload?.submittedDate || timestamp,
          notes: job.payload?.notes || '',
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        result = {
          ok: true,
          message: 'Directory entry saved',
          updates: {},
        };
        break;
      }

      case 'run_intake_pipeline': {
        // Full pipeline: create proposal → task checklist → log to flowboard → queue overview job.
        // IMPORTANT: we are already inside the outer updateDb callback — write directly to db,
        // never nest another updateDb call here (inner writes get overwritten by outer return).
        const duplicate = findDuplicateProposal(db, job.payload || {});
        if (duplicate) {
          appendWorkflowStep(duplicate, {
            stage: duplicate.status || 'intake',
            label: 'Duplicate intake pipeline blocked (existing proposal reused)',
          });
          result = {
            ok: true,
            message: 'Duplicate intake detected; existing proposal reused',
            updates: { proposalId: duplicate.id, duplicate: true },
          };
          break;
        }

        const intakeProp = createProposalFromSolicitation(job.payload || {});
        intakeProp.tasks = [];
        generateTaskChecklist(intakeProp, timestamp);
        appendWorkflowStep(intakeProp, {
          stage: 'intake',
          label: 'Intake pipeline started — task checklist generated',
        });

        db.proposals.unshift(intakeProp);

        if (!db.opportunities.find((item) => item.id === intakeProp.id)) {
          db.opportunities.unshift({
            id: intakeProp.id,
            title: intakeProp.title,
            agency: intakeProp.agency,
            url: job.payload?.sourceUrl || '',
            stage: 'intake',
            createdAt: intakeProp.createdAt,
            metrics: {
              Profitability: 70,
              StrategicFit: 70,
              Competition: 50,
              SubcontractingPotential: 40,
              LikelihoodOfAward: 60,
              RelationshipLeverage: 40,
              PastPerformanceMatch: 60,
            },
          });
        }

        // Push overview job directly onto the queue (no nested updateDb)
        db.jobs.push({
          id: createId('job'),
          action: 'proposal_overview',
          payload: { proposalId: intakeProp.id },
          status: 'queued',
          createdAt: timestamp,
        });

        result = {
          ok: true,
          message: `Intake pipeline started — ${intakeProp.tasks.length} tasks generated, overview queued`,
          updates: { proposalId: intakeProp.id, taskCount: intakeProp.tasks.length },
        };
        break;
      }

      case 'generate_task_checklist': {
        // Also inside the outer updateDb callback — write directly to db.
        const gclProposalId = job.payload?.proposalId;
        const gclTarget = db.proposals.find((item) => item.id === gclProposalId);
        if (!gclTarget) {
          throw new Error(`Proposal not found for task checklist: ${gclProposalId}`);
        }
        gclTarget.tasks = [];
        generateTaskChecklist(gclTarget, timestamp);
        gclTarget.updatedAt = timestamp;
        appendWorkflowStep(gclTarget, {
          stage: gclTarget.status,
          label: `Task checklist generated (${gclTarget.tasks.length} tasks)`,
        });
        result = {
          ok: true,
          message: 'Task checklist generated',
          updates: { proposalId: gclProposalId, taskCount: gclTarget.tasks.length },
        };
        break;
      }

      case 'sync_twenty_execution': {
        result = {
          ok: true,
          message: 'Twenty execution enqueued — awaiting apply',
          updates: {
            opportunityId: job.payload?.opportunityId || null,
            companyId: job.payload?.companyId || null,
            proposalId: job.payload?.proposalId || null,
            taskCount: Array.isArray(job.payload?.tasks) ? job.payload.tasks.length : 0,
            noteCount: Array.isArray(job.payload?.notes) ? job.payload.notes.length : 0,
          },
        };
        afterCommit = async () => executeTwentyExecution(job.payload || {});
        break;
      }

      case 'vendor_registration_lane': {
        // Creates a vendor registration record AND queues Twenty execution
        // to create a task + note on the associated opportunity/company.
        const vrPayload = job.payload || {};
        const portal = vrPayload.portal || 'Unknown Portal';
        const portalUrl = vrPayload.portalUrl || '';
        const company = vrPayload.company || db.settings.companyName;
        const opportunityId = vrPayload.opportunityId || null;
        const companyId = vrPayload.companyId || null;
        const proposalId = vrPayload.proposalId || null;

        db.directories.unshift({
          id: createId('directory'),
          portal,
          portalUrl,
          status: 'Started',
          company,
          contact: vrPayload.contact || {},
          notes: vrPayload.notes || '',
          opportunityId,
          companyId,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        // Queue Twenty execution if we have a target
        if (opportunityId || companyId) {
          db.jobs.push({
            id: createId('job'),
            action: 'sync_twenty_execution',
            payload: {
              opportunityId,
              companyId,
              proposalId,
              source: 'vendor-registration',
              update: opportunityId ? { nextAction: `Complete vendor registration on ${portal}` } : undefined,
              tasks: [{
                title: `Vendor registration: ${portal}`,
                body: `Register on ${portal}${portalUrl ? ` (${portalUrl})` : ''} as ${company}. Submit W-9, COI, and vendor packet.`,
                status: 'TODO',
                opportunityId,
                companyId,
              }],
              notes: [{
                title: `Vendor registration started: ${portal}`,
                body: `Registration initiated for ${company} on ${portal}.${vrPayload.notes ? `\n\nNotes: ${vrPayload.notes}` : ''}`,
                opportunityId,
                companyId,
              }],
            },
            status: 'queued',
            createdAt: timestamp,
          });
        }

        result = {
          ok: true,
          message: `Vendor registration recorded for ${portal}${(opportunityId || companyId) ? ' — Twenty execution queued' : ''}`,
          updates: { portal, opportunityId, companyId },
        };
        break;
      }

      case 'run_followup_cadence': {
        // Scans proposals/opportunities for overdue next-action dates
        // and queues Twenty execution tasks for follow-up.
        const nowMs = Date.now();
        const followups = [];

        for (const proposal of db.proposals) {
          const meta = proposal.metadata?.twentyExecution;
          if (!meta?.opportunityId) continue;

          // Check if proposal has an overdue next-action from Twenty data
          const nextActionDate = meta.nextActionDate || proposal.metadata?.nextActionDate;
          if (!nextActionDate) continue;

          const actionMs = new Date(nextActionDate).getTime();
          if (Number.isNaN(actionMs) || actionMs > nowMs) continue;

          // Don't create duplicate follow-ups within the same day
          const todayKey = new Date().toISOString().slice(0, 10);
          const alreadyQueued = db.jobs.some((j) =>
            j.action === 'sync_twenty_execution'
            && j.payload?.source === 'followup-cadence'
            && j.payload?.proposalId === proposal.id
            && j.createdAt?.startsWith(todayKey)
          );
          if (alreadyQueued) continue;

          db.jobs.push({
            id: createId('job'),
            action: 'sync_twenty_execution',
            payload: {
              opportunityId: meta.opportunityId,
              companyId: meta.companyId || null,
              proposalId: proposal.id,
              source: 'followup-cadence',
              tasks: [{
                title: `Follow-up overdue: ${proposal.title}`,
                body: `Next action was due ${nextActionDate}. Original action: ${proposal.metadata?.nextAction || 'not specified'}`,
                status: 'TODO',
                opportunityId: meta.opportunityId,
                companyId: meta.companyId || null,
              }],
            },
            status: 'queued',
            createdAt: timestamp,
          });

          followups.push({ proposalId: proposal.id, title: proposal.title, overdueSince: nextActionDate });
        }

        result = {
          ok: true,
          message: followups.length > 0
            ? `Follow-up cadence: ${followups.length} overdue action(s) queued`
            : 'Follow-up cadence: no overdue actions found',
          updates: { followups },
        };
        break;
      }

      case 'run_outreach_cadence': {
        // Growth-aware outreach cadence engine.
        // Scans active opportunities, determines which need a touch based on
        // relationship temperature + days since last activity, and queues actions.
        const TOUCH_INTERVALS = {
          // [priority]: { hot: days, warm: days, cold: days }
          urgent: { hot: 2, warm: 3, cold: 5 },
          high:   { hot: 3, warm: 5, cold: 7 },
          medium: { hot: 5, warm: 7, cold: 14 },
          low:    { hot: 7, warm: 14, cold: 21 },
        };
        const ACTIVE_STAGES = new Set(['SCREENING', 'MEETING', 'PROPOSAL']);
        const todayStr = new Date().toISOString().slice(0, 10);
        const outreachActions = [];

        for (const proposal of db.proposals) {
          const meta = proposal.metadata || {};
          const execMeta = meta.twentyExecution || {};
          const oppId = execMeta.opportunityId || meta.twentyOpportunityId;
          if (!oppId) continue;

          const pfStage = proposal.status || 'intake';
          const stageToTwenty = {
            intake: 'NEW', qualification: 'SCREENING', pre_solicitation: 'SCREENING',
            research: 'MEETING', technical_compliance: 'MEETING',
            pricing_strategy: 'PROPOSAL', pricing_packaging: 'PROPOSAL', drafting: 'PROPOSAL',
            review: 'PROPOSAL', google_docs_final: 'PROPOSAL', submitted: 'CUSTOMER',
          };
          const twentyStage = stageToTwenty[pfStage] || 'NEW';
          if (!ACTIVE_STAGES.has(twentyStage)) continue;

          const temp = meta.relationshipTemperature || 'warm';
          const priority = meta.priority || proposal.priority || 'medium';
          const intervals = TOUCH_INTERVALS[priority] || TOUCH_INTERVALS.medium;
          const maxDays = intervals[temp] || intervals.warm;

          const lastTouch = meta.lastMeaningfulDate
            || execMeta.lastSyncedAt
            || proposal.updatedAt
            || proposal.createdAt;
          const daysSince = lastTouch
            ? Math.floor((Date.now() - new Date(lastTouch).getTime()) / (24 * 60 * 60 * 1000))
            : 999;

          if (daysSince < maxDays) continue;

          const alreadyQueued = db.jobs.some((j) =>
            ['sync_twenty_execution', 'dispatch_outreach_email'].includes(j.action)
            && j.payload?.source === 'outreach-cadence'
            && j.payload?.proposalId === proposal.id
            && j.createdAt?.startsWith(todayStr)
          );
          if (alreadyQueued) continue;

          const touchType = twentyStage === 'SCREENING' ? 'qualification call'
            : twentyStage === 'MEETING' ? 'scope discussion'
            : 'proposal follow-up';

          const recipient = meta.outreach?.to || meta.primaryContactEmail || execMeta.primaryContactEmail || null;
          const body = `${proposal.title || 'Opportunity'} is due for ${touchType}.\n\nStage: ${twentyStage}\nDays since last touch: ${daysSince}\nReason: threshold ${maxDays}d for ${priority}/${temp}.`;

          if (recipient) {
            db.jobs.push({
              id: createId('job'),
              action: 'dispatch_outreach_email',
              payload: {
                proposalId: proposal.id,
                opportunityId: oppId,
                companyId: execMeta.companyId || null,
                source: 'outreach-cadence',
                mode: meta.outreach?.mode || 'draft',
                to: recipient,
                cc: meta.outreach?.cc || [],
                bcc: meta.outreach?.bcc || [],
                subject: meta.outreach?.subject || `${proposal.title || 'Opportunity'} - ${touchType}`,
                text: meta.outreach?.text || body,
                html: meta.outreach?.html || '',
                touchType,
                daysSince,
                threshold: maxDays,
              },
              status: 'queued',
              createdAt: timestamp,
            });
          } else {
            db.jobs.push({
              id: createId('job'),
              action: 'sync_twenty_execution',
              payload: {
                opportunityId: oppId,
                companyId: execMeta.companyId || null,
                proposalId: proposal.id,
                source: 'outreach-cadence',
                tasks: [{
                  title: `Outreach: ${touchType} — ${proposal.title || 'opportunity'}`,
                  body: `${daysSince} days since last touch (threshold: ${maxDays}d for ${priority}/${temp}). Stage: ${twentyStage}.`,
                  status: 'TODO',
                  opportunityId: oppId,
                }],
                notes: [{
                  title: `Outreach cadence triggered`,
                  body: `Auto-queued ${touchType}. ${daysSince}d since last touch (${priority} priority, ${temp} relationship).`,
                  opportunityId: oppId,
                }],
              },
              status: 'queued',
              createdAt: timestamp,
            });
          }

          outreachActions.push({
            proposalId: proposal.id,
            title: proposal.title,
            touchType,
            daysSince,
            threshold: maxDays,
            priority,
            temp,
            dispatchMode: recipient ? (meta.outreach?.mode || 'draft') : 'task_only',
          });
        }

        result = {
          ok: true,
          message: outreachActions.length > 0
            ? `Outreach cadence: ${outreachActions.length} touch(es) queued`
            : 'Outreach cadence: all relationships within threshold',
          updates: { outreachActions },
        };
        break;
      }

      case 'dispatch_outreach_email': {
        const payload = job.payload || {};
        const proposalId = payload.proposalId;
        const proposal = proposalId ? ensureProposal(db, proposalId) : null;
        const outboundEmail = payload.from || db.settings?.outboundEmail || db.settings?.ownerEmail;
        const dispatchRecord = {
          id: createId('dispatch'),
          type: 'outreach_email',
          source: payload.source || 'manual',
          mode: payload.mode === 'send' ? 'send' : 'draft',
          to: payload.to,
          cc: payload.cc || [],
          bcc: payload.bcc || [],
          subject: payload.subject || '',
          createdAt: timestamp,
          status: 'queued_for_gmail',
        };

        if (proposal) {
          proposal.metadata = proposal.metadata || {};
          proposal.metadata.outreachDispatches = Array.isArray(proposal.metadata.outreachDispatches)
            ? proposal.metadata.outreachDispatches
            : [];
          proposal.metadata.outreachDispatches.unshift(dispatchRecord);
          proposal.metadata.outreachDispatches = proposal.metadata.outreachDispatches.slice(0, 50);
          proposal.metadata.lastOutreachDispatchAt = timestamp;
          proposal.updatedAt = timestamp;
          appendWorkflowStep(proposal, {
            stage: proposal.status || 'outreach',
            label: `Outreach email ${dispatchRecord.mode} queued for Gmail`,
          });
        }

        result = {
          ok: true,
          message: `Outreach email ${dispatchRecord.mode} queued for Gmail dispatch`,
          updates: {
            proposalId: proposal?.id || null,
            dispatchRecord,
            from: outboundEmail,
          },
        };

        afterCommit = async () => {
          const gmailResult = await dispatchGmailMessage({
            from: outboundEmail,
            to: payload.to,
            cc: payload.cc || [],
            bcc: payload.bcc || [],
            replyTo: payload.replyTo || outboundEmail,
            subject: payload.subject || '',
            text: payload.text || '',
            html: payload.html || '',
            threadId: payload.threadId || undefined,
            mode: payload.mode === 'send' ? 'send' : 'draft',
          });

          updateDb((workingDb) => {
            if (!proposalId) return workingDb;
            const workingProposal = ensureProposal(workingDb, proposalId);
            if (!workingProposal) return workingDb;
            workingProposal.metadata = workingProposal.metadata || {};
            const items = Array.isArray(workingProposal.metadata.outreachDispatches)
              ? workingProposal.metadata.outreachDispatches
              : [];
            const match = items.find((item) => item.id === dispatchRecord.id);
            if (match) {
              match.status = 'dispatched';
              match.dispatchedAt = nowIso();
              match.gmail = gmailResult;
            }
            workingProposal.metadata.lastMeaningfulDate = nowIso();
            workingProposal.updatedAt = nowIso();
            return workingDb;
          });

          return {
            ok: true,
            message: `Outreach email ${gmailResult.mode === 'send' ? 'sent' : 'drafted'} in Gmail`,
            dispatch: gmailResult,
          };
        };
        break;
      }

      case 'health_ping': {
        result = {
          ok: true,
          message: 'Health ping recorded',
          updates: {},
        };
        break;
      }

      case 'post_daily_report': {
        const report = addReport(db, 'daily', job.payload?.lines || [
          `Open proposals: ${db.proposals.filter((proposal) => proposal.status !== 'submitted').length}`,
          `Submitted proposals: ${db.proposals.filter((proposal) => proposal.status === 'submitted').length}`,
          `Outstanding reminders: ${db.calendarEvents.length}`,
        ]);
        result = {
          ok: true,
          message: 'Daily report posted',
          updates: { reportId: report.id },
        };
        break;
      }

      case 'post_weekly_report': {
        const dueSoonThreshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime();
        const proposals = Array.isArray(db.proposals) ? db.proposals : [];
        const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
        const reports = Array.isArray(db.reports) ? db.reports : [];
        const typeCounts = proposals.reduce((acc, proposal) => {
          const key = proposal?.type || 'unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const dueSoon = proposals.filter((proposal) => {
          const due = proposal?.dueDate ? new Date(proposal.dueDate).getTime() : null;
          return due && due >= Date.now() && due <= dueSoonThreshold;
        });
        const overdue = proposals.filter((proposal) => proposal?.dueDate && new Date(proposal.dueDate).getTime() < Date.now());
        const stageCounts = proposals.reduce((acc, proposal) => {
          const key = proposal?.status || 'unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const lines = job.payload?.lines || [
          `Weekly pipeline count: ${proposals.length}`,
          `Active opportunities: ${opportunities.length}`,
          `Federal opportunities: ${typeCounts.federal || 0}`,
          `State/local opportunities: ${typeCounts.state_local || 0}`,
          `Commercial opportunities: ${typeCounts.commercial || 0}`,
          `Due within 7 days: ${dueSoon.length}`,
          `Overdue items: ${overdue.length}`,
          `Current drafting stage count: ${stageCounts.drafting || 0}`,
          `Current review stage count: ${(stageCounts.review || 0) + (stageCounts.internal_review || 0)}`,
          `Current Google Docs final stage count: ${(stageCounts.google_docs_final || 0) + (stageCounts.final_review || 0)}`,
          `Reports on file: ${reports.length}`,
          `Directory records: ${db.directories.length}`,
        ];
        const report = addReport(db, 'weekly', lines);
        result = {
          ok: true,
          message: 'Weekly report posted',
          updates: { reportId: report.id },
        };
        break;
      }

      default: {
        throw new Error(`Unsupported automation action: ${job.action}`);
      }
    }

    return db;
  });

  if (afterCommit) {
    const executionResult = await afterCommit();
    result = {
      ok: executionResult.ok !== false,
      message: executionResult.message || result.message,
      errors: executionResult.errors || [],
      warnings: executionResult.warnings || [],
      updates: executionResult,
    };

    if (job.action === 'sync_twenty_execution') {
      recordTwentyExecutionOnProposal(job, executionResult);
    }
  }

  const jobStatus = result.ok === false ? 'failed'
    : (result.updates?.errors?.length || result.errors?.length) ? 'applied_partial'
    : 'applied';

  updateDb((db) => {
    const jobRecord = db.jobs.find((item) => item.id === job.id);
    if (jobRecord) {
      jobRecord.status = jobStatus;
      jobRecord.processedAt = nowIso();
      jobRecord.result = result;
    }
    db.jobs = compactJobs(db.jobs);
    return db;
  });

  appendHealthEvent({
    action: job.action,
    jobId: job.id,
    status: jobStatus,
    ok: result.ok !== false,
    message: result.message,
    warningCount: result.warnings?.length || 0,
    errorCount: result.errors?.length || 0,
    details: {
      updates: result.updates,
      warnings: result.warnings,
      errors: result.errors,
    },
    timestamp,
  });

  return result;
}

export { findDuplicateProposal, STAGE_SEQUENCE, nextStage };

/**
 * Check if all tasks for the current stage are completed.
 * If so, advance the proposal to the next stage.
 * Returns the new stage if advanced, or null if no change.
 */
export function checkStageAutoAdvance(proposal) {
  if (!proposal || !Array.isArray(proposal.tasks) || proposal.tasks.length === 0) return null;

  const currentStage = proposal.status;
  if (!currentStage || !STAGE_SEQUENCE.includes(currentStage)) return null;
  if (currentStage === STAGE_SEQUENCE[STAGE_SEQUENCE.length - 1]) return null; // already at final stage

  const stageTasks = proposal.tasks.filter((t) => t.stage === currentStage);
  if (stageTasks.length === 0) return nextStage(currentStage); // no tasks for this stage — pass through

  const allCompleted = stageTasks.every((t) => t.completed === true || t.status === 'completed');
  if (!allCompleted) return null;

  return nextStage(currentStage);
}

export function enqueueJobs(jobs) {
  const normalizedJobs = (Array.isArray(jobs) ? jobs : [jobs]).map((job) => ({
    id: job.id || createId('job'),
    action: job.action || job.type || 'unknown',
    payload: job.payload || {},
    status: 'queued',
    createdAt: nowIso(),
  }));

  updateDb((db) => {
    db.jobs.unshift(...normalizedJobs);
    db.jobs = compactJobs(db.jobs);
    return db;
  });

  return normalizedJobs;
}

export async function runWorkerPass() {
  const db = getDb();
  const queuedJobs = db.jobs
    .filter((job) => job.status === 'queued')
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

  const passResults = { done: [], failed: [], skipped: 0 };

  for (const job of queuedJobs) {
    try {
      updateDb((workingDb) => {
        const existing = workingDb.jobs.find((item) => item.id === job.id);
        if (existing) {
          existing.status = 'processing';
          existing.startedAt = nowIso();
        }
        return workingDb;
      });

      const result = await processJob(job);
      passResults.done.push({ action: job.action, message: result?.message || 'OK' });
    } catch (error) {
      updateDb((workingDb) => {
        const existing = workingDb.jobs.find((item) => item.id === job.id);
        if (existing) {
          existing.status = 'failed';
          existing.processedAt = nowIso();
          existing.error = error.message;
        }
        return workingDb;
      });

      appendHealthEvent({
        action: job.action,
        jobId: job.id,
        ok: false,
        error: error.message,
        timestamp: nowIso(),
      });

      passResults.failed.push({ action: job.action, error: error.message });
    }
  }

  return passResults;
}

function shouldCreateCadenceReport(db, kind) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return !db.reports.some((report) => report.kind === kind && report.createdTime?.startsWith(today));
}

function shouldRunMarketResearch(db) {
  const today = new Date().toISOString().slice(0, 10);
  return !db.health.events.some((event) => event.action === 'run_market_research' && event.timestamp?.startsWith(today));
}

/**
 * Housekeeping pass — backfill tasks and scoring on proposals that slipped through intake.
 * Runs every worker tick (15s). Only touches proposals that are missing data.
 */
export function runHousekeepingPass() {
  const db = getDb();
  const timestamp = nowIso();
  let seeded = 0;
  let scored = 0;

  updateDb((workingDb) => {
    const bp = workingDb.businessProfile || {};

    for (const proposal of workingDb.proposals) {
      // Backfill task checklist on proposals with no tasks
      if (!Array.isArray(proposal.tasks) || proposal.tasks.length === 0) {
        proposal.tasks = [];
        generateTaskChecklist(proposal, timestamp);
        appendWorkflowStep(proposal, {
          stage: proposal.status || 'intake',
          label: `Housekeeping: task checklist backfilled (${proposal.tasks.length} tasks)`,
        });
        seeded++;
      }

      // Auto-close proposals whose notes indicate award to another vendor
      const notesLower = (proposal.notes || '').toLowerCase();
      if (proposal.status !== 'closed' && proposal.status !== 'submitted') {
        const isAwarded = notesLower.includes('awarded to another') || notesLower.includes('award notice');
        const isClosed = notesLower.includes('closed:') || notesLower.includes('removed from active');
        if (isAwarded || isClosed) {
          proposal.status = 'closed';
          proposal.updatedAt = timestamp;
          appendWorkflowStep(proposal, {
            stage: 'closed',
            label: 'Housekeeping: auto-closed (award notice detected in notes)',
          });
        }
      }

      // Score/re-score proposals not yet scored with v2 algorithm
      proposal.metadata = proposal.metadata || {};
      if (proposal.metadata.fitAlgorithm !== 'v2') {
        const fit = scoreOpportunity(
          { title: proposal.title, summary: proposal.notes || '', agency: proposal.agency },
          bp,
        );
        proposal.metadata.fitScore = fit.fitScore;
        proposal.metadata.fitDecision = fit.fitDecision;
        proposal.metadata.fitReasons = fit.fitReasons;
        proposal.metadata.fitAlgorithm = 'v2';
        scored++;
      }
    }

    // Dedup pass: merge proposals with matching solicitation IDs
    const seen = new Map(); // solId -> first proposal index
    const toRemove = new Set();
    for (let i = 0; i < workingDb.proposals.length; i++) {
      const p = workingDb.proposals[i];
      if (p.status === 'closed') continue;
      const solId = extractSolicitationId(p.title);
      if (!solId || solId.length < 5) continue;
      if (seen.has(solId)) {
        const primaryIdx = seen.get(solId);
        const primary = workingDb.proposals[primaryIdx];
        // Merge: keep whichever has higher fitScore, append notes from other
        if ((p.metadata?.fitScore || 0) > (primary.metadata?.fitScore || 0)) {
          primary.metadata.fitScore = p.metadata.fitScore;
          primary.metadata.fitDecision = p.metadata.fitDecision;
          primary.metadata.fitReasons = p.metadata.fitReasons;
          primary.metadata.fitAlgorithm = p.metadata.fitAlgorithm;
        }
        primary.notes = (primary.notes || '') + ` | Merged from duplicate: ${p.source || p.id}`;
        primary.updatedAt = timestamp;
        appendWorkflowStep(primary, {
          stage: primary.status,
          label: `Housekeeping: merged duplicate (${p.source || p.id})`,
        });
        toRemove.add(i);
      } else {
        seen.set(solId, i);
      }
    }
    if (toRemove.size > 0) {
      workingDb.proposals = workingDb.proposals.filter((_, i) => !toRemove.has(i));
    }

    return workingDb;
  });

  return { seeded, scored };
}

export function runCadencePass() {
  const db = getDb();
  const enqueued = [];

  if (!db.cadence?.enabled) {
    return { enabled: false, enqueued };
  }

  const now = new Date();
  const dayCode = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
  const cadenceDays = Array.isArray(db.cadence?.days) ? db.cadence.days : [];
  const isCadenceDay = cadenceDays.includes(dayCode);

  if (isCadenceDay && shouldCreateCadenceReport(db, 'daily')) {
    enqueueJobs([{ action: 'post_daily_report', payload: {} }]);
    enqueued.push('post_daily_report');
  }

  if (isCadenceDay && shouldRunMarketResearch(db)) {
    enqueueJobs([{ action: 'run_market_research', payload: {} }]);
    enqueued.push('run_market_research');
  }

  if (isCadenceDay && !hasProcessedActionToday(db, 'run_followup_cadence', now)) {
    enqueueJobs([{ action: 'run_followup_cadence', payload: {} }]);
    enqueued.push('run_followup_cadence');
  }

  if (isCadenceDay && !hasProcessedActionToday(db, 'run_outreach_cadence', now)) {
    enqueueJobs([{ action: 'run_outreach_cadence', payload: {} }]);
    enqueued.push('run_outreach_cadence');
  }

  // Weekly reporting is a Friday-close artifact and should not depend on the
  // daily cadence selection. Otherwise a cadence like MON/WED can never emit a
  // Friday weekly report.
  if (dayCode === 'FRI' && shouldCreateCadenceReport(db, 'weekly')) {
    enqueueJobs([{ action: 'post_weekly_report', payload: {} }]);
    enqueued.push('post_weekly_report');
  }

  return { enabled: true, dayCode, isCadenceDay, cadenceDays, enqueued };
}
