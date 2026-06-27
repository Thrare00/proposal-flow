import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createId, getDb, nowIso, updateDb } from './server/automation-store.js';
import {
  enqueueJobs,
  runCadencePass,
  runWorkerPass,
  runHousekeepingPass,
  createProposalFromSolicitation,
  findDuplicateProposal,
  checkStageAutoAdvance,
} from './server/automation-worker.js';
import {
  buildStageHandoff,
  validateStageOutputs,
  getStageAdvanceReadiness,
} from './shared/proposalWorkflow.js';

let _loopState = {
  lastRunAt: null,
  lastCadenceResult: null,
  lastWorkerResult: null,
  consecutiveErrors: 0,
  totalPasses: 0,
  startedAt: new Date().toISOString(),
};

async function safeRunWorkerPass() {
  try {
    const result = await runWorkerPass();
    _loopState.lastWorkerResult = result;
    _loopState.consecutiveErrors = 0;
    return result;
  } catch (error) {
    _loopState.consecutiveErrors++;
    console.error('[automation-worker]', error);
    return { done: [], failed: [{ action: 'worker_pass', error: error.message }] };
  }
}
import { normalizeProposal, deriveIntakeLane, INTAKE_LANES } from './shared/proposalNormalization.js';
import {
  getAttachmentAbsolutePath,
  getAttachmentContentType,
} from './server/attachment-store.js';
import { importLocalProposalAttachments } from './server/proposal-attachments.js';
import {
  isLlmAvailable,
  getLlmStatus,
  generateText as llmText,
  generateJson as llmJson,
  gatherSolicitationText,
} from './server/llm.js';
import { PROMPT_CONTRACTS } from './shared/proposalPrompts.js';
import {
  priceScope,
  priceLineItem,
  formatPricingNarrative,
  estimateJobCost,
  getWinLossInsight,
  PRICING_SERVICES,
  PRICING_ADJUSTERS,
  MARKET_BENCHMARKS,
} from './server/pricing-engine.js';
import {
  getBidHistory,
  getWinLossStats,
  insertBid,
  updateBidOutcome,
  updateBidOutcomeByProposal,
  getBidsByProposal,
  getRateCards,
  upsertRateCard,
  getMarketRates,
  getRevenue,
  upsertRevenue,
} from './server/db/pricing-db.js';
import {
  TECHNICAL_APPROACHES,
  MANAGEMENT_PLAN,
  STAFFING,
  QUALITY_CONTROL,
  buildExecutiveSummary,
  buildPricingNarrative,
  detectServiceType,
  extractScopeText,
  getHighRiskRequirements,
} from './server/proposal-knowledge.js';
import {
  fetchMarketRates,
  detectServicesFromMatrix,
} from './server/market-research.js';
// aiProposalRouter disabled - use MCP/CLI instead
// import aiProposalRouter from './server/ai-routes.js';
import { getAuthUrl, createOAuthClient, saveToken, loadToken } from './server/google-auth.js';
import { dispatchGmailMessage } from './server/gmail-dispatch.js';
import { listTemplates, renderTemplate, proposalToContext } from './server/rapid-response-templates.js';
import { detectStaleInbounds, computeTeamingWindows, getOfficialDispatchSummary } from './server/govcon-alerts.js';
import { getOperatorUpdates, appendOperatorUpdate, resolveBlockedItem, getOperatorSummary, getUnresolvedBlockers } from './server/operator-updates.js';
import {
  REVIEW_DECISIONS,
  ensureSubmissionReview,
  appendSubmissionHistory,
  calculateSubmissionReadiness,
} from './server/submission-workflow.js';
import twentyBridgeRouter from './server/twenty-bridge.js';
import { previewTwentyExecution } from './server/twenty-execution.js';
import { createOpportunity as createTwentyOpportunity, isTwentyConfigured } from './server/bridge/twenty-client.js';
// Lazy-loaded to avoid slow googleapis import blocking startup
let _createFinalDraftDocx;
async function createFinalDraftDocx(proposal, sourceDraft) {
  if (!_createFinalDraftDocx) {
    const mod = await import('./server/word-docs.js');
    _createFinalDraftDocx = mod.createFinalDraftDocx;
  }
  return _createFinalDraftDocx(proposal, sourceDraft);
}
let _createProposalPdf;
async function createProposalPdfLazy(proposal, sourceDraft) {
  if (!_createProposalPdf) {
    const mod = await import('./server/proposal-pdf.js');
    _createProposalPdf = mod.createProposalPdf;
  }
  return _createProposalPdf(proposal, sourceDraft);
}
let _createComplianceDoc;
async function createComplianceDoc(proposal) {
  if (!_createComplianceDoc) {
    const mod = await import('./server/google-docs.js');
    _createComplianceDoc = mod.createComplianceDoc;
  }
  return _createComplianceDoc(proposal);
}
let _createPreSolDoc;
async function createPreSolDoc(proposal) {
  if (!_createPreSolDoc) {
    const mod = await import('./server/google-docs.js');
    _createPreSolDoc = mod.createPreSolDoc;
  }
  return _createPreSolDoc(proposal);
}

import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Past Performance loader (cached in-memory) ──────────────────────────────
let _pastPerformanceCache = null;
function loadPastPerformance() {
  if (_pastPerformanceCache) return _pastPerformanceCache;
  const paths = [
    '/home/ericw/morpheus/data/past_performance.json',
    path.join(__dirname, 'data', 'past_performance.json'),
  ];
  for (const p of paths) {
    try {
      _pastPerformanceCache = JSON.parse(readFileSync(p, 'utf8'));
      return _pastPerformanceCache;
    } catch { /* try next */ }
  }
  console.warn('[past-performance] No past_performance.json found');
  return null;
}

const app = express();
const PORT = Number(process.env.PORT || 5174);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const BASE_PATH = '/proposal-flow';
const isProduction = NODE_ENV === 'production';
const queueToken = process.env.VITE_QUEUE_TOKEN || 'local-dev-token';

function apiPath(route = '') {
  return `${BASE_PATH}/api${route}`;
}

function sanitizeProposal(proposal) {
  const normalized = normalizeProposal(proposal);
  try {
    const review = ensureSubmissionReview(normalized);
    normalized.metadata = normalized.metadata || {};
    normalized.metadata.submissionReadiness = calculateSubmissionReadiness(normalized);
    normalized.metadata.submissionReview = review;
  } catch {
    // ignore enrichment failure
  }
  return normalized;
}

function sendQueueResponse(res, payload) {
  res.status(200).json(payload);
}

// Push a generated artifact into proposal.metadata.generatedArtifacts (capped at 50).
// Returns the artifact record (with assigned id) so the caller can build the artifact URL.
function pushProposalArtifact(proposalId, { type, title, content, format = 'markdown', extra = {} }) {
  const artifact = {
    id: createId('artifact'),
    type,
    title: title || type,
    format,
    content: content || '',
    createdAt: nowIso(),
    ...extra,
  };
  updateDb((db) => {
    const p = db.proposals.find((item) => item.id === proposalId);
    if (p) {
      p.metadata = p.metadata || {};
      p.metadata.generatedArtifacts = Array.isArray(p.metadata.generatedArtifacts)
        ? p.metadata.generatedArtifacts
        : [];
      // For stage artifacts (one per type), replace existing entry of same type
      p.metadata.generatedArtifacts = p.metadata.generatedArtifacts.filter((a) => a.type !== type);
      p.metadata.generatedArtifacts.push(artifact);
      // Cap to 50 most recent
      if (p.metadata.generatedArtifacts.length > 50) {
        p.metadata.generatedArtifacts = p.metadata.generatedArtifacts.slice(-50);
      }
    }
    return db;
  });
  return artifact;
}

function artifactUrlFor(proposalId, artifactId) {
  return `${apiPath('/proposals')}/${proposalId}/artifacts/${artifactId}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderProposalOverviewHtml(proposal) {
  const overview = proposal?.metadata?.draftOverview || {};
  const title = escapeHtml(proposal?.title || 'Proposal Overview');
  const agency = escapeHtml(proposal?.agency || 'Unknown Agency');
  const generatedAt = escapeHtml(overview.generatedAt || nowIso());
  const summary = escapeHtml(overview.summary || `Draft overview for ${proposal?.title || 'proposal'}`);
  const objectives = Array.isArray(overview.objectives) ? overview.objectives : [];
  const guideAlignment = Array.isArray(overview.guideAlignment) ? overview.guideAlignment : [];
  const workflowSteps = Array.isArray(proposal?.metadata?.workflowSteps) ? proposal.metadata.workflowSteps : [];

  const listItems = (items) => items.length
    ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>None recorded yet</li>';

  const stepItems = workflowSteps.length
    ? workflowSteps.slice(-6).reverse().map((step) => `<li><strong>${escapeHtml(step.label || step.stage || 'Step')}</strong><br/><span>${escapeHtml(step.timestamp || '')}</span></li>`).join('')
    : '<li>No workflow steps recorded yet</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Overview</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; background: #f5f1e8; color: #1f2937; }
    .page { max-width: 960px; margin: 0 auto; background: #fff; min-height: 100vh; padding: 40px; }
    h1 { margin: 0 0 8px; color: #1f4d3a; }
    h2 { margin-top: 32px; color: #1f4d3a; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .meta { color: #6b7280; margin-bottom: 24px; }
    .card { background: #fafaf9; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-top: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .badge { display: inline-block; background: #e8f1ec; color: #1f4d3a; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="page">
    <span class="badge">Proposal Flow Overview</span>
    <h1>${title}</h1>
    <div class="meta">${agency} • Generated ${generatedAt}</div>

    <div class="card">
      <strong>Summary</strong>
      <p>${summary}</p>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Objectives</h2>
        <ul>${listItems(objectives)}</ul>
      </div>
      <div class="card">
        <h2>Guide Alignment</h2>
        <ul>${listItems(guideAlignment)}</ul>
      </div>
    </div>

    <div class="card">
      <h2>Recent Workflow Steps</h2>
      <ul>${stepItems}</ul>
    </div>
  </div>
</body>
</html>`;
}

function getRecentHealth(db) {
  return {
    ok: true,
    worker: 'healthy',
    time: nowIso(),
    last_processed: db.health.last_processed,
    events: db.health.events.slice(0, 50),
    results: db.health.events.slice(0, 50),
  };
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') || [] : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Queue-Token', 'x-queue-token'],
  credentials: true,
  optionsSuccessStatus: 204,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiPath(), limiter);
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(compression({ level: 6, threshold: 100 * 1024 }));

function requireQueueToken(req, res, next) {
  const headerToken = req.get('X-Queue-Token') || req.get('x-queue-token');
  if (headerToken && headerToken === queueToken) {
    next();
    return;
  }

  if (!isProduction) {
    next();
    return;
  }

  res.status(401).json({ ok: false, error: 'Invalid queue token' });
}

function handleAutomationFunction(req, res) {
  const fn = req.query.fn;
  const db = getDb();

  switch (fn) {
    case 'enqueue': {
      const jobs = Array.isArray(req.body?.jobs) ? req.body.jobs : Array.isArray(req.body) ? req.body : [req.body];
      const normalized = enqueueJobs(jobs.filter(Boolean));
      setImmediate(() => {
        safeRunWorkerPass();
      });
      sendQueueResponse(res, {
        ok: true,
        accepted: normalized.length,
        jobs: normalized,
        id: normalized[0]?.id || null,
      });
      return;
    }

    case 'getHealth': {
      sendQueueResponse(res, getRecentHealth(db));
      return;
    }

    case 'getCadence': {
      sendQueueResponse(res, db.cadence);
      return;
    }

    case 'setCadence': {
      const payload = req.body || {};
      const updated = updateDb((workingDb) => {
        workingDb.cadence = {
          ...workingDb.cadence,
          ...payload,
          updatedAt: nowIso(),
        };
        return workingDb;
      });
      sendQueueResponse(res, {
        success: true,
        rebuilt: true,
        cadence: updated.cadence,
      });
      return;
    }

    case 'getJobs': {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
      const statusFilter = req.query.status || null;
      let jobs = (db.jobs || [])
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (statusFilter) {
        jobs = jobs.filter((j) => j.status === statusFilter);
      }
      jobs = jobs.slice(0, limit);
      const active = db.jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
      sendQueueResponse(res, {
        ok: true,
        jobs,
        total: db.jobs.length,
        activeCount: active.length,
        queuedCount: active.filter((j) => j.status === 'queued').length,
        processingCount: active.filter((j) => j.status === 'processing').length,
      });
      return;
    }

    case 'getReports': {
      sendQueueResponse(res, { reports: db.reports });
      return;
    }

    case 'getOpportunities': {
      sendQueueResponse(res, db.opportunities);
      return;
    }

    case 'getWatchers': {
      sendQueueResponse(res, db.watchers);
      return;
    }

    case 'getBusinessProfile': {
      sendQueueResponse(res, db.businessProfile);
      return;
    }

    default: {
      res.status(404).json({ ok: false, error: `Unknown automation function: ${fn}` });
    }
  }
}

async function handleTwentyExecutionRequest(req, res, targetOverrides = {}) {
  try {
    const preview = await previewTwentyExecution(req.body || {}, targetOverrides);
    if (!preview.ok) {
      res.status(400).json(preview);
      return;
    }

    if (preview.payload.dryRun) {
      res.status(200).json(preview);
      return;
    }

    const jobs = enqueueJobs([{
      action: 'sync_twenty_execution',
      payload: preview.payload,
    }]);

    setImmediate(() => {
      safeRunWorkerPass();
    });

    res.status(202).json({
      ok: true,
      message: 'Twenty execution enqueued',
      jobs,
      summary: preview.summary,
      payload: preview.payload,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Failed to prepare Twenty execution',
      detail: error.message,
    });
  }
}

app.get(apiPath('/health'), (req, res) => {
  const db = getDb();

  // Check service availability
  const services = {
    storage: false,
    google: false,
    llm: false,
  };

  // Storage: can we read the data directory?
  try {
    readFileSync('server/data/automation-db.json', 'utf8');
    services.storage = true;
  } catch { /* not accessible */ }

  // Google: is google-token.json present?
  try {
    const tokenData = JSON.parse(readFileSync('server/data/google-token.json', 'utf8'));
    services.google = !!(tokenData.access_token || tokenData.refresh_token);
  } catch { /* invalid or missing */ }

  // LLM: check env vars for API keys
  services.llm = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.MINIMAX_API_KEY);

  const allOk = Object.values(services).every(Boolean);
  const anyOk = Object.values(services).some(Boolean);

  res.status(200).json({
    status: allOk ? 'ok' : anyOk ? 'degraded' : 'error',
    message: 'Server is running',
    timestamp: nowIso(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    services,
    automation: getRecentHealth(db),
  });
});

app.get(apiPath('/proposals'), (req, res) => {
  const db = getDb();
  res.json(db.proposals.map(sanitizeProposal));
});

// ─── Intake lanes view — proposals bucketed by intakeLane ────────────────────
// Returns { lanes: { active_pursuit: [...], review_queue: [...], ... }, counts: {...} }
app.get(apiPath('/proposals/by-lane'), (req, res) => {
  const db = getDb();
  const buckets = Object.fromEntries(INTAKE_LANES.map((l) => [l, []]));
  buckets.unclassified = [];

  for (const p of db.proposals) {
    const sp = sanitizeProposal(p);
    const lane = INTAKE_LANES.includes(p.intakeLane) ? p.intakeLane : (deriveIntakeLane(p) ?? null);
    if (lane) {
      buckets[lane].push(sp);
    } else {
      buckets.unclassified.push(sp);
    }
  }

  const counts = Object.fromEntries(
    Object.entries(buckets).map(([k, v]) => [k, v.length])
  );
  res.json({ lanes: buckets, counts });
});

// ─── Update a proposal's intake lane ────────────────────────────────────────
app.patch(apiPath('/proposals/:id/lane'), (req, res) => {
  const { id } = req.params;
  const { intakeLane } = req.body || {};
  if (!INTAKE_LANES.includes(intakeLane)) {
    return res.status(400).json({ ok: false, error: `intakeLane must be one of: ${INTAKE_LANES.join(', ')}` });
  }
  let updated = null;
  updateDb((db) => {
    const p = db.proposals.find((item) => item.id === id);
    if (!p) return db;
    p.intakeLane = intakeLane;
    p.updatedAt = nowIso();
    updated = sanitizeProposal(p);
    return db;
  });
  if (!updated) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.json(updated);
});

// ─── Bulk archive — move award intel + expired to archive lane ───────────────
app.post(apiPath('/proposals/bulk-archive'), (req, res) => {
  const archived = [];
  updateDb((db) => {
    const ts = nowIso();
    for (const p of db.proposals) {
      if (p.intakeLane === 'archive') continue; // already archived
      const derivedLane = deriveIntakeLane(p);
      if (derivedLane === 'archive' || derivedLane === 'award_intel') {
        p.intakeLane = derivedLane;
        p.updatedAt = ts;
        archived.push(p.id);
      }
    }
    return db;
  });
  res.json({ ok: true, archived: archived.length, ids: archived });
});

// ─── Prune scan  - must be before :id route ──────────────────────────────────
app.get(apiPath('/proposals/prune-scan'), (req, res) => {
  const db = getDb();
  const today = new Date();
  const proposals = db.proposals || [];

  const outOfScope = [
    'hazardous waste', 'noxious weed', 'invasive vegetation', 'weed control',
    'weed spraying', 'chemical cleaning', 'hvac', 'plumbing', 'electrical',
    'roofing', 'paving', 'asphalt', 'concrete pour', 'demolition',
    'environmental remediation', 'lead abatement', 'asbestos',
  ];

  const farLocations = [
    'puerto rico', 'mayaguez', 'alaska', 'hawaii', 'guam',
    'kooskia', 'idaho', 'cape cod', 'buzzards bay', 'massachusetts',
    'darrington', 'washington state', 'mendocino', 'california',
    'south dakota', 'big bend, sd', 'vermont', 'winhall',
    'table rock', 'missouri', 'new hampshire', 'maine',
    'oregon', 'montana', 'wyoming', 'north dakota',
  ];

  const results = [];

  for (const p of proposals) {
    const reasons = [];
    const title = (p.title || '').toLowerCase();
    const sol = (p.solicitationText || '').toLowerCase();
    const notes = (p.notes || '').toLowerCase();
    const matrix = p.complianceMatrix || [];
    const matrixText = matrix.map(r => (r.requirement_text || '')).join(' ').toLowerCase();
    const combined = `${title} ${sol} ${notes} ${matrixText}`;
    const meta = p.metadata || {};

    // 1. Bond required
    if (combined.match(/(?:performance|payment|bid|surety)\s+bond/) && !combined.includes('no bond') && !combined.includes('not required')) {
      const bondReq = matrix.find(r => r.requirement_text.toLowerCase().includes('bond'));
      reasons.push({ rule: 'BOND_REQUIRED', detail: bondReq?.requirement_text || 'Bond language detected in solicitation' });
    }

    // 2. Mandatory pre-bid in the past
    if (meta.preBidDate || meta.pre_bid_date) {
      const pbDate = meta.preBidDate || meta.pre_bid_date;
      try {
        const parsed = new Date(pbDate);
        if (!isNaN(parsed) && parsed < today) {
          reasons.push({ rule: 'PREBID_PASSED', detail: `Mandatory pre-bid was ${pbDate}` });
        }
      } catch {}
    }
    const preBidReq = matrix.find(r => r.requirement_text.toLowerCase().includes('mandatory pre-bid'));
    if (preBidReq && preBidReq.status === 'action_required') {
      const dateMatch = (preBidReq.requirement_text || '').match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},?\s*\d{4})/);
      if (dateMatch) {
        try {
          const parsed = new Date(dateMatch[1]);
          if (!isNaN(parsed) && parsed < today) {
            reasons.push({ rule: 'PREBID_PASSED', detail: `Mandatory pre-bid was ${dateMatch[1]}` });
          }
        } catch {}
      }
    }

    // 3. Due date passed
    const dueDate = p.dueDate || meta.dueDate || meta.due_date;
    if (dueDate) {
      try {
        const parsed = new Date(dueDate);
        if (!isNaN(parsed) && parsed < today) {
          reasons.push({ rule: 'DEADLINE_PASSED', detail: `Due date was ${dueDate}` });
        }
      } catch {}
    }

    // 4. Out of scope
    for (const kw of outOfScope) {
      if (combined.includes(kw)) {
        reasons.push({ rule: 'OUT_OF_SCOPE', detail: `Contains "${kw}"` });
        break;
      }
    }

    // 5. Geographic mismatch
    for (const loc of farLocations) {
      if (combined.includes(loc)) {
        reasons.push({ rule: 'GEO_MISMATCH', detail: `Location: ${loc}` });
        break;
      }
    }

    // 6. Duplicate title
    const dupes = proposals.filter(pp => pp.id !== p.id && pp.title === p.title);
    if (dupes.length > 0) {
      reasons.push({ rule: 'DUPLICATE', detail: `${dupes.length} duplicate(s) with same title` });
    }

    // 7. Test/healthcheck data
    if (title.includes('healthcheck') || title.includes('test-ping') || title === 'test') {
      reasons.push({ rule: 'TEST_DATA', detail: 'Healthcheck or test entry' });
    }

    // 8. Construction MATOC
    if (combined.includes('construction') && (combined.includes('matoc') || combined.includes('multiple award task order'))) {
      reasons.push({ rule: 'CONSTRUCTION_MATOC', detail: 'Construction MATOC  - outside Rare Earth capabilities' });
    }

    if (reasons.length > 0) {
      results.push({
        id: p.id,
        title: p.title,
        stage: p.workflow?.currentStage || p.status || 'unknown',
        reasons,
        autoDelete: reasons.some(r => ['TEST_DATA', 'DUPLICATE', 'DEADLINE_PASSED'].includes(r.rule)),
      });
    }
  }

  results.sort((a, b) => (b.autoDelete - a.autoDelete) || (b.reasons.length - a.reasons.length));

  res.json({
    total: proposals.length,
    flagged: results.length,
    clean: proposals.length - results.length,
    candidates: results,
  });
});

app.get(apiPath('/proposals/:id'), (req, res) => {
  const db = getDb();
  const proposal = db.proposals.find((item) => item.id === req.params.id);
  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }
  res.json(sanitizeProposal(proposal));
});

// Proposal CRUD  - create proposal (used by Morpheus push-to-proposal-flow).
app.post(apiPath('/proposals'), (req, res) => {
  const payload = req.body || {};
  const timestamp = nowIso();

  // Dedupe on source (e.g. sam-{noticeId}) so daily sweeps are idempotent.
  const existingDb = getDb();
  if (payload.source) {
    const existing = (existingDb.proposals || []).find((p) => p.source === payload.source);
    if (existing) {
      return res.status(200).json(sanitizeProposal(existing));
    }
  }
  if (payload.source || payload.title) {
    const dup = findDuplicateProposal(existingDb, payload);
    if (dup) {
      return res.status(200).json(sanitizeProposal(dup));
    }
  }

  const proposal = sanitizeProposal({
    id: payload.id || createId('proposal'),
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const captureTiming = proposal.metadata?.captureTiming || {};
  const rapidResponse = proposal.metadata?.rapidResponse || {};

  updateDb((db) => {
    db.proposals.unshift(proposal);
    if (!db.opportunities.find((item) => item.id === proposal.id)) {
      db.opportunities.unshift({
        id: proposal.id,
        title: proposal.title,
        agency: proposal.agency,
        url: proposal.sourceUrl || proposal.opportunity?.sourceUrl || '',
        stage: proposal.status,
        dueDate: proposal.dueDate,
        solicitationNumber: proposal.solicitation_number || proposal.metadata?.solicitationNumber || '',
        source: proposal.source || proposal.metadata?.sourceType || 'manual',
        sourceUrl: proposal.sourceUrl || proposal.opportunity?.sourceUrl || '',
        pursuitPosture: captureTiming.pursuitPosture || 'either',
        pursuitBucket: captureTiming.pursuitBucket || 'urgent',
        intentToBidDate: captureTiming.intentToBidDate || null,
        teamingStartDate: captureTiming.teamingStartDate || null,
        primeOutreachStartDate: captureTiming.primeOutreachStartDate || null,
        primeOutreachEndDate: captureTiming.primeOutreachEndDate || null,
        rapidResponse: {
          inquiryStatus: rapidResponse.inquiryStatus || 'none',
          acknowledgedAt: rapidResponse.acknowledgedAt || null,
          lastInboundAt: rapidResponse.lastInboundAt || null,
        },
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
    return db;
  });

  // Auto-create Twenty opportunity for SAM-sourced proposals
  if (isTwentyConfigured() && proposal.source?.startsWith('sam-')) {
    const meta = proposal.metadata || {};
    createTwentyOpportunity({
      name: proposal.title || 'Untitled opportunity',
      stage: 'NEW',
      source: 'sam',
      sourceRef: meta.solicitationNumber || meta.noticeId || proposal.source || '',
      pursuitType: 'bid',
      priority: (meta.morpheusScore >= 90) ? 'high' : 'medium',
      closeDate: proposal.dueDate || null,
    }).then((twentyOpp) => {
      if (!twentyOpp?.id) return;
      updateDb((db) => {
        const p = db.proposals.find((item) => item.id === proposal.id);
        if (p) {
          p.metadata = p.metadata || {};
          p.metadata.twentyOpportunityId = twentyOpp.id;
          p.twentyOpportunityId = twentyOpp.id;
          p.updatedAt = nowIso();
        }
        return db;
      });
    }).catch(() => {});
  }

  res.status(201).json(proposal);
});

app.patch(apiPath('/proposals/:id'), (req, res) => {
  const proposalId = req.params.id;
  const patch = req.body || {};
  let updatedProposal = null;

  updateDb((db) => {
    const proposal = db.proposals.find((item) => item.id === proposalId);
    if (!proposal) {
      return db;
    }

    const normalizedPatch = sanitizeProposal({
      ...proposal,
      ...patch,
      updatedAt: nowIso(),
    });

    Object.assign(proposal, normalizedPatch);
    updatedProposal = normalizedPatch;

    // Auto-advance: if tasks were updated and all stage tasks are done, advance
    if (patch.tasks) {
      const advanceTo = checkStageAutoAdvance(proposal);
      if (advanceTo) {
        const previousStage = proposal.status;
        const handoff = buildStageHandoff(proposal, previousStage, advanceTo);

        proposal.status = advanceTo;
        proposal.updatedAt = nowIso();
        proposal.metadata = proposal.metadata || {};
        proposal.metadata.workflowSteps = Array.isArray(proposal.metadata.workflowSteps)
          ? proposal.metadata.workflowSteps : [];

        // Record the handoff
        proposal.stageHandoffs = Array.isArray(proposal.stageHandoffs)
          ? proposal.stageHandoffs : [];
        proposal.stageHandoffs.push(handoff);

        const handoffNote = handoff.signal === 'clean'
          ? 'all outputs present'
          : `incomplete (missing: ${handoff.outputsMissing.join(', ')})`;

        proposal.metadata.workflowSteps.unshift({
          id: `step-${Date.now()}`,
          timestamp: nowIso(),
          stage: advanceTo,
          status: 'completed',
          label: `Auto-advanced to ${advanceTo} (all stage tasks completed) — handoff: ${handoffNote}`,
        });
        updatedProposal = { ...proposal };
      }
    }

    const opportunity = db.opportunities.find((item) => item.id === proposalId);
    if (opportunity) {
      const captureTiming = updatedProposal.metadata?.captureTiming || {};
      const rapidResponse = updatedProposal.metadata?.rapidResponse || {};
      if (updatedProposal.status) {
        opportunity.stage = updatedProposal.status;
      }
      opportunity.title = updatedProposal.title;
      opportunity.agency = updatedProposal.agency;
      opportunity.url = updatedProposal.sourceUrl || updatedProposal.opportunity?.sourceUrl || opportunity.url || '';
      opportunity.dueDate = updatedProposal.dueDate || opportunity.dueDate;
      opportunity.solicitationNumber = updatedProposal.solicitation_number || updatedProposal.metadata?.solicitationNumber || opportunity.solicitationNumber || '';
      opportunity.source = updatedProposal.source || updatedProposal.metadata?.sourceType || opportunity.source || 'manual';
      opportunity.sourceUrl = updatedProposal.sourceUrl || updatedProposal.opportunity?.sourceUrl || opportunity.sourceUrl || '';
      opportunity.pursuitPosture = captureTiming.pursuitPosture || 'either';
      opportunity.pursuitBucket = captureTiming.pursuitBucket || 'urgent';
      opportunity.intentToBidDate = captureTiming.intentToBidDate || null;
      opportunity.teamingStartDate = captureTiming.teamingStartDate || null;
      opportunity.primeOutreachStartDate = captureTiming.primeOutreachStartDate || null;
      opportunity.primeOutreachEndDate = captureTiming.primeOutreachEndDate || null;
      opportunity.rapidResponse = {
        inquiryStatus: rapidResponse.inquiryStatus || 'none',
        acknowledgedAt: rapidResponse.acknowledgedAt || null,
        lastInboundAt: rapidResponse.lastInboundAt || null,
      };
    }
    return db;
  });

  if (!updatedProposal) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  // If auto-advanced, also sync to Twenty
  if (patch.tasks && updatedProposal.status && updatedProposal.status !== patch.status) {
    const twentyOppId = updatedProposal.metadata?.twentyOpportunityId
      || updatedProposal.twentyOpportunityId;
    if (twentyOppId) {
      const stageToTwenty = {
        intake: 'NEW', qualification: 'SCREENING', pre_solicitation: 'SCREENING',
        research: 'MEETING', technical_compliance: 'MEETING',
        pricing_strategy: 'PROPOSAL', pricing_packaging: 'PROPOSAL', drafting: 'PROPOSAL',
        review: 'PROPOSAL', google_docs_final: 'PROPOSAL', submitted: 'CUSTOMER',
      };
      const twentyStage = stageToTwenty[updatedProposal.status];
      if (twentyStage) {
        enqueueJobs({
          action: 'sync_twenty_execution',
          payload: {
            proposalId: updatedProposal.id,
            opportunityId: twentyOppId,
            update: { stage: twentyStage },
            notes: [{
              title: `Stage auto-advanced to ${updatedProposal.status}`,
              body: `All tasks for the previous stage were completed. Proposal automatically advanced to **${updatedProposal.status}**.`,
            }],
          },
        });
        setImmediate(() => { safeRunWorkerPass(); });
      }
    }
  }

  res.json(updatedProposal);
});

// ─── Structured Decisions (go/no-go, bid/no-bid) ───────────────────────────
app.post(apiPath('/proposals/:id/decisions'), (req, res) => {
  const { id } = req.params;
  const { type, decision, rationale, decidedBy } = req.body || {};
  if (!type || !decision) {
    return res.status(400).json({ ok: false, error: 'type and decision are required' });
  }
  let result = null;
  updateDb((db) => {
    const proposal = db.proposals.find((p) => p.id === id);
    if (!proposal) return db;
    proposal.metadata = proposal.metadata || {};
    proposal.metadata.decisions = Array.isArray(proposal.metadata.decisions)
      ? proposal.metadata.decisions : [];
    const entry = {
      id: `dec-${Date.now()}`,
      type, // 'go_no_go', 'bid_no_bid', 'partner_selection', 'price_lock', etc.
      decision, // 'go', 'no_go', 'bid', 'no_bid', 'approved', 'rejected'
      rationale: rationale || '',
      decidedBy: decidedBy || 'Eric',
      timestamp: nowIso(),
      stage: proposal.status,
    };
    proposal.metadata.decisions.unshift(entry);
    proposal.updatedAt = nowIso();

    // Record in workflow steps for audit trail
    proposal.metadata.workflowSteps = Array.isArray(proposal.metadata.workflowSteps)
      ? proposal.metadata.workflowSteps : [];
    proposal.metadata.workflowSteps.unshift({
      id: entry.id,
      timestamp: entry.timestamp,
      stage: proposal.status,
      status: 'completed',
      label: `Decision: ${type} = ${decision}${rationale ? ` — ${rationale}` : ''}`,
    });
    result = entry;
    return db;
  });
  if (!result) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.status(201).json({ ok: true, decision: result });
});

// ─── Proposal-linked Blockers ──────────────────────────────────────────────
app.post(apiPath('/proposals/:id/blockers'), (req, res) => {
  const { id } = req.params;
  const { text, severity, owner } = req.body || {};
  if (!text) {
    return res.status(400).json({ ok: false, error: 'text is required' });
  }
  let result = null;
  updateDb((db) => {
    const proposal = db.proposals.find((p) => p.id === id);
    if (!proposal) return db;
    proposal.metadata = proposal.metadata || {};
    proposal.metadata.blockers = Array.isArray(proposal.metadata.blockers)
      ? proposal.metadata.blockers : [];
    const entry = {
      id: `blk-${Date.now()}`,
      text,
      severity: severity || 'medium',
      owner: owner || 'Eric',
      status: 'open',
      createdAt: nowIso(),
      resolvedAt: null,
      stage: proposal.status,
    };
    proposal.metadata.blockers.unshift(entry);
    proposal.updatedAt = nowIso();
    result = entry;
    return db;
  });
  if (!result) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.status(201).json({ ok: true, blocker: result });
});

app.patch(apiPath('/proposals/:id/blockers/:blockerId'), (req, res) => {
  const { id, blockerId } = req.params;
  const patch = req.body || {};
  let result = null;
  updateDb((db) => {
    const proposal = db.proposals.find((p) => p.id === id);
    if (!proposal) return db;
    const blockers = proposal.metadata?.blockers || [];
    const blocker = blockers.find((b) => b.id === blockerId);
    if (!blocker) return db;
    if (patch.status === 'resolved' && blocker.status !== 'resolved') {
      blocker.status = 'resolved';
      blocker.resolvedAt = nowIso();
    }
    if (patch.text) blocker.text = patch.text;
    if (patch.severity) blocker.severity = patch.severity;
    if (patch.owner) blocker.owner = patch.owner;
    proposal.updatedAt = nowIso();
    result = blocker;
    return db;
  });
  if (!result) return res.status(404).json({ ok: false, error: 'Proposal or blocker not found' });
  res.json({ ok: true, blocker: result });
});

// ─── Delete a single proposal ───────────────────────────────────────────────
app.delete(apiPath('/proposals/:id'), (req, res) => {
  const { id } = req.params;
  let deleted = false;

  updateDb((db) => {
    const idx = db.proposals.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.proposals.splice(idx, 1);
      deleted = true;
    }
    // Also remove from opportunities if present
    const oppIdx = (db.opportunities || []).findIndex(o => o.id === id);
    if (oppIdx !== -1) db.opportunities.splice(oppIdx, 1);
    return db;
  });

  if (!deleted) return res.status(404).json({ error: 'Proposal not found' });
  res.json({ ok: true, deleted: id });
});

// ─── Bulk delete proposals ──────────────────────────────────────────────────
app.post(apiPath('/proposals/bulk-delete'), (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'ids array required' });
  }

  const idSet = new Set(ids);
  let count = 0;

  updateDb((db) => {
    const before = db.proposals.length;
    db.proposals = db.proposals.filter(p => !idSet.has(p.id));
    count = before - db.proposals.length;
    if (db.opportunities) {
      db.opportunities = db.opportunities.filter(o => !idSet.has(o.id));
    }
    return db;
  });

  res.json({ ok: true, deleted: count, requested: ids.length });
});

// Capture endpoint  - fires the full intake pipeline in one call.
// solicitation captured → proposal created → task checklist → overview queued → status in Proposal Flow
// Body: { title, agency, dueDate, solicitationText, solicitationNumber, sourceUrl, notes, type }
app.post(apiPath('/capture'), (req, res) => {
  const payload = req.body || {};
  if (!payload.title && !payload.solicitationTitle) {
    res.status(400).json({ error: 'title or solicitationTitle is required' });
    return;
  }

  const jobs = enqueueJobs([{
    action: 'run_intake_pipeline',
    payload,
  }]);

  setImmediate(() => {
    safeRunWorkerPass();
  });

  res.status(202).json({
    ok: true,
    message: 'Intake pipeline enqueued  - proposal will be created with task checklist and overview queued',
    jobId: jobs[0]?.id || null,
  });
});

// Build Compliance Matrix
app.post(apiPath('/proposals/:id/compliance-matrix'), async (req, res) => {
  const { id } = req.params;
  const { execSync } = await import('node:child_process');
  const os = await import('node:os');

  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Get proposal attachments directory
    const proposalDir = getAttachmentAbsolutePath(id, '');
    const MCP_TOOLS = '/home/ericw/.openclaw/workspace/bin';

    // Check if attachments exist
    const fs = await import('node:fs');
    if (!fs.existsSync(proposalDir)) {
      return res.status(200).json({ 
        ok: true,
        message: 'No attachments folder found. Upload docs first.',
        artifactUrl: null
      });
    }
    
    // Run ingest on each supported file in the attachments folder
    const SUPPORTED_EXT = new Set(['.pdf', '.docx', '.doc', '.txt', '.md']);
    const attachFiles = fs.readdirSync(proposalDir)
      .filter(f => SUPPORTED_EXT.has(path.extname(f).toLowerCase()));

    if (attachFiles.length === 0) {
      // ── Text-only fallback: use solicitationText if no files on disk ──
      const solText = await gatherSolicitationText(proposal);
      if (!solText || solText.trim().length < 200) {
        return res.status(200).json({
          ok: true,
          message: 'No supported documents found and no solicitation text available. Upload docs first.',
          artifactUrl: null,
        });
      }
      // Skip file-based ingest and jump straight to LLM augmentation below
      // (reviewPackets will be empty, so the LLM path handles everything)
      console.log(`[compliance-matrix] No files for ${id}, using solicitation text (${solText.length} chars)`);
    }

    let output = '';
    if (attachFiles.length > 0) {
      const filePaths = attachFiles.map(f => `"${path.join(proposalDir, f)}"`).join(' ');
      try {
        output = execSync(`"${MCP_TOOLS}/ingest" ${filePaths} 2>&1`, {
          encoding: 'utf-8',
          timeout: 60000,
          shell: true
        });
      } catch (e) {
        output = e.stdout || e.message || '';
      }
    }
    
    // Try to read the generated review_packet.md, compliance_matrix.md, and metadata.json
    // Check both morpheus and openclaw output directories (ingest symlink resolves to morpheus)
    const reviewPackets = [];
    const opportunitiesDirs = [
      '/home/ericw/morpheus/opportunities/active',
      '/home/ericw/.openclaw/workspace/opportunities/active',
    ];

    // Build set of file UUIDs from THIS proposal's attachments to prevent cross-contamination.
    // Attachment filenames: file-<uuid>-<name>. Opp dirs: <date>-file-<uuid>-<name>.
    const proposalFileIds = new Set(
      attachFiles.map(f => {
        const m = f.match(/^(file-[0-9a-f-]{36})/i);
        return m ? m[1].toLowerCase() : null;
      }).filter(Boolean)
    );
    const dirMatchesProposal = (dir) => {
      if (proposalFileIds.size === 0) return false; // no file IDs — skip all opp dirs to prevent cross-contamination
      return [...proposalFileIds].some(fid => dir.toLowerCase().includes(fid));
    };

    for (const opportunitiesDir of opportunitiesDirs) {
      if (!fs.existsSync(opportunitiesDir)) continue;
      const allDirs = fs.readdirSync(opportunitiesDir).sort();
      // Scope to directories matching this proposal's file IDs only — no fallback
      // (the old slice(-5) fallback caused cross-contamination from other proposals)
      let dirs = allDirs.filter(dirMatchesProposal);
      for (const dir of dirs) {
        // Skip if we already have this dir from the other location
        if (reviewPackets.some(p => p.dir === dir)) continue;
        const packetPath = `${opportunitiesDir}/${dir}/review_packet.md`;
        const matrixPath = `${opportunitiesDir}/${dir}/compliance_matrix.md`;
        const metaPath = `${opportunitiesDir}/${dir}/metadata.json`;
        if (fs.existsSync(packetPath)) {
          const content = fs.readFileSync(packetPath, 'utf-8').slice(0, 3000);
          let meta = {};
          if (fs.existsSync(metaPath)) {
            try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch {}
          }
          let matrixContent = '';
          if (fs.existsSync(matrixPath)) {
            matrixContent = fs.readFileSync(matrixPath, 'utf-8').slice(0, 5000);
          }
          reviewPackets.push({ dir, content, meta, matrixContent });
        }
      }
    }

    // Build structured complianceMatrix from extracted metadata + deep compliance matrix
    const complianceMatrix = [];
    const complianceLimits = [];
    const seenReqTexts = new Set(); // dedup by requirement text
    let reqCounter = 1;
    const pushReq = (req) => {
      const key = req.requirement_text.toLowerCase().trim().slice(0, 80);
      if (seenReqTexts.has(key)) return;
      seenReqTexts.add(key);
      complianceMatrix.push(req);
    };

    for (const packet of reviewPackets) {
      const m = packet.meta;

      // ── First: parse the deep compliance_matrix.md if available ──
      // The ingest tool now generates a full compliance matrix with categorized requirements
      if (packet.matrixContent) {
        const matrixLines = packet.matrixContent.split('\n');
        let currentCategory = 'General';
        for (const line of matrixLines) {
          // Detect category headers like: | **Submission** | | | | | |
          const catMatch = line.match(/^\|\s*\*\*([^*]+)\*\*\s*\|/);
          if (catMatch) {
            currentCategory = catMatch[1].trim();
            continue;
          }
          // Parse requirement rows like: | REQ-001 | requirement text | Section | ☐ identified | P1 | *needs response* |
          const reqMatch = line.match(/^\|\s*(REQ-\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*[☐✅]?\s*(\w+)\s*\|\s*(P[1-4])\s*\|\s*(.+?)\s*\|$/);
          if (reqMatch) {
            const riskMap = { P1: 'high', P2: 'medium', P3: 'low', P4: 'low' };
            pushReq({
              requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
              requirement_text: reqMatch[2].trim(),
              proposal_section: currentCategory,
              status: reqMatch[4].trim(),
              risk_level: riskMap[reqMatch[5]] || 'medium',
              source: 'ingest_deep',
              solicitation_section: reqMatch[3].trim(),
            });
          }
        }
      }

      // ── Fallback: build from metadata fields if no deep matrix was found ──
      if (complianceMatrix.length === 0) {
        if (m.due_date) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: `Submission deadline: ${m.due_date}`,
            category: 'deadline',
            proposal_section: 'Submission',
            status: 'action_required',
            risk_level: 'critical',
            mandatory: true,
          });
        }
        if (m.pre_bid_mandatory) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: `Mandatory pre-bid: ${m.pre_bid_date || 'date TBD'}`,
            category: 'deadline',
            proposal_section: 'Pre-Bid Requirements',
            status: 'action_required',
            risk_level: 'critical',
            mandatory: true,
          });
        } else if (m.pre_bid_date) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: `Pre-bid conference: ${m.pre_bid_date}`,
            category: 'deadline',
            proposal_section: 'Pre-Bid Requirements',
            status: 'identified',
            risk_level: 'medium',
          });
        }
        if (m.notice_id) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: `Solicitation: ${m.notice_id}`,
            category: 'attachment',
            proposal_section: 'Cover Page',
            status: 'identified',
            risk_level: 'low',
          });
        }
        if (m.bond_required) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: `Bond Required: ${m.bond_detail || 'Yes'}`,
            category: 'bonding',
            proposal_section: 'Bonding',
            status: 'action_required',
            risk_level: 'high',
            mandatory: true,
          });
        }
        if (m.insurance) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: `Insurance: ${m.insurance}`,
            category: 'insurance',
            proposal_section: 'Insurance',
            status: 'action_required',
            risk_level: 'high',
            mandatory: true,
          });
        }
        if (m.prevailing_wage) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: 'Prevailing Wage / Davis-Bacon compliance required',
            category: 'regulation',
            proposal_section: 'Labor Compliance',
            status: 'action_required',
            risk_level: 'high',
            mandatory: true,
          });
        }
        if (m.minority_goal) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: 'MBE/DBE participation goal required',
            category: 'regulation',
            proposal_section: 'Labor Compliance',
            status: 'identified',
            risk_level: 'medium',
          });
        }
        if (m.e_verify) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: 'E-Verify enrollment required',
            category: 'regulation',
            proposal_section: 'Labor Compliance',
            status: 'met',
            risk_level: 'low',
            mandatory: true,
          });
        }
        if (m.scope) {
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: m.scope,
            category: 'mandatory',
            proposal_section: 'Scope of Work',
            status: 'identified',
            risk_level: 'medium',
          });
        }
      }
    }

    // ── Extract obligation sentences from raw packet text (shall/must/will) ──
    if (complianceMatrix.length === 0 && reviewPackets.length > 0) {
      const seenTexts = new Set();
      for (const packet of reviewPackets) {
        const raw = packet.content || '';
        // Split into sentences on period, newline, or semicolon boundaries
        const sentences = raw.split(/(?<=[.;])\s+|\n+/).filter(s => s.trim().length > 20);
        for (const sent of sentences) {
          const s = sent.trim();
          // Only extract sentences with obligation language
          if (!/\b(shall|must|will|required to|obligated|is required|are required)\b/i.test(s)) continue;
          // Skip boilerplate/headers
          if (/^(field|check|status|auto-classified|recommendation|next steps)/i.test(s)) continue;
          if (seenTexts.has(s.toLowerCase().slice(0, 80))) continue;
          seenTexts.add(s.toLowerCase().slice(0, 80));
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: s.slice(0, 500),
            category: 'mandatory',
            proposal_section: 'General',
            status: 'identified',
            risk_level: 'medium',
            mandatory: /\b(shall|must|required)\b/i.test(s),
            verbatim_quote: s.slice(0, 200),
            source: 'text_extract',
          });
          if (complianceMatrix.length >= 50) break; // cap at 50
        }
        if (complianceMatrix.length >= 50) break;
      }
    }

    // ── Auto-categorize requirements by keyword matching ──
    for (const req of complianceMatrix) {
      if (req.category) continue; // already categorized
      const t = (req.requirement_text || '').toLowerCase();
      const s = (req.proposal_section || '').toLowerCase();
      if (/deadline|due date|submission date|response date|close date|bid open/.test(t) || s.includes('submission')) {
        req.category = 'deadline';
      } else if (/insurance|liability|workers.?comp|umbrella|professional liability|coverage/.test(t) || s.includes('insurance')) {
        req.category = 'insurance';
        req.mandatory = true;
      } else if (/bond|surety|bid bond|performance bond|payment bond/.test(t) || s.includes('bond')) {
        req.category = 'bonding';
        req.mandatory = true;
      } else if (/e-verify|davis.?bacon|prevailing wage|background check|drug test|license|certification|security clearance|mbe|dbe|minority|small business/.test(t) || s.includes('labor') || s.includes('compliance')) {
        req.category = 'regulation';
        req.mandatory = /shall|must|required/.test(t);
      } else if (/form|pricing|cost sheet|w-9|w9|affidavit|tax compliance|certificate|registration|document|submit|attachment|standard form|sf\s?\d|far\s/i.test(t) || s.includes('form') || s.includes('attachment')) {
        req.category = 'attachment';
        req.mandatory = /shall|must|required/.test(t);
      } else if (/page limit|font|margin|format|copies|electronic|email|upload|portal/.test(t) || s.includes('format')) {
        req.category = 'format';
      } else if (/shall|must|will|required to|obligat/.test(t)) {
        req.category = 'mandatory';
        req.mandatory = true;
      } else {
        req.category = 'mandatory';
      }
    }

    // ── LLM-powered compliance matrix (primary) or deterministic fallback ──
    let llmSource = 'deterministic';
    let executiveSummary = '';
    let bidReadiness = null;

    // Gather the actual solicitation text from THIS proposal's attachments only
    const fullProposal = db.proposals.find((p) => p.id === id);
    let solText = await gatherSolicitationText(fullProposal || proposal);
    if ((!solText || solText.trim().length < 200) && reviewPackets.length > 0) {
      const packetCorpus = reviewPackets.map(p => p.content || '').join('\n\n---\n\n');
      solText = (solText ? solText + '\n\n---\n\n' : '') + packetCorpus;
    }

    // ── PRIMARY PATH: LLM analysis of actual documents ──
    if (isLlmAvailable() && solText && solText.trim().length >= 200) {
      try {
        const contract = PROMPT_CONTRACTS.compliance_matrix_builder;
        const userPrompt = `Analyze this solicitation for ${proposal.title || 'Untitled'}.\nAgency: ${proposal.agency || 'Unknown'}\n\nSOLICITATION TEXT:\n${solText.slice(0, 100000)}`;
        console.log(`[compliance-matrix] LLM analysis for ${id} (${solText.length} chars of solicitation text)`);
        const llmResult = await llmJson(contract.system, userPrompt, {}, 8192);

        // Replace deterministic matrix entirely with LLM-generated one
        if (Array.isArray(llmResult.complianceMatrix) && llmResult.complianceMatrix.length > 0) {
          // Clear deterministic entries — LLM output is authoritative
          complianceMatrix.length = 0;
          seenReqTexts.clear();
          reqCounter = 1;
          for (const item of llmResult.complianceMatrix) {
            pushReq({
              requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
              requirement_text: item.requirement_text || '',
              source_section: item.source_section || '',
              requirement_type: item.requirement_type || 'mandatory',
              mandatory_or_scored: item.mandatory_or_scored || 'mandatory',
              proposal_section: item.proposal_section || 'General',
              action_required: item.action_required || '',
              evidence_needed: item.evidence_needed || [],
              status: item.status || 'open',
              risk_level: item.risk_level || 'medium',
              notes: item.notes || '',
              mandatory: item.mandatory_or_scored === 'mandatory',
              source: 'llm',
            });
          }
          llmSource = `anthropic/${process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'}`;
        }

        // Use LLM-generated requirements array too if present
        if (Array.isArray(llmResult.requirements) && llmResult.requirements.length > 0 && complianceMatrix.length === 0) {
          for (const item of llmResult.requirements) {
            pushReq({
              requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
              requirement_text: item.text || '',
              source_section: item.sourceSection || '',
              requirement_type: item.requirementType || 'mandatory',
              mandatory_or_scored: item.mandatoryOrScored || 'mandatory',
              proposal_section: item.requirementType || 'General',
              status: 'open',
              risk_level: item.riskLevel || 'medium',
              mandatory: item.mandatoryOrScored === 'mandatory',
              source: 'llm',
            });
          }
          llmSource = `anthropic/${process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'}`;
        }

        if (llmResult.complianceSummary) {
          executiveSummary = llmResult.complianceSummary;
        }

        // Extract limits
        if (Array.isArray(llmResult.limits)) {
          for (const lim of llmResult.limits) {
            complianceLimits.push({
              kind: lim.type || 'other',
              value: lim.value || '',
              applies_to: lim.source || '',
            });
          }
        }

        console.log(`[compliance-matrix] LLM produced ${complianceMatrix.length} requirements for ${id}`);
      } catch (llmErr) {
        console.warn(`[compliance-matrix] LLM failed, falling back to deterministic: ${llmErr.message}`);
      }
    }

    // ── FALLBACK: deterministic extraction if LLM didn't produce results ──
    if (complianceMatrix.length === 0 && solText && solText.trim().length > 200) {
      try {
        const seenTexts = new Set(complianceMatrix.map(r => (r.requirement_text || '').toLowerCase().slice(0, 80)));
        const sentences = solText.split(/(?<=[.;])\s+|\n+/).filter(s => s.trim().length > 20 && s.trim().length < 600);
        for (const sent of sentences) {
          if (complianceMatrix.length >= 60) break;
          const s = sent.trim();
          if (!/\b(shall|must|will be required|is required|are required|required to|obligated to)\b/i.test(s)) continue;
          if (/^(field|check|status|auto-classified|recommendation|next steps|not detected|not found)/i.test(s)) continue;
          if (/^\|/.test(s)) continue;
          const key = s.toLowerCase().slice(0, 80);
          if (seenTexts.has(key)) continue;
          seenTexts.add(key);
          pushReq({
            requirement_id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement_text: s.slice(0, 500),
            category: 'mandatory',
            proposal_section: 'General',
            status: 'identified',
            risk_level: 'medium',
            mandatory: /\b(shall|must|required)\b/i.test(s),
            verbatim_quote: s.slice(0, 200),
            source: 'solicitation_extract',
          });
        }
      } catch (e) {
        console.warn('[compliance-matrix] Text extraction failed:', e.message);
      }
    }

    // Deterministic executive summary fallback (only if LLM didn't produce one)
    if (!executiveSummary) {
      const buyer = reviewPackets.map(p => p.meta?.buyer).find(b => b) || proposal.agency || 'Unknown Agency';
      const scope = reviewPackets.map(p => p.meta?.scope).find(s => s) || proposal.title || 'scope not extracted';
      const dueDate = reviewPackets.map(p => p.meta?.due_date).find(d => d) || 'not found';
      const lane = reviewPackets.map(p => p.meta?.lane).find(l => l) || 'review needed';
      const criticalReqs = complianceMatrix.filter(r => r.risk_level === 'high' || r.risk_level === 'critical');
      const insuranceReqs = complianceMatrix.filter(r => (r.proposal_section || '').includes('Insurance') || r.requirement_text.includes('Liability') || r.requirement_text.includes('Workers Comp'));
      const laborReqs = complianceMatrix.filter(r => r.requirement_text.includes('E-Verify') || r.requirement_text.includes('Background') || r.requirement_text.includes('Prevailing'));

      executiveSummary = `Rare Earth Ltd. submits this proposal in response to ${buyer}'s requirement for ${scope}. ` +
        `As a certified MBE/DBE/SDB small business, Rare Earth brings proven capability in facility and grounds maintenance ` +
        `with $529,200+ in past contract value across government and commercial clients. ` +
        `Our approach emphasizes rapid mobilization, documented quality control, and direct owner oversight. ` +
        `Eric White, Owner/PM, serves as the single point of contact for all contract activities. ` +
        `This proposal addresses ${complianceMatrix.length} compliance requirements` +
        `${criticalReqs.length ? ` (${criticalReqs.length} high-priority)` : ''} ` +
        `and demonstrates full responsiveness to the solicitation's technical, staffing, and insurance requirements.`;
    }
    if (!bidReadiness) {
      const hasInsurance = complianceMatrix.some(r => r.requirement_text.includes('Liability') || r.requirement_text.includes('Insurance'));
      const hasBond = complianceMatrix.some(r => r.requirement_text.includes('Bond'));
      const hasBackgroundCheck = complianceMatrix.some(r => r.requirement_text.includes('Background'));
      const hasEVerify = complianceMatrix.some(r => r.requirement_text.includes('E-Verify'));
      const hasReferences = complianceMatrix.some(r => r.requirement_text.includes('Reference'));
      const lane = reviewPackets.map(p => p.meta?.lane).find(l => l) || 'review needed';

      const risks = [];
      const strengths = [];
      if (hasInsurance) risks.push('Insurance requirements  - verify coverage limits match minimums');
      if (hasBond) risks.push('Bonding required  - confirm bonding capacity');
      if (hasBackgroundCheck) risks.push('Background checks on personnel required');
      if (!risks.length) risks.push('No critical risk items detected  - review solicitation manually');
      if (lane === 'prime') strengths.push('Scope aligns with Rare Earth core services (exterior/cleaning)');
      if (hasEVerify) strengths.push('E-Verify already enrolled');
      if (!hasBond) strengths.push('No bonding requirement detected');
      if (!strengths.length) strengths.push('Review opportunity for alignment with capabilities');

      bidReadiness = {
        risks: risks.slice(0, 3),
        strengths: strengths.slice(0, 3),
        goNoGo: lane === 'prime' ? 'CONDITIONAL_GO' : lane === 'sub' ? 'CONDITIONAL_GO' : 'REVIEW',
        goNoGoReason: lane === 'prime' ? 'Scope matches core services  - verify insurance/bonding capacity' :
          lane === 'sub' ? 'Subcontracting opportunity  - identify prime partner' :
          'Manual review needed to assess fit',
      };
    }

    // Save complianceMatrix, complianceLimits, and executive brief to the proposal
    updateDb((db) => {
      const p = db.proposals.find(item => item.id === id);
      if (p) {
        p.complianceMatrix = complianceMatrix;
        if (!p.metadata) p.metadata = {};
        p.metadata.complianceMatrix = complianceMatrix;
        p.metadata.complianceLimits = complianceLimits;
        p.metadata.executiveSummary = executiveSummary;
        p.metadata.bidReadiness = bidReadiness;
        p.workflow = p.workflow || {};
        p.workflow.currentStage = 'compliance';
        p.workflow.updatedAt = nowIso();
        // Mark ingestion + compliance as completed in stages array
        if (Array.isArray(p.workflow.stages)) {
          for (const s of p.workflow.stages) {
            if (s.stageId === 'ingestion' || s.stageId === 'compliance') {
              s.status = 'completed';
              s.completedAt = s.completedAt || nowIso();
            }
          }
        }
      }
      return db;
    });

    // Build a human-readable artifact summarizing compliance findings.
    const pageLimitNote = (complianceLimits.find((l) => l.kind === 'page_limit_note')?.value)
      || 'No explicit page/character limit found';
    const limitLines = complianceLimits
      .filter((l) => l.kind !== 'page_limit_note')
      .map((l) => `- **${l.kind}** (${l.applies_to}): ${l.value}`)
      .join('\n') || '_None detected._';
    // Group requirements by category for structured output
    const CATEGORY_ORDER = ['deadline', 'attachment', 'insurance', 'bonding', 'regulation', 'mandatory', 'format'];
    const CATEGORY_LABELS = {
      deadline: 'Deadlines & Due Dates',
      attachment: 'Required Attachments & Submissions',
      insurance: 'Insurance Requirements',
      bonding: 'Bonding Requirements',
      regulation: 'Regulations & Compliance',
      mandatory: 'Mandatory Obligations (Shall/Must/Will)',
      format: 'Format & Submission Requirements',
    };
    const CATEGORY_ICONS = {
      deadline: '📅', attachment: '📎', insurance: '🛡️', bonding: '💰',
      regulation: '⚖️', mandatory: '⚠️', format: '📄',
    };

    const grouped = {};
    for (const r of complianceMatrix) {
      const cat = r.category || 'mandatory';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r);
    }

    const categoryBlocks = CATEGORY_ORDER
      .filter(cat => grouped[cat]?.length)
      .map(cat => {
        const reqs = grouped[cat];
        const icon = CATEGORY_ICONS[cat] || '';
        const header = `### ${icon} ${CATEGORY_LABELS[cat] || cat} (${reqs.length})`;
        const rows = reqs.map(r => {
          const mandatory = r.mandatory ? '**MANDATORY**' : 'Scored';
          const quote = r.verbatim_quote ? `\n  > _"${r.verbatim_quote}"_` : '';
          return `| ${r.requirement_id} | ${r.requirement_text.replace(/\|/g, '\\|')} | ${mandatory} | ${r.risk_level} | ${r.status || 'identified'} |${quote}`;
        }).join('\n');
        return `${header}\n\n| ID | Requirement | Type | Risk | Status |\n|---|---|---|---|---|\n${rows}`;
      }).join('\n\n');

    // Fallback flat table if no categories
    const flatMatrixLines = complianceMatrix
      .map((m) => `| ${m.requirement_id} | ${m.requirement_text.replace(/\|/g, '\\|')} | ${m.category || '-'} | ${m.mandatory ? 'MANDATORY' : 'Scored'} | ${m.risk_level} |`)
      .join('\n') || '|  - | No requirements extracted |  - |  - |  - |';

    // Executive summary section
    const execSection = `## Executive Summary\n${executiveSummary}\n`;
    const readinessSection = bidReadiness ? `## Bid Readiness Assessment\n` +
      `**Recommendation: ${bidReadiness.goNoGo}**  - ${bidReadiness.goNoGoReason}\n\n` +
      `### Top Risks\n${(bidReadiness.risks || []).map(r => `- ${r}`).join('\n')}\n\n` +
      `### Strengths\n${(bidReadiness.strengths || []).map(s => `- ${s}`).join('\n')}\n` : '';

    const mandatoryCount = complianceMatrix.filter(r => r.mandatory).length;
    const artifactMd = `# Compliance Matrix  - ${proposal.title || 'Untitled'}\n\n` +
      `**Source:** ${llmSource} | **Total Requirements:** ${complianceMatrix.length} | **Mandatory:** ${mandatoryCount}\n\n` +
      `${execSection}\n` +
      `${readinessSection}\n` +
      `**Page / character limit:** ${pageLimitNote}\n\n` +
      `## Constraints & Limits\n${limitLines}\n\n` +
      `## Requirements by Category\n\n${categoryBlocks || `| ID | Requirement | Category | Type | Risk |\n|---|---|---|---|---|\n${flatMatrixLines}`}\n`;
    const artifact = pushProposalArtifact(id, {
      type: 'compliance_matrix',
      title: 'Compliance Matrix',
      content: artifactMd,
      format: 'markdown',
    });

    const complianceText = reviewPackets.map(p => p.content).join('\n\n---\n\n') || output.slice(0, 2000);

    // Queue next stage: pre-solicitation
    enqueueJobs([{ action: 'run_stage', payload: { proposalId: id, stage: 'pre-solicitation' } }]);

    res.status(200).json({
      ok: true,
      message: complianceText,
      artifactUrl: artifactUrlFor(id, artifact.id),
      artifactId: artifact.id,
      packets: reviewPackets.map(p => p.dir),
      complianceMatrix,
      complianceLimits,
      pageLimitNote,
      executiveSummary,
      bidReadiness,
      source: llmSource,
      nextStage: 'pre-solicitation',
    });
  } catch (err) {
    console.error('Compliance matrix error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Batch: reprocess compliance for all proposals needing it ──────────────
app.post(apiPath('/proposals/batch/reprocess-compliance'), async (req, res) => {
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const needsWork = proposals.filter(p => {
      const hasFiles = p.files && p.files.length > 0;
      const hasSolText = p.solicitationText && p.solicitationText.length > 200;
      const emptyMatrix = !p.complianceMatrix || p.complianceMatrix.length === 0;
      return emptyMatrix && (hasFiles || hasSolText);
    });
    const queued = [];
    for (const p of needsWork) {
      enqueueJobs([{ action: 'run_stage', payload: { proposalId: p.id, stage: 'compliance-matrix' } }]);
      queued.push({ id: p.id, title: p.title?.slice(0, 60) });
    }
    res.json({ ok: true, message: `Queued ${queued.length} proposals for compliance reprocessing`, queued });
  } catch (err) {
    console.error('Batch reprocess error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Stage 2: Pre-solicitation ─────────────────────────────────────────────
app.post(apiPath('/proposals/:id/pre-solicitation'), async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const matrix = proposal.complianceMatrix || [];
    let preSolicitation = null;
    let source = 'deterministic';

    // Try LLM first (real solicitation-grounded analysis)
    if (isLlmAvailable()) {
      try {
        const solText = await gatherSolicitationText(proposal);
        const matrixText = JSON.stringify(matrix, null, 2);
        const execSummary = proposal.metadata?.executiveSummary || '';
        const readiness = proposal.metadata?.bidReadiness ? JSON.stringify(proposal.metadata.bidReadiness) : '';
        const pastPerf = loadPastPerformance();
        const pastPerfText = pastPerf ? `\n\nPAST PERFORMANCE PORTFOLIO:\nCompany: ${pastPerf.company}\nCertifications: ${(pastPerf.certifications || []).join(', ')}\nTotal Contract Value: $${(pastPerf.total_contract_value || 0).toLocaleString()}\nContracts:\n${(pastPerf.contracts || []).map(c => `- ${c.title} (${c.client}): $${(c.value || 0).toLocaleString()}, ${c.role}, ${c.period_start || 'ongoing'}–${c.period_end || 'ongoing'}`).join('\n')}` : '';
        const system = `You are a federal/state proposal strategist for Rare Earth Ltd, a minority-owned (MBE/DBE) exterior services contractor specializing in pressure washing, striping, valet trash, janitorial, and grounds maintenance. Analyze the solicitation and produce a pre-solicitation posture brief with specific, actionable guidance. Keep each posture 3-5 sentences. Ground everything in the actual solicitation text and compliance matrix. Reference specific requirements by ID. Leverage the company's past performance portfolio and certifications in positioning.`;
        const user = `PROPOSAL: ${proposal.title || 'Untitled'}\nAGENCY: ${proposal.agency || 'Unknown'}\n\nEXECUTIVE SUMMARY:\n${execSummary}\n\nBID READINESS:\n${readiness}\n\nCOMPLIANCE MATRIX:\n${matrixText || '(empty)'}\n\nSOLICITATION TEXT:\n${solText || '(no solicitation text attached)'}${pastPerfText}\n\nReturn JSON with exactly these fields:\n- subcontractingPosture (string, 3-5 sentences)\n- teamingPosture (string, 3-5 sentences)\n- pricingPosture (string, 3-5 sentences  - reference market rates, prevailing wage, or competitive positioning as applicable)\n- riskNotes (string[])\n- positioningNotes (string[])\n- partnerDocumentsNeeded (string[]  - from: Teaming Contract, Joint Venture, NDA, COI, W9)\n- actionItems (string[]  - specific next steps for the pre-bid team, ordered by priority)`;
        const json = await llmJson(system, user, null, 4096);
        if (json && json.subcontractingPosture) {
          preSolicitation = { ...json, generatedAt: nowIso() };
          source = 'llm';
        }
      } catch (e) {
        console.warn('[pre-solicitation] LLM failed, falling back:', e.message);
      }
    }

    // Deterministic fallback
    if (!preSolicitation) {
      // Content-aware matching  - search requirement text regardless of section names
      const matrixText = matrix.map(r => r.requirement_text).join(' ').toLowerCase();
      const hasBond = matrixText.includes('bond');
      const hasInsurance = matrixText.includes('liability') || matrixText.includes('insurance') || matrixText.includes('workers comp');
      const hasPrevailingWage = matrixText.includes('prevailing wage') || matrixText.includes('davis-bacon');
      const hasMBE = matrixText.includes('mbe') || matrixText.includes('dbe') || matrixText.includes('minority');
      const hasEVerify = matrixText.includes('e-verify');
      const hasPreBid = matrixText.includes('mandatory pre-bid') || matrixText.includes('mandatory site visit');
      const hasBackgroundCheck = matrixText.includes('background check');
      const hasReferences = matrixText.includes('reference');
      const hasLicensing = matrixText.includes('licens');
      const deadline = matrix.find(r => r.requirement_text.toLowerCase().includes('deadline') || r.requirement_text.toLowerCase().includes('due date'));

      // Pull in executive context from compliance matrix stage
      const execSummary = proposal.metadata?.executiveSummary || '';
      const readiness = proposal.metadata?.bidReadiness || {};
      const lane = proposal.metadata?.bidReadiness?.goNoGo || 'REVIEW';

      const riskNotes = [];
      const positioningNotes = [];
      const actionItems = [];

      // Insurance risks with specifics
      const insuranceReqs = matrix.filter(r => {
        const t = r.requirement_text.toLowerCase();
        return t.includes('liability') || t.includes('insurance') || t.includes('workers comp');
      });
      if (insuranceReqs.length) {
        riskNotes.push(`Insurance: ${insuranceReqs.length} coverage types required  - ${insuranceReqs.map(r => r.requirement_text.split(':')[0].trim()).join(', ')}. Verify current certificates meet minimums.`);
        actionItems.push('Pull current insurance certificates and compare coverage limits to solicitation requirements.');
      }
      if (hasBond) {
        riskNotes.push('Bonding required  - verify bonding capacity with surety agent before bid.');
        actionItems.push('Contact surety agent to confirm bonding capacity for this project.');
      }
      if (hasPrevailingWage) {
        riskNotes.push('Prevailing wage / Davis-Bacon applies  - ensure payroll compliance and build labor burden into pricing.');
        actionItems.push('Pull current prevailing wage determination for project location.');
      }
      if (hasPreBid) {
        riskNotes.push('Mandatory pre-bid attendance required  - calendar the date immediately.');
        actionItems.push('Calendar mandatory pre-bid date and assign attendee.');
      }
      if (hasBackgroundCheck) {
        riskNotes.push('Background checks required on all assigned personnel.');
        actionItems.push('Initiate background checks for proposed team members.');
      }
      if (deadline) riskNotes.push(`Deadline: ${deadline.requirement_text}`);

      // Positioning based on actual scope
      if (execSummary) positioningNotes.push(execSummary);
      if (lane === 'CONDITIONAL_GO' || lane === 'GO') {
        positioningNotes.push('Scope aligns with Rare Earth core services  - strong position as prime.');
      }
      if (hasMBE) positioningNotes.push('MBE/DBE participation goal  - leverage Rare Earth MBE/DBE certification as competitive advantage.');
      if (hasEVerify) positioningNotes.push('E-Verify enrollment required  - Rare Earth is enrolled.');
      if (hasReferences) {
        positioningNotes.push('References required  - prepare 3+ recent references for comparable scope.');
        actionItems.push('Compile reference list: company name, POC, phone, email, contract scope, dates.');
      }
      if (hasLicensing) {
        positioningNotes.push('Licensing/certification required  - verify compliance.');
        actionItems.push('Confirm all required licenses are current and in jurisdiction.');
      }

      // Past performance positioning
      const pastPerf = loadPastPerformance();
      if (pastPerf) {
        const totalVal = pastPerf.total_contract_value || 0;
        positioningNotes.push(`Past performance: ${(pastPerf.contracts || []).length} contracts totaling $${totalVal.toLocaleString()}+`);
        if (pastPerf.certifications?.length) {
          positioningNotes.push(`Certifications: ${pastPerf.certifications.join(', ')}`);
        }
        // Find contracts with overlapping service categories
        const relevantContracts = (pastPerf.contracts || []).filter(c => {
          const cats = (c.service_category || []).join(' ').toLowerCase();
          return cats.includes('maintenance') || cats.includes('facility') || cats.includes('grounds');
        });
        if (relevantContracts.length > 0) {
          positioningNotes.push(`${relevantContracts.length} directly relevant contract(s): ${relevantContracts.map(c => c.title).join('; ')}`);
        }
      }

      // Pricing  - build from what we know
      const pricingNotes = [];
      if (hasPrevailingWage) pricingNotes.push('Build prevailing wage rates into labor burden.');
      if (hasInsurance) pricingNotes.push('Factor insurance premium costs into overhead.');
      if (hasBond) pricingNotes.push('Include bond premium (typically 1-3% of contract value).');
      pricingNotes.push('Price competitively as lowest responsive bidder (eRFQ/IFB evaluation).');
      actionItems.push('Develop line-item pricing based on locations list from solicitation.');

      // Strengths/risks from bid readiness  - deduplicate by key terms
      const isDupeNote = (existing, candidate) => {
        const cl = candidate.toLowerCase();
        return existing.some(n => {
          const nl = n.toLowerCase();
          // Check for overlapping key terms (3+ char words)
          const keyTerms = cl.match(/\b\w{4,}\b/g) || [];
          const matches = keyTerms.filter(t => nl.includes(t));
          return matches.length >= 2;
        });
      };
      if (readiness.risks) {
        for (const r of readiness.risks) {
          if (!isDupeNote(riskNotes, r)) riskNotes.push(r);
        }
      }
      if (readiness.strengths) {
        for (const s of readiness.strengths) {
          if (!isDupeNote(positioningNotes, s)) positioningNotes.push(s);
        }
      }

      preSolicitation = {
        subcontractingPosture: hasMBE
          ? 'Active subcontracting required to meet MBE/DBE participation goals. Identify certified subcontractors in the project area. Ensure subcontractor COIs and W-9s are current.'
          : 'Self-perform preferred  - scope aligns with Rare Earth\'s in-house capabilities (pressure washing, exterior cleaning, grounds maintenance). Subcontract only for specialized equipment or height work exceeding 15 stories if needed.',
        teamingPosture: hasMBE
          ? 'MBE/DBE teaming advantage  - Rare Earth\'s minority certification adds value as either prime or team member. Consider joint venture if scope exceeds solo capacity.'
          : hasInsurance && insuranceReqs.length > 2
          ? 'Multiple insurance requirements suggest a larger project  - verify capacity to self-perform or identify teaming partner for scale.'
          : 'Solo bid viable. Scope is within Rare Earth\'s self-perform range. No teaming required unless capacity constraints emerge during pricing.',
        pricingPosture: pricingNotes.join(' '),
        riskNotes: riskNotes.length ? riskNotes : ['No critical risks detected from compliance matrix  - review solicitation manually for unlisted requirements.'],
        positioningNotes: positioningNotes.length ? positioningNotes : ['Review opportunity alignment with Rare Earth capabilities.'],
        partnerDocumentsNeeded: hasMBE ? ['Teaming Contract', 'NDA', 'COI', 'W9'] : ['NDA', 'W9'],
        actionItems: actionItems.length ? actionItems : ['Review full solicitation documents and prepare bid response.'],
        generatedAt: nowIso(),
      };
    }

    updateDb((db) => {
      const p = db.proposals.find(item => item.id === id);
      if (p) {
        p.metadata = p.metadata || {};
        p.metadata.preSolicitation = preSolicitation;
        p.workflow = p.workflow || {};
        p.workflow.currentStage = 'strategy';
        p.workflow.updatedAt = nowIso();
        if (Array.isArray(p.workflow.stages)) {
          for (const s of p.workflow.stages) {
            if (['ingestion', 'compliance', 'strategy'].includes(s.stageId)) {
              s.status = 'completed';
              s.completedAt = s.completedAt || nowIso();
            }
          }
        }
      }
      return db;
    });

    // Build visible artifact (markdown) so the stage checklist sees it as complete
    const execBrief = proposal.metadata?.executiveSummary || '';
    const readinessData = proposal.metadata?.bidReadiness;
    const readinessMd = readinessData
      ? `\n## Bid Readiness\n**${readinessData.goNoGo}**  - ${readinessData.goNoGoReason}\n`
      : '';

    // Phase 5: Pricing intelligence  - detect services and fetch market rates
    let pricingIntelMd = '';
    let pricingIntelligence = null;
    try {
      const detectedServices = detectServicesFromMatrix(matrix);
      const location = proposal.metadata?.location || proposal.metadata?.zipCode || '';
      const isFederal = (proposal.agency || '').toLowerCase().includes('federal') ||
        matrix.some(r => (r.requirement_text || '').toLowerCase().includes('federal'));

      if (detectedServices.length > 0) {
        const intelRows = [];
        const citations = new Set();
        for (const ds of detectedServices) {
          const marketData = await fetchMarketRates(ds.service, ds.subScope, location, isFederal);
          const lineItem = priceLineItem({ service: ds.subScope ? `${ds.service}.${ds.subScope}` : ds.service, quantity: 1, rateTier: 'typical' });
          const label = ds.subScope ? `${ds.service}.${ds.subScope}` : ds.service;
          if (marketData?.marketRange) {
            intelRows.push({
              service: label,
              marketLow: marketData.marketRange.low,
              marketHigh: marketData.marketRange.high,
              recommendedBid: lineItem.finalPrice || marketData.marketRange.median,
              confidence: marketData.confidence,
              sources: marketData.sources || [],
            });
            (marketData.sources || []).forEach(s => citations.add(s));
          }
        }

        if (intelRows.length > 0) {
          pricingIntelMd = '\n## Pricing Intelligence\n\n' +
            '| Service | Market Low | Market High | Recommended Bid | Confidence |\n' +
            '|---------|-----------|------------|----------------|------------|\n' +
            intelRows.map(r => `| ${r.service.replace(/_/g, ' ')} | $${r.marketLow} | $${r.marketHigh} | $${r.recommendedBid} | ${r.confidence} |`).join('\n') +
            '\n\n### Cost Breakdown Estimate\n' +
            detectedServices.map(ds => {
              const label = ds.subScope ? `${ds.service}.${ds.subScope}` : ds.service;
              const cost = estimateJobCost(ds.service, ds.subScope, 1, 20);
              if (!cost) return '';
              return `- **${label.replace(/_/g, ' ')}**: Labor $${cost.laborCost} (${cost.laborHours}hrs) + Materials $${cost.materialCost} + Fuel $${cost.fuelCost} + Overhead $${cost.perJobOverhead} = **$${cost.totalCost} cost** → $${cost.costFloor} floor (${Math.round(cost.marginTarget * 100)}% margin)`;
            }).filter(Boolean).join('\n') +
            '\n\n### Citations\n' +
            [...citations].map(c => `- ${c}`).join('\n');

          pricingIntelligence = { detectedServices, intelRows, generatedAt: nowIso() };
        }
      }
    } catch (e) {
      console.warn('[pre-solicitation] Pricing intelligence failed:', e.message);
    }

    // Store pricing intelligence on proposal metadata
    if (pricingIntelligence) {
      updateDb((db) => {
        const p = db.proposals.find(item => item.id === id);
        if (p) {
          p.metadata = p.metadata || {};
          p.metadata.pricingIntelligence = pricingIntelligence;
        }
        return db;
      });
    }

    const artifactContent =
      `# Pre-Solicitation Brief  - ${proposal.title || 'Untitled'}\n\n` +
      `_Generated: ${nowIso()} (${source})_\n\n` +
      (execBrief ? `## Overview\n${execBrief}\n${readinessMd}\n` : '') +
      `## Subcontracting Posture\n${preSolicitation.subcontractingPosture}\n\n` +
      `## Teaming Posture\n${preSolicitation.teamingPosture}\n\n` +
      `## Pricing Posture\n${preSolicitation.pricingPosture}\n\n` +
      `## Risk Notes\n${(preSolicitation.riskNotes || []).map(n => `- ${n}`).join('\n') || '_none_'}\n\n` +
      `## Positioning Notes\n${(preSolicitation.positioningNotes || []).map(n => `- ${n}`).join('\n') || '_none_'}\n\n` +
      `## Partner Documents Needed\n${(preSolicitation.partnerDocumentsNeeded || []).map(n => `- ${n}`).join('\n') || '_none_'}\n\n` +
      `## Action Items\n${(preSolicitation.actionItems || []).map((a, i) => `${i + 1}. ${a}`).join('\n') || '_none_'}\n` +
      pricingIntelMd;
    const artifact = pushProposalArtifact(id, {
      type: 'pre_solicitation',
      title: 'Pre-Solicitation Brief',
      content: artifactContent,
    });

    enqueueJobs([{ action: 'run_stage', payload: { proposalId: id, stage: 'outline' } }]);

    res.status(200).json({
      ok: true,
      message: 'Pre-solicitation generated and opened',
      preSolicitation,
      source,
      artifactId: artifact.id,
      artifactUrl: artifactUrlFor(id, artifact.id),
      nextStage: 'outline',
    });
  } catch (err) {
    console.error('Pre-solicitation error:', err);
    res.status(500).json({ ok: false, error: `Could not generate pre-solicitation: ${err.message}` });
  }
});

// ─── Stage 3: Generate Outline ─────────────────────────────────────────────
// Produces: Executive Summary, Technical Approach, Management Plan, Staffing &
// Key Personnel, Past Performance, Quality Control, Pricing Narrative.
// Each section = exactly 1 paragraph, 3–5 sentences. Target 1 page, hard max 2.
const REQUIRED_OUTLINE_SECTIONS = [
  { key: 'executive_summary',   title: 'Executive Summary',         purpose: 'Concise overview of approach, qualifications, and value proposition.' },
  { key: 'technical_approach',  title: 'Technical Approach',        purpose: 'Methodology, tools, and execution plan that satisfy the scope.' },
  { key: 'management_plan',     title: 'Management Plan',           purpose: 'Project governance, communications cadence, and reporting.' },
  { key: 'staffing',            title: 'Staffing and Key Personnel', purpose: 'Team structure, key personnel credentials, and staffing commitments.' },
  { key: 'past_performance',    title: 'Past Performance',          purpose: 'Relevant recent contracts demonstrating comparable scope and outcomes.' },
  { key: 'quality_control',     title: 'Quality Control',           purpose: 'QA/QC framework, inspection checkpoints, and corrective action process.' },
  { key: 'pricing_narrative',   title: 'Pricing Narrative',         purpose: 'Pricing rationale, cost basis, and value case  - not the price itself.' },
];

app.post(apiPath('/proposals/:id/outline'), async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const matrix = proposal.complianceMatrix || [];
    const preSol = proposal.metadata?.preSolicitation || {};
    let sections = null;
    let source = 'deterministic';

    // Try LLM: produce solicitation-grounded paragraphs per required section.
    if (isLlmAvailable()) {
      try {
        const solText = await gatherSolicitationText(proposal);
        const matrixText = JSON.stringify(matrix, null, 2);
        const preSolText = JSON.stringify(preSol, null, 2);
        const sectionsSpec = REQUIRED_OUTLINE_SECTIONS
          .map((s) => `- ${s.key} (${s.title}): ${s.purpose}`)
          .join('\n');
        const execSummary = proposal.metadata?.executiveSummary || '';
        const readiness = proposal.metadata?.bidReadiness ? JSON.stringify(proposal.metadata.bidReadiness) : '';
        const system = `You are a federal proposal writer for Rare Earth Ltd, a minority-owned (MBE/DBE) exterior services contractor. Follow the Federal Proposal Development Guide. Generate a tight 1-page outline. For each required section, write exactly one paragraph of 3-5 concise, proposal-ready sentences grounded in the solicitation and compliance matrix. No filler, no placeholder language. Mirror the solicitation's scoring language where relevant. Address each compliance requirement by REQ-ID where applicable.`;
        const user = `PROPOSAL: ${proposal.title || 'Untitled'}\nAGENCY: ${proposal.agency || 'Unknown'}\n\nEXECUTIVE SUMMARY:\n${execSummary}\n\nBID READINESS:\n${readiness}\n\nREQUIRED SECTIONS (produce all, in this order):\n${sectionsSpec}\n\nCOMPLIANCE MATRIX:\n${matrixText || '(empty)'}\n\nPRE-SOLICITATION POSTURE:\n${preSolText}\n\nSOLICITATION TEXT:\n${solText || '(none attached)'}\n\nReturn JSON: {"sections":[{"sectionKey","title","paragraph","pageBudget"}],"totalPageBudget"}. Honor section order. pageBudget ≈ 0.2 pages per section unless the solicitation requires more.`;
        const json = await llmJson(system, user, null, 6000);
        if (json && Array.isArray(json.sections) && json.sections.length >= 5) {
          sections = REQUIRED_OUTLINE_SECTIONS.map((req) => {
            const found = json.sections.find((s) => s.sectionKey === req.key || s.title === req.title);
            return {
              sectionKey: req.key,
              title: req.title,
              purpose: req.purpose,
              evaluatorQuestion: `How does the offeror address ${req.title}?`,
              paragraph: found?.paragraph || '',
              pageBudget: found?.pageBudget || 0.2,
              notes: found?.paragraph || '',
            };
          });
          source = 'llm';
        }
      } catch (e) {
        console.warn('[outline] LLM failed, falling back:', e.message);
      }
    }

    // Deterministic fallback: solicitation-grounded paragraphs using proposal knowledge base
    if (!sections) {
      const pp = loadPastPerformance();
      const detected = detectServicesFromMatrix(matrix);
      const serviceType = detectServiceType(`${proposal.title || ''} ${extractScopeText(matrix)}`, proposal.title);
      const scopeText = extractScopeText(matrix);
      const highRisk = getHighRiskRequirements(matrix);
      const techLib = TECHNICAL_APPROACHES[serviceType] || TECHNICAL_APPROACHES.default;

      sections = REQUIRED_OUTLINE_SECTIONS.map((req) => {
        let paragraph = '';
        if (req.key === 'executive_summary') {
          paragraph = buildExecutiveSummary(proposal, matrix, preSol, pp, detected);
        } else if (req.key === 'technical_approach') {
          paragraph = techLib.outline(scopeText);
        } else if (req.key === 'management_plan') {
          paragraph = MANAGEMENT_PLAN.outline(preSol.teamingPosture, preSol.riskNotes);
        } else if (req.key === 'staffing') {
          paragraph = STAFFING.outline(scopeText);
        } else if (req.key === 'past_performance') {
          if (pp && pp.contracts?.length) {
            const proposalText = `${proposal.title || ''} ${(matrix.map(r => r.requirement_text).join(' '))}`.toLowerCase();
            const scored = pp.contracts.map(c => {
              const cats = (c.service_category || []).join(' ').toLowerCase();
              const scope = (c.scope || '').toLowerCase();
              const title = (c.title || '').toLowerCase();
              let score = 0;
              let keywordHits = 0;
              for (const word of ['pressure wash', 'cleaning', 'exterior', 'janitorial', 'maintenance', 'grounds', 'facility', 'striping', 'preservation', 'custodial', 'mowing', 'landscap', 'debris', 'waste']) {
                if (proposalText.includes(word) && (cats.includes(word) || scope.includes(word) || title.includes(word))) {
                  score += 3;
                  keywordHits++;
                }
              }
              if (c.role === 'Prime Contractor') score += 2;
              if (c.client_type === 'county_government' || c.client_type === 'federal') score += 1;
              if (c.value >= 100000) score += 1;
              return { contract: c, score, keywordHits };
            }).sort((a, b) => b.score - a.score);

            const top3 = scored.slice(0, 3);
            const hasDirectMatch = top3[0].keywordHits > 0;
            const contractLines = top3.map(s => {
              const c = s.contract;
              return `**${c.title}**  - ${c.client}, $${(c.value || 0).toLocaleString()}, ${c.role}, ${c.period_start || 'ongoing'}–${c.period_end || 'ongoing'}. ${(c.accomplishments || []).join('; ')}.`;
            }).join(' ');

            if (hasDirectMatch) {
              paragraph = `Rare Earth Ltd. brings directly relevant past performance totaling $${(pp.total_contract_value || 0).toLocaleString()}+ across ${pp.contracts.length} contracts. ${contractLines}`;
            } else {
              paragraph = `Rare Earth Ltd. holds ${pp.contracts.length} contracts totaling $${(pp.total_contract_value || 0).toLocaleString()}+. While no contracts are an exact scope match, the following demonstrate transferable capability in project execution, logistics, and facility services: ${contractLines}`;
            }
          } else {
            paragraph = 'We reference three recent contracts of comparable scope, agency type, and dollar value. Each includes customer POC, contract number, period of performance, and outcome.';
          }
        } else if (req.key === 'quality_control') {
          paragraph = QUALITY_CONTROL.outline();
        } else if (req.key === 'pricing_narrative') {
          paragraph = buildPricingNarrative(detected, matrix, preSol, estimateJobCost);
        }
        return {
          sectionKey: req.key,
          title: req.title,
          purpose: req.purpose,
          evaluatorQuestion: `How does the offeror address ${req.title}?`,
          paragraph,
          pageBudget: 0.2,
          notes: paragraph,
        };
      });
    }

    const totalPageBudget = sections.reduce((sum, s) => sum + (s.pageBudget || 0.2), 0);

    updateDb((db) => {
      const p = db.proposals.find(item => item.id === id);
      if (p) {
        p.outline = { sections, generatedAt: nowIso(), totalPageBudget };
        p.workflow = p.workflow || {};
        p.workflow.currentStage = 'outline';
        p.workflow.updatedAt = nowIso();
        if (Array.isArray(p.workflow.stages)) {
          for (const s of p.workflow.stages) {
            if (['ingestion', 'compliance', 'strategy', 'outline'].includes(s.stageId)) {
              s.status = 'completed';
              s.completedAt = s.completedAt || nowIso();
            }
          }
        }
      }
      return db;
    });

    // Visible artifact
    const artifactContent =
      `# Proposal Outline  - ${proposal.title || 'Untitled'}\n\n` +
      `_Generated: ${nowIso()} (${source})_\n\n` +
      sections.map((s) => `## ${s.title}\n${s.paragraph || '_no paragraph generated_'}\n`).join('\n');
    const artifact = pushProposalArtifact(id, {
      type: 'outline',
      title: 'Proposal Outline',
      content: artifactContent,
    });

    enqueueJobs([{ action: 'run_stage', payload: { proposalId: id, stage: 'rough-draft' } }]);

    res.status(200).json({
      ok: true,
      message: 'Outline generated and opened',
      sections,
      source,
      artifactId: artifact.id,
      artifactUrl: artifactUrlFor(id, artifact.id),
      nextStage: 'rough-draft',
    });
  } catch (err) {
    console.error('Outline error:', err);
    res.status(500).json({ ok: false, error: `Could not generate outline: ${err.message}` });
  }
});

// ─── Stage 4: Rough Draft ──────────────────────────────────────────────────
app.post(apiPath('/proposals/:id/rough-draft'), async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const sections = proposal.outline?.sections || [];
    const preSol = proposal.metadata?.preSolicitation || {};
    const matrix = proposal.complianceMatrix || [];
    let draftText = null;
    let source = 'deterministic';

    // Try LLM: expand outline paragraphs into a one-page coherent rough draft.
    if (isLlmAvailable() && sections.length) {
      try {
        const solText = await gatherSolicitationText(proposal);
        const outlineJson = JSON.stringify(sections, null, 2);
        const execSummary = proposal.metadata?.executiveSummary || '';
        const readiness = proposal.metadata?.bidReadiness ? JSON.stringify(proposal.metadata.bidReadiness) : '';
        const system = `You are a federal proposal writer for Rare Earth Ltd, a minority-owned (MBE/DBE) exterior services contractor. Follow the Federal Proposal Development Guide. Expand the outline into a coherent one-page rough draft. Preserve section headings exactly. Mirror the solicitation's structure and scoring language. Be concise and readable. Use the compliance matrix as source truth. Address every high/critical risk requirement explicitly. No placeholder text, no brackets. Return markdown only.`;
        const user = `PROPOSAL: ${proposal.title || 'Untitled'}\nAGENCY: ${proposal.agency || 'Unknown'}\n\nEXECUTIVE SUMMARY:\n${execSummary}\n\nBID READINESS:\n${readiness}\n\nOUTLINE (expand each paragraph into a full rough-draft section with a # header):\n${outlineJson}\n\nCOMPLIANCE MATRIX:\n${JSON.stringify(matrix, null, 2) || '(empty)'}\n\nPRE-SOLICITATION POSTURE:\n${JSON.stringify(preSol, null, 2)}\n\nSOLICITATION TEXT (abridged):\n${(solText || '').slice(0, 60000)}`;
        const text = await llmText(system, user, 6000);
        if (text && text.trim().length > 200) {
          draftText = text;
          source = 'llm';
        }
      } catch (e) {
        console.warn('[rough-draft] LLM failed, falling back:', e.message);
      }
    }

    if (!draftText) {
      // Smart expansion: use proposal-knowledge.js to produce rich section content
      const pp = loadPastPerformance();
      const detected = detectServicesFromMatrix(matrix);
      const serviceType = detectServiceType(`${proposal.title || ''} ${extractScopeText(matrix)}`, proposal.title);
      const scopeText = extractScopeText(matrix);
      const highRisk = getHighRiskRequirements(matrix);
      const techLib = TECHNICAL_APPROACHES[serviceType] || TECHNICAL_APPROACHES.default;

      const draftParts = sections.map((s) => {
        let expanded = '';
        switch (s.sectionKey) {
          case 'executive_summary':
            expanded = s.paragraph || s.notes || '';
            break;
          case 'technical_approach':
            expanded = techLib.draft(scopeText, highRisk);
            break;
          case 'management_plan':
            expanded = MANAGEMENT_PLAN.draft(preSol.teamingPosture, preSol.riskNotes, preSol);
            break;
          case 'staffing':
            expanded = STAFFING.draft(scopeText);
            break;
          case 'past_performance':
            // Past performance stays as outline (already data-rich)
            expanded = s.paragraph || s.notes || '';
            break;
          case 'quality_control':
            expanded = QUALITY_CONTROL.draft(highRisk);
            break;
          case 'pricing_narrative':
            expanded = buildPricingNarrative(detected, matrix, preSol, estimateJobCost);
            break;
          default:
            expanded = s.paragraph || s.notes || `Draft content for ${s.title}.`;
        }
        return `## ${s.title}\n\n${expanded}`;
      });

      // Add compliance traceability appendix
      const traceMatrix = matrix.filter(r => r.requirement_id).slice(0, 15);
      let appendix = '';
      if (traceMatrix.length) {
        appendix = '\n\n---\n\n## Appendix: Compliance Traceability Matrix\n\n' +
          '| REQ-ID | Requirement | Proposal Section | Risk | Status |\n' +
          '|--------|-------------|-----------------|------|--------|\n' +
          traceMatrix.map(r =>
            `| ${r.requirement_id || '-'} | ${(r.requirement_text || '').substring(0, 60)} | ${r.proposal_section || '-'} | ${r.risk_level || '-'} | ${r.status || 'open'} |`
          ).join('\n');
      }

      draftText = `# Proposal Draft - ${proposal.title || 'Untitled'}\n\n` +
        `_Generated: ${nowIso()} (${source})_\n\n` +
        `**Offeror:** Rare Earth Ltd. | **UEI:** Z4WKS4UE8NJ6 | **CAGE:** 9JAV8\n` +
        `**Certifications:** MBE, DBE, SDB | **Point of Contact:** Eric White, (678) 748-3578\n\n---\n\n` +
        (draftParts.length ? draftParts.join('\n\n---\n\n') : 'No outline sections available. Run Generate Outline first.') +
        appendix;
    }

    updateDb((db) => {
      const p = db.proposals.find(item => item.id === id);
      if (p) {
        p.metadata = p.metadata || {};
        p.metadata.roughDraft = { draftText, generatedAt: nowIso(), source };
        p.workflow = p.workflow || {};
        p.workflow.currentStage = 'drafting';
        p.workflow.updatedAt = nowIso();
        p.workflow.stageGate = p.workflow.stageGate || {};
        p.workflow.stageGate.canDraftWholeProposal = true;
        if (Array.isArray(p.workflow.stages)) {
          for (const s of p.workflow.stages) {
            if (['ingestion', 'compliance', 'strategy', 'outline', 'drafting'].includes(s.stageId)) {
              s.status = 'completed';
              s.completedAt = s.completedAt || nowIso();
            }
          }
        }
      }
      return db;
    });

    const artifact = pushProposalArtifact(id, {
      type: 'rough_draft',
      title: 'Rough Draft',
      content: draftText,
    });

    enqueueJobs([{ action: 'run_stage', payload: { proposalId: id, stage: 'ai-review' } }]);

    res.status(200).json({
      ok: true,
      message: 'Rough draft generated and opened',
      source,
      artifactId: artifact.id,
      artifactUrl: artifactUrlFor(id, artifact.id),
      nextStage: 'ai-review',
    });
  } catch (err) {
    console.error('Rough draft error:', err);
    res.status(500).json({ ok: false, error: `Could not generate rough draft: ${err.message}` });
  }
});

// ─── Stage 5: AI Review (Claude Code + Codex Collaboration) ────────────────
// Red-team audit via Claude Code dispatching to Codex for dual-agent review.
// Falls back to deterministic analysis if Claude Code is unavailable.
app.post(apiPath('/proposals/:id/ai-review'), async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const matrix = proposal.complianceMatrix || [];
    const sections = proposal.outline?.sections || [];
    const draftText = proposal.metadata?.roughDraft?.draftText || '';
    let aiReview = null;
    let source = 'deterministic';

    // ── Claude CLI review (Max subscription, no API key needed) ──
    const { execSync: execSyncReview } = await import('node:child_process');
    const fs = await import('node:fs');
    const os = await import('node:os');
    const CLAUDE_BIN = '/home/ericw/.local/bin/claude';
    const DISPATCH = '/home/ericw/.claude/skills/run-codex/scripts/dispatch.sh';
    const hasClaude = fs.existsSync(CLAUDE_BIN);
    const hasDispatch = fs.existsSync(DISPATCH);

    // Helper: run claude CLI with prompt, return stdout
    const runClaude = (promptText, contextFilePath, timeoutMs = 600000) => {
      const escapedPrompt = promptText.replace(/'/g, "'\\''");
      const cmd = contextFilePath
        ? `cat '${contextFilePath}' | ${CLAUDE_BIN} -p --dangerously-skip-permissions '${escapedPrompt}'`
        : `${CLAUDE_BIN} -p --dangerously-skip-permissions '${escapedPrompt}'`;
      return execSyncReview(cmd, {
        encoding: 'utf-8',
        timeout: timeoutMs,
        shell: true,
        maxBuffer: 10 * 1024 * 1024,
      });
    };

    // Build review context file (shared by all tiers)
    let contextFile = null;
    let tmpDir = null;
    if (draftText) {
      const execSummary = proposal.metadata?.executiveSummary || '';
      const solText = await gatherSolicitationText(proposal);
      const pastPerf = loadPastPerformance();
      const pastPerfContext = pastPerf ? `\nPAST PERFORMANCE:\nCompany: ${pastPerf.company} | Certifications: ${(pastPerf.certifications || []).join(', ')}\nContracts: ${(pastPerf.contracts || []).map(c => `${c.title} ($${(c.value || 0).toLocaleString()}, ${c.role})`).join('; ')}` : '';

      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-review-'));
      contextFile = path.join(tmpDir, 'review-context.md');
      fs.writeFileSync(contextFile, [
        `# Red-Team Review: ${proposal.title || 'Untitled'}`,
        `Agency: ${proposal.agency || 'Unknown'}`,
        `\n## Executive Summary\n${execSummary}`,
        `\n## Compliance Matrix\n${JSON.stringify(matrix, null, 2) || '(empty)'}`,
        `\n## Outline\n${JSON.stringify(sections, null, 2)}`,
        `\n## Rough Draft\n${draftText}`,
        pastPerfContext,
        `\n## Solicitation Text (abridged)\n${(solText || '').slice(0, 30000)}`,
      ].join('\n'));
    }

    const reviewPrompt = [
      'You are a federal proposal red-team reviewer for Rare Earth Ltd (MBE/DBE/SDB/BAO exterior services contractor).',
      'Read the context piped to stdin and perform a thorough red-team audit.',
      'Score the draft 0-100 on compliance coverage, responsiveness, and win probability.',
      'Identify missing requirements by REQ-ID, flag weak sections, suggest presentation improvements.',
      'Verify past performance references are specific and relevant.',
      'Produce an improved final-draft candidate in markdown. Do not use em dashes.',
      'Output ONLY valid JSON (no markdown fences) with this shape:',
      '{"complianceScore":number,"missingRequirements":["string"],"weakSections":["string"],"reviewSummary":"string","presentationSuggestions":["string"],"improvedDraft":"markdown string"}',
    ].join(' ');

    // Tier 1: Codex + Claude collaboration via dispatch.sh (Max subscription)
    if (hasDispatch && contextFile) {
      try {
        const dispatchPrompt = [
          reviewPrompt,
          `The review context is at ${contextFile}. Read it first.`,
        ].join(' ');
        const result = execSyncReview(
          `"${DISPATCH}" --sandbox read-only --dir /mnt/c/Users/ericw/proposal-flow/proposal-flow "${dispatchPrompt.replace(/"/g, '\\"')}"`,
          { encoding: 'utf-8', timeout: 600000, shell: true, maxBuffer: 10 * 1024 * 1024 }
        );
        const jsonMatch = result.match(/\{[\s\S]*"complianceScore"[\s\S]*\}/);
        if (jsonMatch) {
          const json = JSON.parse(jsonMatch[0]);
          if (typeof json.complianceScore === 'number') {
            aiReview = { ...json, generatedAt: nowIso() };
            source = 'claude_codex';
          }
        }
      } catch (e) {
        console.warn('[ai-review] Codex dispatch failed, trying Claude CLI fallback:', e.message);
      }
    }

    // Tier 2: Claude CLI directly (Max subscription, no API key needed)
    if (!aiReview && hasClaude && contextFile) {
      try {
        const result = runClaude(reviewPrompt, contextFile, 600000);
        const jsonMatch = result.match(/\{[\s\S]*"complianceScore"[\s\S]*\}/);
        if (jsonMatch) {
          const json = JSON.parse(jsonMatch[0]);
          if (typeof json.complianceScore === 'number') {
            aiReview = { ...json, generatedAt: nowIso() };
            source = 'claude_cli';
          }
        }
      } catch (e) {
        console.warn('[ai-review] Claude CLI failed, falling back to deterministic:', e.message);
      }
    }

    // Cleanup temp files
    if (tmpDir) {
      try { fs.unlinkSync(contextFile); fs.rmdirSync(tmpDir); } catch {}
    }

    // ── Deterministic fallback ──
    if (!aiReview) {
      const coveredSections = new Set(sections.map(s => s.sectionKey));
      // Fuzzy mapping: compliance matrix proposal_section → likely outline sectionKey
      const SECTION_MAP = {
        'cover_page': 'executive_summary',
        'mandatory_forms': 'pricing_narrative',
        'labor': 'staffing',
        'insurance_bonding': 'management_plan',
        'technical': 'technical_approach',
        'far_clauses': 'management_plan',
        'past_performance': 'past_performance',
        'pricing': 'pricing_narrative',
        'quality': 'quality_control',
        'staffing': 'staffing',
        'management': 'management_plan',
        'executive_summary': 'executive_summary',
      };
      const missingRequirements = [];
      const weakSections = [];
      for (const req of matrix) {
        const key = (req.proposal_section || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const mapped = SECTION_MAP[key] || key;
        if (!coveredSections.has(key) && !coveredSections.has(mapped)) {
          missingRequirements.push(`${req.requirement_id}: ${req.requirement_text} (no matching outline section)`);
        }
      }
      const criticalReqs = matrix.filter(r => r.risk_level === 'critical' || r.risk_level === 'high');
      const complianceScore = matrix.length > 0
        ? Math.round(((matrix.length - missingRequirements.length) / matrix.length) * 100)
        : 0;

      const ppData = loadPastPerformance();
      if (ppData && ppData.contracts?.length) {
        const matrixLower = matrix.map(r => r.requirement_text).join(' ').toLowerCase();
        const hasRelevant = ppData.contracts.some(c =>
          (c.service_category || []).some(cat => matrixLower.includes(cat.replace(/_/g, ' ')))
        );
        if (!hasRelevant) {
          weakSections.push('Past Performance: no contracts in portfolio directly match the solicitation scope  - consider highlighting transferable experience.');
        }
      } else {
        weakSections.push('Past Performance: no past performance data loaded  - add contracts to past_performance.json.');
      }

      aiReview = {
        complianceScore,
        missingRequirements,
        weakSections,
        reviewSummary: `Draft covers ${sections.length} sections against ${matrix.length} compliance requirements. ` +
          `${criticalReqs.length} high/critical risk items identified. ` +
          `${missingRequirements.length} requirements lack outline coverage. ` +
          (complianceScore >= 80 ? 'Draft is in good shape for final review.' : 'Gaps remain  - address missing requirements before finalizing.'),
        presentationSuggestions: [
          'Ensure each section explicitly references the requirement ID it addresses.',
          criticalReqs.length > 0 ? `Prioritize ${criticalReqs.length} high/critical items in the executive summary.` : null,
          'Add a compliance traceability matrix as an appendix.',
        ].filter(Boolean),
        stockPhotoSuggestions: [
          'Team-at-work photo on the Staffing page',
          'Equipment/tools shot on the Technical Approach page',
          'Past-performance project photo on cover or executive summary',
        ],
        improvedDraft: '',
        generatedAt: nowIso(),
      };
    }

    updateDb((db) => {
      const p = db.proposals.find(item => item.id === id);
      if (p) {
        p.metadata = p.metadata || {};
        p.metadata.aiReview = aiReview;
        p.workflow = p.workflow || {};
        p.workflow.currentStage = 'red_team';
        p.workflow.updatedAt = nowIso();
        if (Array.isArray(p.workflow.stages)) {
          for (const s of p.workflow.stages) {
            if (['ingestion', 'compliance', 'strategy', 'outline', 'drafting', 'red_team'].includes(s.stageId)) {
              s.status = 'completed';
              s.completedAt = s.completedAt || nowIso();
            }
          }
        }
      }
      return db;
    });

    // Visible artifact (review + improved draft if present)
    const artifactContent =
      `# AI Review  - ${proposal.title || 'Untitled'}\n\n` +
      `_Generated: ${nowIso()} (${source})_\n\n` +
      `**Compliance Score:** ${aiReview.complianceScore}%\n\n` +
      `## Review Summary\n${aiReview.reviewSummary}\n\n` +
      `## Missing Requirements\n${(aiReview.missingRequirements || []).map(m => `- ${m}`).join('\n') || '_none_'}\n\n` +
      `## Weak Sections\n${(aiReview.weakSections || []).map(m => `- ${m}`).join('\n') || '_none_'}\n\n` +
      `## Presentation Suggestions\n${(aiReview.presentationSuggestions || []).map(m => `- ${m}`).join('\n') || '_none_'}\n\n` +
      `## Stock Photo Suggestions\n${(aiReview.stockPhotoSuggestions || []).map(m => `- ${m}`).join('\n') || '_none_'}\n\n` +
      (aiReview.improvedDraft ? `---\n\n# Improved Draft\n\n${aiReview.improvedDraft}` : '');
    const artifact = pushProposalArtifact(id, {
      type: 'ai_review',
      title: 'AI Review',
      content: artifactContent,
    });

    enqueueJobs([{ action: 'run_stage', payload: { proposalId: id, stage: 'final-draft' } }]);

    res.status(200).json({
      ok: true,
      message: `AI review completed (${source})`,
      aiReview,
      source,
      artifactId: artifact.id,
      artifactUrl: artifactUrlFor(id, artifact.id),
      nextStage: 'final-draft',
    });
  } catch (err) {
    console.error('AI review error:', err);
    res.status(500).json({ ok: false, error: `Could not complete AI review: ${err.message}` });
  }
});

// ─── Stage 6: Final Draft ──────────────────────────────────────────────────
app.post(apiPath('/proposals/:id/final-draft'), async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const roughDraftText = proposal.metadata?.roughDraft?.draftText || '';
    const aiReview = proposal.metadata?.aiReview || {};
    // Prefer the AI-reviewed improved draft when available.
    const improved = aiReview.improvedDraft || aiReview.improved_draft || '';
    const sourceDraft = improved || roughDraftText;
    const draftSource = improved ? 'ai_review' : (roughDraftText ? 'rough_draft' : 'none');

    // Build final draft artifact with executive context
    const execSummary = proposal.metadata?.executiveSummary || '';
    const readinessData = proposal.metadata?.bidReadiness;
    const execBlock = execSummary ? `## Executive Summary\n${execSummary}\n\n` : '';
    const readinessBlock = readinessData
      ? `**Bid Readiness: ${readinessData.goNoGo}**  - ${readinessData.goNoGoReason}\n\n` : '';

    const finalText = `# FINAL DRAFT  - ${proposal.title || 'Untitled'}\n\n` +
      `Finalized: ${nowIso()}\n` +
      `Source: ${draftSource}\n` +
      `Compliance Score: ${aiReview.complianceScore ?? aiReview.score ?? 'N/A'}%\n\n` +
      execBlock + readinessBlock +
      `---\n\n` +
      (sourceDraft || '[No upstream draft content  - run Rough Draft and AI Review first]');

    const artifact = pushProposalArtifact(id, {
      type: 'final_draft',
      title: 'Final Draft',
      content: finalText,
      format: 'markdown',
    });

    updateDb((db) => {
      const p = db.proposals.find(item => item.id === id);
      if (p) {
        p.metadata = p.metadata || {};
        p.metadata.finalDraftText = finalText;
        const review = ensureSubmissionReview(p);
        review.requestedAt = review.requestedAt || nowIso();
        appendSubmissionHistory(review, {
          type: 'final_draft_generated',
          label: 'Final draft generated and waiting for Eric review',
        });
        p.workflow = p.workflow || {};
        p.workflow.currentStage = 'final_review';
        p.workflow.updatedAt = nowIso();
        if (Array.isArray(p.workflow.stages)) {
          for (const s of p.workflow.stages) {
            s.status = 'completed';
            s.completedAt = s.completedAt || nowIso();
          }
        }
      }
      return db;
    });

    const artifactUrl = artifactUrlFor(id, artifact.id);

    // Generate downloadable .docx with Rare Earth branding
    let docxUrl = null;
    try {
      const fullProposal = getDb().proposals.find(p => p.id === id);
      const { fileName } = await createFinalDraftDocx(fullProposal, sourceDraft);
      docxUrl = apiPath(`/exports/${fileName}`);
      // Store the docx URL in the artifact
      updateDb((db) => {
        const p = db.proposals.find(item => item.id === id);
        if (p) {
          const art = (p.metadata?.generatedArtifacts || []).find(a => a.id === artifact.id);
          if (art) art.docxUrl = docxUrl;
          calculateSubmissionReadiness(p);
        }
        return db;
      });
    } catch (docxErr) {
      console.error('Word doc creation failed:', docxErr.message);
    }

    // Generate branded PDF via WeasyPrint (Kami pipeline)
    let pdfUrl = null;
    try {
      const fullForPdf = getDb().proposals.find(p => p.id === id);
      const { fileName: pdfName } = await createProposalPdfLazy(fullForPdf, sourceDraft);
      pdfUrl = apiPath(`/exports/${pdfName}`);
      updateDb((db) => {
        const p = db.proposals.find(item => item.id === id);
        if (p) {
          const art = (p.metadata?.generatedArtifacts || []).find(a => a.id === artifact.id);
          if (art) art.pdfUrl = pdfUrl;
          calculateSubmissionReadiness(p);
        }
        return db;
      });
    } catch (pdfErr) {
      console.error('PDF creation failed:', pdfErr.message);
    }

    res.status(200).json({
      ok: true,
      message: [docxUrl && 'DOCX', pdfUrl && 'PDF'].filter(Boolean).join(' + ') + ' ready.' || 'Final draft generated.',
      artifactId: artifact.id,
      artifactUrl,
      docxUrl,
      pdfUrl,
      draftSource,
    });
  } catch (err) {
    console.error('Final draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Pricing engine ──
// GET returns service catalog + adjusters + market benchmarks.
app.get(apiPath('/pricing/catalog'), (_req, res) => {
  res.json({
    services: PRICING_SERVICES,
    adjusters: PRICING_ADJUSTERS,
    benchmarks: MARKET_BENCHMARKS,
  });
});

// POST prices a scope for a proposal and stores the quote as an artifact.
// Body: { lineItems: [{ service, quantity, rateTier, miles, condition, leadDays }] }
app.post(apiPath('/proposals/:id/pricing'), (req, res) => {
  const { id } = req.params;
  const proposal = getDb().proposals.find((p) => p.id === id);
  if (!proposal) return res.status(404).json({ ok: false, error: 'Proposal not found' });

  const lineItems = Array.isArray(req.body?.lineItems) ? req.body.lineItems : [];
  if (lineItems.length === 0) {
    return res.status(400).json({ ok: false, error: 'lineItems is required and must contain at least one entry' });
  }

  const quote = priceScope(lineItems);
  const narrative = formatPricingNarrative(quote);

  const md = `# Pricing Quote  - ${proposal.title || 'Untitled'}\n\n` +
    `Generated: ${quote.generatedAt}\n\n` +
    `## Line Items\n${narrative}\n\n` +
    `## Market Benchmarks\n` +
    quote.lines.map((l) => {
      if (!l.benchmarks) return '';
      const rows = Object.entries(l.benchmarks)
        .filter(([k]) => k !== 'note')
        .map(([source, r]) => `| ${source} | $${r.low} | $${r.median} | $${r.high} | ${r.unit} |`)
        .join('\n');
      return `### ${l.service}\n\n| Source | Low | Median | High | Unit |\n|---|---|---|---|---|\n${rows}\n\n_${l.benchmarks.note || ''}_`;
    }).filter(Boolean).join('\n\n');

  // Persist on the proposal and push an artifact so StageChecklist + artifact UI see it.
  updateDb((db) => {
    const p = db.proposals.find((item) => item.id === id);
    if (p) {
      p.metadata = p.metadata || {};
      p.metadata.pricing = { ...quote, narrative };
      p.workflow = p.workflow || {};
      p.workflow.updatedAt = nowIso();
    }
    return db;
  });

  const artifact = pushProposalArtifact(id, {
    type: 'pricing_quote',
    title: 'Pricing Quote',
    content: md,
    format: 'markdown',
  });

  // Auto-insert each priced line into bid_history (SQLite)
  for (const line of quote.lines) {
    if (line.error) continue;
    try {
      insertBid({
        proposal_id: id,
        client_name: proposal.client || proposal.title || 'Unknown',
        service: line.service,
        sub_scope: line.subScope || null,
        property_type: null,
        sqft: null,
        unit_count: null,
        quantity: line.quantity || null,
        unit: line.unit || null,
        unit_cost: line.baseRate || null,
        bid_amount: line.finalPrice || 0,
        cost_amount: line.costEstimate?.totalCost || null,
        profit: line.costEstimate ? (line.finalPrice - line.costEstimate.totalCost) : null,
        margin_pct: line.costEstimate && line.finalPrice > 0
          ? (line.finalPrice - line.costEstimate.totalCost) / line.finalPrice : null,
        overhead_pct: null,
        profit_pct: null,
        zip: proposal.metadata?.location?.zip || null,
        city: proposal.metadata?.location?.city || null,
        state: proposal.metadata?.location?.state || null,
        distance_miles: null,
        outcome: 'pending',
        client_type: proposal.metadata?.clientType || null,
        notes: `Auto-recorded from proposal pricing`,
        bid_date: new Date().toISOString().slice(0, 10),
      });
    } catch (e) {
      console.warn(`[pricing] Failed to insert bid for ${line.service}:`, e.message);
    }
  }

  // Win/loss advisory per service
  const winLossInsights = {};
  for (const line of quote.lines) {
    if (line.service && !winLossInsights[line.service]) {
      const insight = getWinLossInsight(line.service);
      if (insight) winLossInsights[line.service] = insight;
    }
  }

  res.status(200).json({
    ok: true,
    message: `Priced ${quote.lines.length} line item(s). Subtotal $${quote.subtotal.toLocaleString()}.`,
    quote,
    narrative,
    winLossInsights: Object.keys(winLossInsights).length > 0 ? winLossInsights : undefined,
    artifactId: artifact.id,
    artifactUrl: artifactUrlFor(id, artifact.id),
  });
});

// ── Pricing Governance (Compliance Matrix section) ──
// GET returns the current pricing governance for a proposal.
app.get(apiPath('/proposals/:id/pricing-governance'), (req, res) => {
  const proposal = getDb().proposals.find((p) => p.id === req.params.id);
  if (!proposal) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.json({ ok: true, pricingGovernance: proposal.pricingGovernance || {} });
});

// PUT replaces / merges the pricing governance object for a proposal.
app.put(apiPath('/proposals/:id/pricing-governance'), (req, res) => {
  const { id } = req.params;
  const incoming = req.body || {};
  let updated = null;
  updateDb((db) => {
    const p = db.proposals.find((item) => item.id === id);
    if (!p) return db;
    p.pricingGovernance = { ...(p.pricingGovernance || {}), ...incoming };
    p.updatedAt = nowIso();
    if (p.workflow) p.workflow.updatedAt = p.updatedAt;
    updated = p.pricingGovernance;
    return db;
  });
  if (!updated) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.json({ ok: true, pricingGovernance: updated });
});

// ── Win/Loss Outcome Tracking ──
// POST records a bid outcome (win/loss/no-bid/pending) for a proposal.
app.post(apiPath('/proposals/:id/outcome'), (req, res) => {
  const { id } = req.params;
  const proposal = getDb().proposals.find(p => p.id === id);
  if (!proposal) return res.status(404).json({ ok: false, error: 'Proposal not found' });

  const { outcome, awardAmount, competitorCount, notes } = req.body || {};
  if (!['win', 'loss', 'no-bid', 'pending'].includes(outcome)) {
    return res.status(400).json({ ok: false, error: 'outcome must be one of: win, loss, no-bid, pending' });
  }

  const pricing = proposal.metadata?.pricing;
  const entry = {
    proposalId: id,
    title: proposal.title || 'Untitled',
    service: pricing?.lines?.[0]?.service || 'unknown',
    bidAmount: pricing?.subtotal || 0,
    outcome,
    awardAmount: outcome === 'win' ? (Number(awardAmount) || pricing?.subtotal || 0) : null,
    competitorCount: competitorCount != null ? Number(competitorCount) : null,
    recordedAt: nowIso(),
    notes: notes || '',
  };

  // Append to win-loss-log.json
  const logPath = path.join(__dirname, 'server', 'data', 'win-loss-log.json');
  let log = { revenueTarget: { monthly: 22000, currency: 'USD' }, entries: [] };
  try { log = JSON.parse(readFileSync(logPath, 'utf8')); } catch { /* use default */ }
  log.entries.push(entry);
  try { writeFileSync(logPath, JSON.stringify(log, null, 2)); } catch (e) {
    console.error('[win-loss] Failed to write log:', e.message);
  }

  // Also store on proposal metadata
  updateDb((db) => {
    const p = db.proposals.find(item => item.id === id);
    if (p) {
      p.metadata = p.metadata || {};
      p.metadata.outcome = { outcome, awardAmount: entry.awardAmount, competitorCount: entry.competitorCount, recordedAt: entry.recordedAt };
    }
    return db;
  });

  // Update bid_history SQLite rows for this proposal
  try {
    const mapped = outcome === 'no-bid' ? 'pass' : outcome;
    updateBidOutcomeByProposal(id, mapped);
  } catch (e) {
    console.warn(`[outcome] Failed to update bid_history for ${id}:`, e.message);
  }

  // On win → auto-populate revenue_tracking for the current month
  if (outcome === 'win') {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const bidsForProposal = getBidsByProposal(id);
      const totalAward = entry.awardAmount || bidsForProposal.reduce((s, b) => s + (b.bid_amount || 0), 0);
      // Fetch existing revenue for the month and increment
      const existing = getRevenue(12).find(r => r.month === month);
      upsertRevenue(month, {
        invoiced: (existing?.invoiced || 0) + totalAward,
        collected: existing?.collected || 0,
        job_count: (existing?.job_count || 0) + 1,
      });
    } catch (e) {
      console.warn(`[outcome] Failed to update revenue for win:`, e.message);
    }
  }

  res.status(200).json({ ok: true, message: `Outcome '${outcome}' recorded for ${proposal.title}`, entry });
});

// GET revenue summary with win rate and target tracking
app.get(apiPath('/revenue/summary'), (_req, res) => {
  const logPath = path.join(__dirname, 'server', 'data', 'win-loss-log.json');
  let log = { revenueTarget: { monthly: 22000, currency: 'USD' }, entries: [] };
  try { log = JSON.parse(readFileSync(logPath, 'utf8')); } catch { /* use default */ }

  const entries = log.entries || [];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Monthly revenue (wins this month)
  const monthlyWins = entries.filter(e =>
    e.outcome === 'win' && e.recordedAt && e.recordedAt.startsWith(currentMonth)
  );
  const monthlyRevenue = monthlyWins.reduce((sum, e) => sum + (e.awardAmount || e.bidAmount || 0), 0);

  // Overall stats
  const decided = entries.filter(e => e.outcome === 'win' || e.outcome === 'loss');
  const wins = entries.filter(e => e.outcome === 'win');
  const winRate = decided.length > 0 ? wins.length / decided.length : 0;

  const target = log.revenueTarget?.monthly || 22000;

  res.json({
    ok: true,
    currentMonth,
    monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
    target,
    percentOfTarget: Number(((monthlyRevenue / target) * 100).toFixed(1)),
    totalBids: entries.length,
    wins: wins.length,
    losses: entries.filter(e => e.outcome === 'loss').length,
    pending: entries.filter(e => e.outcome === 'pending').length,
    noBid: entries.filter(e => e.outcome === 'no-bid').length,
    winRate: Number(winRate.toFixed(2)),
    recentEntries: entries.slice(-10).reverse(),
  });
});

// ── Pricing Database (SQLite) ──

// GET bid history with optional filters: ?service=&outcome=&client_type=&limit=
app.get(apiPath('/pricing/bids'), (req, res) => {
  const { service, outcome, client_type, limit } = req.query;
  const bids = getBidHistory({
    service: service || undefined,
    outcome: outcome || undefined,
    client_type: client_type || undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ ok: true, count: bids.length, bids });
});

// POST new bid record
app.post(apiPath('/pricing/bids'), (req, res) => {
  const bid = req.body;
  if (!bid.client_name || !bid.service || !bid.bid_amount) {
    return res.status(400).json({ ok: false, error: 'client_name, service, and bid_amount are required' });
  }
  const result = insertBid(bid);
  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

// PATCH bid outcome
app.patch(apiPath('/pricing/bids/:id/outcome'), (req, res) => {
  const { outcome } = req.body;
  if (!['win', 'loss', 'no-bid', 'pending'].includes(outcome)) {
    return res.status(400).json({ ok: false, error: 'outcome must be one of: win, loss, no-bid, pending' });
  }
  updateBidOutcome(Number(req.params.id), outcome);
  res.json({ ok: true, message: `Bid ${req.params.id} updated to ${outcome}` });
});

// GET win/loss stats for a service
app.get(apiPath('/pricing/stats/:service'), (req, res) => {
  const stats = getWinLossStats(req.params.service);
  if (!stats) return res.json({ ok: true, stats: null, message: 'No bid history for this service yet' });
  res.json({ ok: true, stats });
});

// POST standalone estimate — returns price + COGS breakdown + margin
app.post(apiPath('/pricing/estimate'), (req, res) => {
  const { service, subScope, quantity, miles, condition, rush } = req.body || {};
  if (!service) return res.status(400).json({ ok: false, error: 'service is required' });

  const svcKey = subScope ? `${service}.${subScope}` : service;
  const lineItem = priceLineItem({
    service: svcKey,
    quantity: Number(quantity) || 1,
    miles: Number(miles) || 0,
    condition: condition || 'light',
    leadDays: rush === 'same_day' ? 0 : rush === '48hr' ? 2 : 7,
    rateTier: 'typical',
  });

  if (lineItem.error) return res.status(400).json({ ok: false, error: lineItem.error });

  const cost = lineItem.costEstimate;
  const price = lineItem.finalPrice;
  const margin = cost ? price - cost.totalCost : null;
  const marginPct = cost && price > 0 ? margin / price : null;

  res.json({
    ok: true,
    price,
    cost: cost?.totalCost || null,
    margin: margin != null ? Number(margin.toFixed(2)) : null,
    marginPct: marginPct != null ? Number(marginPct.toFixed(4)) : null,
    breakdown: cost ? {
      labor: cost.laborCost,
      laborHours: cost.laborHours,
      materials: cost.materialCost,
      fuel: cost.fuelCost,
      overhead: cost.perJobOverhead,
    } : null,
    adjusters: lineItem.adjusters,
    marketRange: lineItem.subScopeMarketRange || null,
    benchmarks: lineItem.benchmarks || null,
    details: {
      service: lineItem.service,
      subScope: lineItem.subScope,
      unit: lineItem.unit,
      quantity: lineItem.quantity,
      baseRate: lineItem.baseRate,
      baseSubtotal: lineItem.baseSubtotal,
      computedPrice: lineItem.computedPrice,
      finalPrice: lineItem.finalPrice,
      flooredApplied: lineItem.flooredApplied,
      costFloor: lineItem.costFloor,
    },
  });
});

// GET rate cards, optional ?service= filter
app.get(apiPath('/pricing/rate-cards'), (req, res) => {
  const cards = getRateCards(req.query.service || undefined);
  res.json({ ok: true, count: cards.length, rateCards: cards });
});

// PUT upsert a rate card
app.put(apiPath('/pricing/rate-cards'), (req, res) => {
  const card = req.body;
  if (!card.service || !card.base_rate || !card.unit) {
    return res.status(400).json({ ok: false, error: 'service, base_rate, and unit are required' });
  }
  upsertRateCard(card);
  res.json({ ok: true, message: 'Rate card saved' });
});

// GET market rates for a service
app.get(apiPath('/pricing/market-rates/:service'), (req, res) => {
  const rates = getMarketRates(req.params.service);
  res.json({ ok: true, count: rates.length, rates });
});

// GET revenue tracking
app.get(apiPath('/pricing/revenue'), (req, res) => {
  const months = req.query.months ? Number(req.query.months) : undefined;
  const data = getRevenue(months);
  res.json({ ok: true, data });
});

// PUT upsert revenue for a month (e.g. PUT /pricing/revenue { month: "2026-05", invoiced: 8500, collected: 6200, job_count: 12 })
app.put(apiPath('/pricing/revenue'), (req, res) => {
  const { month, ...data } = req.body;
  if (!month) return res.status(400).json({ ok: false, error: 'month is required (YYYY-MM)' });
  upsertRevenue(month, data);
  res.json({ ok: true, message: `Revenue for ${month} updated` });
});

// GET full pricing dashboard  - combines bid stats, rate cards, revenue, and market data
app.get(apiPath('/pricing/dashboard'), (_req, res) => {
  const recentBids = getBidHistory({ limit: 20 });
  const rateCards = getRateCards();
  const revenue = getRevenue(6);

  const serviceStats = {};
  for (const svc of ['pressure_washing', 'property_preservation', 'aggregates', 'restriping']) {
    const stats = getWinLossStats(svc);
    if (stats) serviceStats[svc] = stats;
  }

  // Calculate totals
  const allBids = getBidHistory({});
  const totalBidValue = allBids.reduce((s, b) => s + (b.bid_amount || 0), 0);
  const wins = allBids.filter(b => b.outcome === 'win');
  const totalWonValue = wins.reduce((s, b) => s + (b.bid_amount || 0), 0);

  res.json({
    ok: true,
    summary: {
      totalBids: allBids.length,
      totalBidValue: Number(totalBidValue.toFixed(2)),
      totalWins: wins.length,
      totalWonValue: Number(totalWonValue.toFixed(2)),
      overallWinRate: allBids.filter(b => b.outcome !== 'pending').length > 0
        ? Number((wins.length / allBids.filter(b => b.outcome !== 'pending').length).toFixed(2))
        : null,
    },
    serviceStats,
    recentBids,
    rateCards,
    revenue,
  });
});

// ── Serve artifact content (HTML render of markdown) ──
app.get(apiPath('/proposals/:id/artifacts/:artifactId'), (req, res) => {
  const proposal = getDb().proposals.find(p => p.id === req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const artifacts = proposal.metadata?.generatedArtifacts || [];
  const artifact = artifacts.find(a => a.id === req.params.artifactId);
  if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

  // If there's a Google Doc URL, redirect to it
  if (artifact.gdocUrl) {
    return res.redirect(artifact.gdocUrl);
  }

  const content = artifact.content || artifact.html || '';
  // Render markdown content as a styled HTML page
  const escapedContent = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n/g, '<br>');

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${(artifact.title || proposal.title || 'Artifact').replace(/</g, '&lt;')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; }
    h2 { color: #1e3a5f; margin-top: 24px; }
    h3 { color: #374151; }
    hr { border: none; border-top: 1px solid #d1d5db; margin: 24px 0; }
    .meta { color: #6b7280; font-size: 0.9em; margin-bottom: 20px; }
    @media print { body { margin: 20px; } }
  </style>
</head><body>
  <div class="meta">
    <strong>Proposal:</strong> ${(proposal.title || '').replace(/</g, '&lt;')} &mdash;
    <strong>Generated:</strong> ${artifact.generatedAt || 'Unknown'} &mdash;
    <strong>Type:</strong> ${artifact.type || 'Unknown'}
  </div>
  ${escapedContent}
</body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.post(apiPath('/proposals/:id/log'), (req, res) => {
  const proposalId = req.params.id;
  const jobs = enqueueJobs([{ action: 'log_pipeline_opportunity', payload: { proposalId } }]);
  setImmediate(() => {
    safeRunWorkerPass();
  });
  res.status(202).json({ ok: true, jobs });
});

app.post(apiPath('/proposals/:id/upload'), (req, res) => {
  const proposalId = req.params.id;
  const action = req.body?.action || 'upload_docs';
  const fileName = req.body?.fileName || 'Uploaded Document';

  updateDb((db) => {
    const proposal = db.proposals.find((item) => item.id === proposalId);
    if (!proposal) {
      return db;
    }

    proposal.files = Array.isArray(proposal.files) ? proposal.files : [];
    proposal.files.push({
      id: createId('file'),
      name: fileName,
      createdAt: nowIso(),
      type: action,
    });
    proposal.updatedAt = nowIso();
    return db;
  });

  res.status(202).json({ ok: true, message: 'Upload metadata recorded' });
});

app.post(apiPath('/proposals/:id/attachments/import'), async (req, res) => {
  try {
    const result = await importLocalProposalAttachments({
      proposalId: req.params.id,
      sourcePaths: req.body?.sourcePaths,
      workspaceRoot: req.body?.workspaceRoot,
    });
    res.status(result.imported.length > 0 ? 201 : 200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      invalid: error.details || undefined,
    });
  }
});

app.get(apiPath('/proposals/:proposalId/files/:fileId'), (req, res) => {
  const { proposalId, fileId } = req.params;
  const db = getDb();
  const proposal = db.proposals.find((item) => item.id === proposalId);
  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  const fileRecord = (proposal.files || []).find((file) => file.id === fileId);
  if (!fileRecord?.storedRelativePath) {
    res.status(404).json({ error: 'Stored attachment not found' });
    return;
  }

  const absolutePath = getAttachmentAbsolutePath(proposalId, fileRecord.storedRelativePath);
  res.setHeader('Content-Type', getAttachmentContentType(fileRecord));
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileRecord.filename || fileRecord.name || 'attachment')}"`);
  res.sendFile(absolutePath, (error) => {
    if (error) {
      if (!res.headersSent) {
        res.status(error.statusCode || 500).json({ error: 'Failed to read attachment' });
      }
    }
  });
});

app.get(apiPath('/calendar-events'), (req, res) => {
  const db = getDb();
  res.json(db.calendarEvents);
});

app.post(apiPath('/calendar-events'), (req, res) => {
  const payload = req.body || {};
  const event = {
    id: payload.id || createId('event'),
    title: payload.title || 'Untitled Event',
    date: payload.date || nowIso(),
    type: payload.type || 'custom',
    proposalId: payload.proposalId || '',
    notification: payload.notification || null,
    status: payload.status || {
      current: 'pending',
      progress: 0,
      lastUpdated: nowIso(),
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  updateDb((db) => {
    db.calendarEvents.unshift(event);
    return db;
  });

  res.status(201).json(event);
});

app.put(apiPath('/calendar-events/:id'), (req, res) => {
  const eventId = req.params.id;
  let updated = null;

  updateDb((db) => {
    const event = db.calendarEvents.find((item) => item.id === eventId);
    if (!event) {
      return db;
    }
    Object.assign(event, req.body || {}, { updatedAt: nowIso() });
    updated = event;
    return db;
  });

  if (!updated) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.json(updated);
});

app.delete(apiPath('/calendar-events/:id'), (req, res) => {
  const eventId = req.params.id;

  updateDb((db) => {
    db.calendarEvents = db.calendarEvents.filter((item) => item.id !== eventId);
    return db;
  });

  res.status(204).end();
});

app.get(apiPath('/directories'), (req, res) => {
  const db = getDb();
  res.json(db.directories);
});

app.get(apiPath('/watchers'), (req, res) => {
  const db = getDb();
  res.json(db.watchers);
});

app.get(apiPath('/business-profile'), (req, res) => {
  const db = getDb();
  res.json(db.businessProfile);
});

// ── Capture Records ────────────────────────────────────────────────────────────
app.get(apiPath('/capture-records'), (req, res) => {
  const db = getDb();
  res.json(db.captureRecords || []);
});

app.post(apiPath('/capture-records'), (req, res) => {
  const payload = req.body || {};
  const timestamp = nowIso();
  const record = {
    id: payload.id || createId('capture'),
    stage: 'detected',
    naicsCodes: [],
    pscCodes: [],
    winThemes: [],
    ghostingTargets: [],
    teamingGaps: [],
    stakeholders: [],
    complianceItems: [],
    portalReadiness: { samActive: false, portalIdentified: false, credentialsConfirmed: false },
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  updateDb((db) => {
    if (!Array.isArray(db.captureRecords)) db.captureRecords = [];
    db.captureRecords.unshift(record);
    return db;
  });
  res.status(201).json(record);
});

app.patch(apiPath('/capture-records/:id'), (req, res) => {
  const id = req.params.id;
  let updated = null;
  updateDb((db) => {
    if (!Array.isArray(db.captureRecords)) db.captureRecords = [];
    const rec = db.captureRecords.find((r) => r.id === id);
    if (!rec) return db;
    Object.assign(rec, req.body || {}, { updatedAt: nowIso() });
    updated = rec;
    return db;
  });
  if (!updated) { res.status(404).json({ error: 'Record not found' }); return; }
  res.json(updated);
});

app.delete(apiPath('/capture-records/:id'), (req, res) => {
  updateDb((db) => {
    if (!Array.isArray(db.captureRecords)) db.captureRecords = [];
    db.captureRecords = db.captureRecords.filter((r) => r.id !== req.params.id);
    return db;
  });
  res.status(204).end();
});

// ── Knowledge Items ────────────────────────────────────────────────────────────
app.get(apiPath('/knowledge-items'), (req, res) => {
  const db = getDb();
  res.json(db.knowledgeItems || []);
});

app.post(apiPath('/knowledge-items'), (req, res) => {
  const payload = req.body || {};
  const timestamp = nowIso();
  const item = { id: createId('ki'), ...payload, createdAt: timestamp, updatedAt: timestamp };
  updateDb((db) => {
    if (!Array.isArray(db.knowledgeItems)) db.knowledgeItems = [];
    db.knowledgeItems.unshift(item);
    return db;
  });
  res.status(201).json(item);
});

app.patch(apiPath('/knowledge-items/:id'), (req, res) => {
  const id = req.params.id;
  let updated = null;
  updateDb((db) => {
    if (!Array.isArray(db.knowledgeItems)) db.knowledgeItems = [];
    const item = db.knowledgeItems.find((k) => k.id === id);
    if (!item) return db;
    Object.assign(item, req.body || {}, { updatedAt: nowIso() });
    updated = item;
    return db;
  });
  if (!updated) { res.status(404).json({ error: 'Item not found' }); return; }
  res.json(updated);
});

app.delete(apiPath('/knowledge-items/:id'), (req, res) => {
  updateDb((db) => {
    if (!Array.isArray(db.knowledgeItems)) db.knowledgeItems = [];
    db.knowledgeItems = db.knowledgeItems.filter((k) => k.id !== req.params.id);
    return db;
  });
  res.status(204).end();
});

app.post(apiPath('/crm/execution'), requireQueueToken, async (req, res) => {
  await handleTwentyExecutionRequest(req, res);
});

app.post(apiPath('/crm/opportunities/:opportunityId/execution'), requireQueueToken, async (req, res) => {
  await handleTwentyExecutionRequest(req, res, {
    opportunityId: req.params.opportunityId,
  });
});

app.post(apiPath('/crm/companies/:companyId/execution'), requireQueueToken, async (req, res) => {
  await handleTwentyExecutionRequest(req, res, {
    companyId: req.params.companyId,
  });
});

app.post(apiPath('/crm/execute'), requireQueueToken, async (req, res) => {
  await handleTwentyExecutionRequest(req, res);
});

// ── Vendor Registration Lane ──────────────────────────────────────────────────
app.post(apiPath('/crm/vendor-registration'), requireQueueToken, (req, res) => {
  const payload = req.body || {};
  if (!payload.portal) {
    res.status(400).json({ ok: false, error: 'portal is required' });
    return;
  }

  const jobs = enqueueJobs([{
    action: 'vendor_registration_lane',
    payload,
  }]);

  setImmediate(() => {
    safeRunWorkerPass();
  });

  res.status(202).json({
    ok: true,
    message: 'Vendor registration lane enqueued',
    jobs,
  });
});

// ── Twenty CRM Bridge (read-through) ──────────────────────────────────────────
app.use(apiPath('/crm'), twentyBridgeRouter);

app.all(apiPath('/automation'), requireQueueToken, (req, res) => {
  handleAutomationFunction(req, res);
});

// ── Google OAuth routes ───────────────────────────────────────────────────────
app.get(`${BASE_PATH}/auth/google`, (req, res) => {
  res.redirect(getAuthUrl());
});

app.get(`${BASE_PATH}/auth/google/callback`, async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    res.status(400).send(`<h2>Google auth failed: ${error}</h2><p><a href="${BASE_PATH}/auth/google">Try again</a></p>`);
    return;
  }
  if (!code) {
    res.status(400).send('<h2>Missing authorization code.</h2>');
    return;
  }
  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(String(code));
    saveToken({ ...tokens, needsReauth: false });
    res.send(`<!DOCTYPE html><html><body style="font-family:Arial;padding:40px;background:#f5f1e8"><h1 style="color:#1f4d3a">✅ Google Docs connected</h1><p>Proposal Flow can now create Google Docs. You can close this tab.</p></body></html>`);
  } catch (err) {
    res.status(500).send(`<h2>Token exchange failed: ${err.message}</h2>`);
  }
});

app.get(`${BASE_PATH}/auth/google/status`, (req, res) => {
  const token = loadToken();
  const scope = token?.scope || '';
  const connected = !!token && !token.needsReauth;
  const hasDocScope = connected && scope.includes('documents');
  const hasGmailScope = connected && (scope.includes('mail.google.com') || scope.includes('gmail.modify') || scope.includes('gmail.send') || scope.includes('gmail.compose'));
  res.json({
    connected,
    hasDocScope,
    hasGmailScope,
    authUrl: (!token || token.needsReauth) ? getAuthUrl() : null,
  });
});

app.post(apiPath('/outreach/dispatch'), requireQueueToken, async (req, res) => {
  try {
    const payload = req.body || {};
    const jobs = enqueueJobs([{ action: 'dispatch_outreach_email', payload }]);
    setImmediate(() => {
      safeRunWorkerPass();
    });
    res.status(202).json({
      ok: true,
      message: 'Outreach dispatch enqueued',
      jobs,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post(apiPath('/outreach/dispatch/direct'), requireQueueToken, async (req, res) => {
  try {
    const payload = req.body || {};
    const db = getDb();
    const lane = payload.lane || payload.emailLane || 'general';
    const officialGovcon = lane === 'official_govcon' || payload.officialGovcon === true;
    const defaultFrom = officialGovcon
      ? (db.settings?.ownerEmail || 'admin@thrarecontracting.com')
      : (db.settings?.outboundEmail || db.settings?.ownerEmail);
    const result = await dispatchGmailMessage({
      lane,
      officialGovcon,
      transport: payload.transport,
      from: payload.from || defaultFrom,
      to: payload.to,
      cc: payload.cc || [],
      bcc: payload.bcc || [],
      replyTo: payload.replyTo || payload.from || defaultFrom,
      subject: payload.subject || '',
      text: payload.text || payload.body || '',
      html: payload.html || '',
      threadId: payload.threadId || undefined,
      mode: payload.mode === 'send' ? 'send' : 'draft',
    });
    res.json({ ok: true, result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ ok: false, error: error.message, authUrl: error.authUrl || null });
  }
});

app.post(apiPath('/outreach/test-official-govcon-smtp'), requireQueueToken, async (req, res) => {
  try {
    const payload = req.body || {};
    const db = getDb();
    const to = payload.to || db.settings?.ownerEmail || 'admin@thrarecontracting.com';
    const result = await dispatchGmailMessage({
      lane: 'official_govcon',
      officialGovcon: true,
      transport: 'smtp',
      from: payload.from || db.settings?.ownerEmail || 'admin@thrarecontracting.com',
      replyTo: payload.replyTo || db.settings?.ownerEmail || 'admin@thrarecontracting.com',
      to,
      subject: payload.subject || 'Proposal Flow SMTP test',
      text: payload.text || `Official GovCon SMTP test sent at ${new Date().toISOString()} from Proposal Flow.`,
      html: payload.html || '',
      mode: 'send',
    });
    res.json({ ok: true, result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ ok: false, error: error.message, authUrl: error.authUrl || null });
  }
});

// ─── Rapid-Response Draft Automation ──────────────────────────────────────────
app.get(apiPath('/rapid-response/templates'), (_req, res) => {
  res.json({ ok: true, templates: listTemplates() });
});

app.post(apiPath('/proposals/:id/draft-email'), async (req, res) => {
  try {
    const proposal = getDb().proposals.find((p) => p.id === req.params.id);
    if (!proposal) return res.status(404).json({ ok: false, error: 'Proposal not found' });

    const { templateId, overrides = {}, createDraft = false, lane = 'general', officialGovcon = false, transport } = req.body || {};
    if (!templateId) return res.status(400).json({ ok: false, error: 'templateId is required' });

    const context = { ...proposalToContext(proposal), ...overrides };
    const { subject, body } = renderTemplate(templateId, context);
    const to = context.contactEmail || '';

    if (!createDraft) {
      return res.json({ ok: true, rendered: { to, subject, body, lane, officialGovcon } });
    }

    if (!to) {
      return res.status(400).json({ ok: false, error: 'contactEmail required to create draft or send official email' });
    }

    const db = getDb();
    const useOfficialGovcon = officialGovcon === true || lane === 'official_govcon';
    const fromEmail = useOfficialGovcon
      ? (db.settings?.ownerEmail || 'admin@thrarecontracting.com')
      : (db.settings?.outboundEmail || db.settings?.ownerEmail || 'rareearthcontracting@gmail.com');
    const mode = useOfficialGovcon ? 'send' : 'draft';
    const result = await dispatchGmailMessage({
      lane,
      officialGovcon: useOfficialGovcon,
      transport,
      from: fromEmail,
      replyTo: fromEmail,
      to,
      subject,
      text: body,
      mode,
    });

    res.json({ ok: true, draft: result, rendered: { to, subject, body, lane, officialGovcon: useOfficialGovcon } });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ ok: false, error: error.message, authUrl: error.authUrl || null });
  }
});

// ─── GovCon Alerts: stale inbounds, teaming windows, official dispatch log ───
app.get(apiPath('/govcon/alerts'), (req, res) => {
  const db = getDb();
  const staleInbounds = detectStaleInbounds(db.proposals);
  const teamingWindows = computeTeamingWindows(db.proposals);
  const officialDispatches = getOfficialDispatchSummary(db.proposals);
  res.json({
    ok: true,
    staleInbounds,
    teamingWindows,
    officialDispatches,
    counts: {
      staleInbounds: staleInbounds.length,
      teamingWindows: teamingWindows.length,
      criticalTeaming: teamingWindows.filter((w) => w.windowStatus === 'critical' || w.windowStatus === 'expired').length,
      officialDispatches: officialDispatches.length,
    },
  });
});

// ─── Operator Updates: hourly work-hour cadence ────────────────────────────────
app.get(apiPath('/operator-updates'), (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const since = req.query.since || undefined;
  const updates = getOperatorUpdates({ limit, since });
  const summary = getOperatorSummary();
  res.json({ ok: true, updates, summary });
});

app.post(apiPath('/operator-updates'), (req, res) => {
  const { done, queued, blocked, source, meta } = req.body || {};
  if (!done && !queued && !blocked) {
    return res.status(400).json({ ok: false, error: 'Provide at least one of: done, queued, blocked' });
  }
  const entry = appendOperatorUpdate({ done, queued, blocked, source, meta });
  res.status(201).json({ ok: true, entry });
});

app.post(apiPath('/operator-updates/:id/resolve'), (req, res) => {
  const { blockedText } = req.body || {};
  if (!blockedText) {
    return res.status(400).json({ ok: false, error: 'blockedText is required' });
  }
  const entry = resolveBlockedItem(req.params.id, blockedText);
  if (!entry) {
    return res.status(404).json({ ok: false, error: 'Update or blocked item not found' });
  }
  res.json({ ok: true, entry });
});

app.get(apiPath('/operator-updates/summary'), (req, res) => {
  res.json({ ok: true, ...getOperatorSummary() });
});

app.get(apiPath('/operator-updates/blockers'), (req, res) => {
  const proposalId = req.query.proposalId || undefined;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const blockers = getUnresolvedBlockers({ proposalId, limit });
  res.json({ ok: true, blockers });
});

// ─── Cron / Loop Status: always-on visibility ──────────────────────────────
app.get(apiPath('/cron-status'), (req, res) => {
  const db = getDb();
  const now = new Date();
  const dayCode = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
  const cadenceDays = Array.isArray(db.cadence?.days) ? db.cadence.days : [];
  const queuedCount = db.jobs.filter((j) => j.status === 'queued').length;
  const processingCount = db.jobs.filter((j) => j.status === 'processing').length;

  res.json({
    ok: true,
    loop: {
      intervalSeconds: 15,
      startedAt: _loopState.startedAt,
      lastRunAt: _loopState.lastRunAt,
      totalPasses: _loopState.totalPasses,
      consecutiveErrors: _loopState.consecutiveErrors,
      status: _loopState.consecutiveErrors > 5 ? 'degraded' : 'healthy',
    },
    cadence: {
      enabled: db.cadence?.enabled || false,
      days: cadenceDays,
      time: db.cadence?.time || '09:00',
      tz: db.cadence?.tz || 'America/New_York',
      todayCode: dayCode,
      isCadenceDay: cadenceDays.includes(dayCode),
      lastResult: _loopState.lastCadenceResult,
    },
    queue: {
      queued: queuedCount,
      processing: processingCount,
    },
    lastWorkerResult: _loopState.lastWorkerResult,
    health: db.health?.last_processed || null,
  });
});

app.get(apiPath('/proposals/:id/stage-readiness'), (req, res) => {
  const proposal = getDb().proposals.find((item) => item.id === req.params.id);
  if (!proposal) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  const readiness = getStageAdvanceReadiness(proposal);
  const handoffs = Array.isArray(proposal.stageHandoffs) ? proposal.stageHandoffs : [];
  res.json({ ok: true, proposalId: proposal.id, readiness, handoffs });
});

app.get(apiPath('/proposals/:id/submission-readiness'), (req, res) => {
  const proposal = getDb().proposals.find((item) => item.id === req.params.id);
  if (!proposal) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  ensureSubmissionReview(proposal);
  const readiness = calculateSubmissionReadiness(proposal);
  res.json({ ok: true, proposalId: proposal.id, readiness, review: proposal.metadata?.submissionReview || null });
});

app.post(apiPath('/proposals/:id/request-review'), (req, res) => {
  const { id } = req.params;
  let updated = null;
  updateDb((db) => {
    const proposal = db.proposals.find((item) => item.id === id);
    if (!proposal) return db;
    const review = ensureSubmissionReview(proposal);
    review.status = REVIEW_DECISIONS.pending;
    review.requestedAt = nowIso();
    review.notes = req.body?.notes || review.notes || '';
    appendSubmissionHistory(review, {
      type: 'review_requested',
      label: 'Review requested from Eric',
      notes: review.notes,
    });
    proposal.workflow = proposal.workflow || {};
    proposal.workflow.currentStage = 'final_review';
    proposal.workflow.updatedAt = nowIso();
    proposal.updatedAt = nowIso();
    updated = proposal;
    return db;
  });
  if (!updated) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.json({ ok: true, proposalId: id, review: updated.metadata?.submissionReview, readiness: calculateSubmissionReadiness(updated) });
});

app.post(apiPath('/proposals/:id/review-decision'), (req, res) => {
  const { id } = req.params;
  const decision = req.body?.decision;
  if (!Object.values(REVIEW_DECISIONS).includes(decision)) {
    return res.status(400).json({ ok: false, error: 'Invalid decision' });
  }
  let updated = null;
  updateDb((db) => {
    const proposal = db.proposals.find((item) => item.id === id);
    if (!proposal) return db;
    const review = ensureSubmissionReview(proposal);
    review.status = decision;
    review.reviewedAt = nowIso();
    review.reviewer = req.body?.reviewer || 'Eric';
    review.notes = req.body?.notes || review.notes || '';
    if (decision === REVIEW_DECISIONS.approved) {
      review.checklist.approvedByEric = true;
      proposal.status = proposal.status === 'submitted' ? proposal.status : 'google_docs_final';
    } else if (decision === REVIEW_DECISIONS.needs_changes || decision === REVIEW_DECISIONS.rejected) {
      review.checklist.approvedByEric = false;
      proposal.status = 'review';
    }
    appendSubmissionHistory(review, {
      type: 'review_decision',
      label: `Review decision: ${decision}`,
      reviewer: review.reviewer,
      notes: review.notes,
    });
    proposal.updatedAt = nowIso();
    updated = proposal;
    return db;
  });
  if (!updated) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.json({ ok: true, proposalId: id, review: updated.metadata?.submissionReview, readiness: calculateSubmissionReadiness(updated), status: updated.status });
});

app.post(apiPath('/proposals/:id/submission-checklist'), (req, res) => {
  const { id } = req.params;
  let updated = null;
  updateDb((db) => {
    const proposal = db.proposals.find((item) => item.id === id);
    if (!proposal) return db;
    const review = ensureSubmissionReview(proposal);
    const patch = req.body?.checklist || {};
    review.checklist = {
      ...review.checklist,
      ...patch,
    };
    appendSubmissionHistory(review, {
      type: 'checklist_updated',
      label: 'Submission checklist updated',
      checklist: review.checklist,
    });
    proposal.updatedAt = nowIso();
    updated = proposal;
    return db;
  });
  if (!updated) return res.status(404).json({ ok: false, error: 'Proposal not found' });
  res.json({ ok: true, proposalId: id, review: updated.metadata?.submissionReview, readiness: calculateSubmissionReadiness(updated) });
});

app.post(apiPath('/proposals/:id/mark-submitted'), (req, res) => {
  const { id } = req.params;
  let updated = null;
  let readiness = null;
  updateDb((db) => {
    const proposal = db.proposals.find((item) => item.id === id);
    if (!proposal) return db;
    const review = ensureSubmissionReview(proposal);
    readiness = calculateSubmissionReadiness(proposal);
    if (!readiness.readyToSubmit) {
      return db;
    }
    proposal.status = 'submitted';
    proposal.updatedAt = nowIso();
    proposal.metadata = proposal.metadata || {};
    proposal.metadata.submittedAt = req.body?.submittedAt || nowIso();
    proposal.metadata.submissionPortal = req.body?.submissionPortal || proposal.metadata.submissionPortal || '';
    proposal.metadata.submissionReference = req.body?.submissionReference || proposal.metadata.submissionReference || '';
    appendSubmissionHistory(review, {
      type: 'marked_submitted',
      label: 'Proposal marked submitted after Eric approval',
      submissionPortal: proposal.metadata.submissionPortal,
      submissionReference: proposal.metadata.submissionReference,
    });
    updated = proposal;
    return db;
  });
  if (!updated) {
    const proposal = getDb().proposals.find((item) => item.id === id);
    if (!proposal) return res.status(404).json({ ok: false, error: 'Proposal not found' });
    const currentReadiness = calculateSubmissionReadiness(proposal);
    return res.status(400).json({ ok: false, error: 'Proposal is not ready to submit', readiness: currentReadiness, review: proposal.metadata?.submissionReview || null });
  }
  res.json({ ok: true, proposalId: id, status: updated.status, readiness: calculateSubmissionReadiness(updated), review: updated.metadata?.submissionReview || null, submittedAt: updated.metadata?.submittedAt || null });
});

// ── Static route for .docx exports ──
app.use(apiPath('/exports'), express.static('server/data/exports', {
  setHeaders: (res, p) => {
    if (p.endsWith('.docx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(p)}"`);
    }
  },
}));

// ── Fetch solicitation document from URL ──
app.post(apiPath('/proposals/fetch-document'), async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic URL validation
  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Remote server returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || '';
    const filename = parsed.pathname.split('/').pop() || 'document';

    if (contentType.includes('application/pdf')) {
      return res.json({
        text: `[PDF document fetched from ${url}  - PDF text extraction requires manual upload. File saved for reference.]`,
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        contentType: 'application/pdf',
        sourceUrl: url,
        note: 'PDF detected. Upload the PDF directly for full text extraction, or paste key sections into the solicitation text field.',
      });
    }

    const html = await response.text();
    // Strip HTML tags to extract text content
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || text.length < 50) {
      return res.json({
        text: '',
        filename,
        contentType,
        sourceUrl: url,
        note: 'Page returned very little text content. The solicitation may require login or may be behind a paywall.',
      });
    }

    // Truncate to reasonable size (500KB of text)
    const truncated = text.length > 500000 ? text.slice(0, 500000) + '\n\n[... truncated]' : text;

    res.json({
      text: truncated,
      filename,
      contentType,
      sourceUrl: url,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out (30s)' });
    }
    console.error('Fetch document error:', err.message);
    res.status(502).json({ error: `Failed to fetch: ${err.message}` });
  }
});

// ── Export to Google Docs: Compliance Matrix ──
app.post(apiPath('/proposals/:id/export/compliance-matrix'), async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    const gdocUrl = await createComplianceDoc(proposal);
    res.json({ ok: true, gdocUrl });
  } catch (err) {
    console.error('Compliance export error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Export to Google Docs: Pre-solicitation ──
app.post(apiPath('/proposals/:id/export/pre-solicitation'), async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const proposals = db.proposals || db.data?.proposals || [];
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    const gdocUrl = await createPreSolDoc(proposal);
    res.json({ ok: true, gdocUrl });
  } catch (err) {
    console.error('Pre-sol export error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'docs'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  },
}));

app.use(BASE_PATH, express.static(path.join(__dirname, 'docs'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  },
}));

// ── INVOICE & COLLECTIONS SYSTEM ────────────────────────────────────────────

const INVOICES_FILE = path.join(__dirname, 'server', 'data', 'invoices.json');
function loadInvoices() {
  try { return JSON.parse(readFileSync(INVOICES_FILE, 'utf8')); }
  catch { return { invoices: [] }; }
}
function saveInvoices(data) {
  writeFileSync(INVOICES_FILE, JSON.stringify(data, null, 2));
}

// Invoice aging summary (must be before :id route)
app.get(apiPath('/invoices/aging/summary'), (_req, res) => {
  const data = loadInvoices();
  const now = Date.now();
  const aging = { current: [], over7: [], over14: [], over30: [], over60: [] };

  for (const inv of (data.invoices || [])) {
    if (inv.status === 'paid') continue;
    if (inv.status === 'draft') continue;
    const due = new Date(inv.dueDate).getTime();
    const daysOverdue = Math.floor((now - due) / 86400000);
    const entry = { id: inv.id, title: inv.title, client: inv.clientName, total: inv.total, daysOverdue };
    if (daysOverdue > 60) aging.over60.push(entry);
    else if (daysOverdue > 30) aging.over30.push(entry);
    else if (daysOverdue > 14) aging.over14.push(entry);
    else if (daysOverdue > 7) aging.over7.push(entry);
    else aging.current.push(entry);
  }
  res.json({ ok: true, aging });
});

// List invoices
app.get(apiPath('/invoices'), (_req, res) => {
  const data = loadInvoices();
  const status = _req.query.status;
  let invoices = data.invoices || [];
  if (status) invoices = invoices.filter(i => i.status === status);
  res.json({ ok: true, invoices, total: invoices.length });
});

// Get single invoice
app.get(apiPath('/invoices/:id'), (req, res) => {
  const data = loadInvoices();
  const inv = (data.invoices || []).find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ ok: true, invoice: inv });
});

// Create invoice
app.post(apiPath('/invoices'), (req, res) => {
  const data = loadInvoices();
  const { proposalId, clientName, clientEmail, clientPhone, lineItems, dueDate, notes, amount, description } = req.body;

  const invoice = {
    id: `INV-${Date.now().toString(36).toUpperCase()}`,
    proposalId: proposalId || null,
    clientName: clientName || 'Unknown',
    clientEmail: clientEmail || '',
    clientPhone: clientPhone || '',
    lineItems: lineItems || [],
    total: amount || (lineItems || []).reduce((s, i) => s + (i.amount || 0), 0),
    dueDate: dueDate || new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
    notes: notes || description || '',
    status: 'sent',
    createdAt: new Date().toISOString(),
    sentDate: new Date().toISOString(),
    paidDate: null,
  };

  data.invoices = data.invoices || [];
  data.invoices.push(invoice);
  saveInvoices(data);
  console.log(`[Invoice] Created ${invoice.id} for ${invoice.clientName} ($${invoice.total})`);
  res.status(201).json({ ok: true, invoice });
});

// Update invoice status
app.patch(apiPath('/invoices/:id'), (req, res) => {
  const data = loadInvoices();
  const inv = (data.invoices || []).find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const { status, paidDate } = req.body;
  if (status) inv.status = status;
  if (status === 'paid') inv.paidDate = paidDate || new Date().toISOString();
  saveInvoices(data);
  res.json({ ok: true, invoice: inv });
});

// ── APPROVAL QUEUE (Outreach Auto-Send) ─────────────────────────────────────

const APPROVAL_FILE = path.join(__dirname, 'server', 'data', 'approval-queue.json');
function loadApprovalQueue() {
  try { return JSON.parse(readFileSync(APPROVAL_FILE, 'utf8')); }
  catch { return { queue: [] }; }
}
function saveApprovalQueue(data) {
  writeFileSync(APPROVAL_FILE, JSON.stringify(data, null, 2));
}

// List pending approvals
app.get(apiPath('/approval-queue'), (req, res) => {
  const data = loadApprovalQueue();
  const status = req.query.status || 'pending';
  let queue = data.queue || [];
  if (status !== 'all') queue = queue.filter(i => i.status === status);
  res.json({ ok: true, queue, total: queue.length });
});

// Add to approval queue
app.post(apiPath('/approval-queue'), (req, res) => {
  const data = loadApprovalQueue();
  const { type, to, subject, body, source } = req.body;

  if (!type || !to || !body) {
    return res.status(400).json({ error: 'type, to, and body are required' });
  }

  const item = {
    id: `APR-${Date.now().toString(36).toUpperCase()}`,
    type,
    to,
    subject: subject || '',
    body,
    source: source || 'manual',
    status: 'pending',
    queuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    decidedAt: null,
    sentAt: null,
  };

  data.queue = data.queue || [];
  data.queue.push(item);
  saveApprovalQueue(data);
  console.log(`[Approval] Queued ${item.id}: ${type} to ${to} (expires ${item.expiresAt})`);
  res.status(201).json({ ok: true, item });
});

// Approve or reject
app.patch(apiPath('/approval-queue/:id'), (req, res) => {
  const data = loadApprovalQueue();
  const item = (data.queue || []).find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }

  item.status = status;
  item.decidedAt = new Date().toISOString();
  saveApprovalQueue(data);
  console.log(`[Approval] ${item.id} ${status} by user`);
  res.json({ ok: true, item });
});

app.get('/', (req, res) => {
  res.redirect(BASE_PATH);
});

app.get([`${BASE_PATH}`, `${BASE_PATH}/*`], (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Error loading application');
    }
  });
});

app.get('*', (req, res) => {
  res.redirect(BASE_PATH + req.path);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: isProduction && statusCode >= 500 ? 'Internal server error' : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

const workerInterval = setInterval(async () => {
  _loopState.totalPasses++;
  _loopState.lastRunAt = new Date().toISOString();

  const cadenceResult = runCadencePass();
  _loopState.lastCadenceResult = cadenceResult;

  // Backfill tasks + scoring on proposals that slipped through intake
  try {
    const hk = runHousekeepingPass();
    if (hk.seeded > 0 || hk.scored > 0) {
      console.log(`[housekeeping] seeded=${hk.seeded} scored=${hk.scored}`);
    }
  } catch (err) { console.error('[housekeeping]', err.message, err.stack); }

  const workerResult = await safeRunWorkerPass();

  // Auto-emit operator update when work was done or errors occurred
  const hasDone = workerResult.done?.length > 0;
  const hasFailed = workerResult.failed?.length > 0;
  const cadenceEnqueued = cadenceResult?.enqueued?.length > 0;

  if (hasDone || hasFailed || cadenceEnqueued) {
    try {
      const done = (workerResult.done || []).map((r) => `[${r.action}] ${r.message}`);
      const queued = (cadenceResult?.enqueued || []).map((a) => `Cadence enqueued: ${a}`);
      const blocked = (workerResult.failed || []).map((r) => `[${r.action}] FAILED: ${r.error}`);
      appendOperatorUpdate({ done, queued, blocked, source: 'loop' });
    } catch (err) {
      console.error('[operator-update-auto]', err);
    }
  }
}, 15 * 1000);

const server = app.listen(PORT, HOST, () => {
  console.log(`
  Local automation server started
  ==============================
  Environment: ${NODE_ENV}
  App:         http://localhost:${PORT}${BASE_PATH}
  API:         http://localhost:${PORT}${apiPath()}
  Automation:  http://localhost:${PORT}${apiPath('/automation')}?fn=getHealth
  CRM Bridge:  http://localhost:${PORT}${apiPath('/crm')}/status
  Twenty CRM:  ${isTwentyConfigured() ? 'configured' : 'NOT configured (TWENTY_API_TOKEN missing)'}
  LLM:         ${getLlmStatus()}
  ==============================
  `);
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  if (error.code === 'EACCES') {
    console.error(`${bind} requires elevated privileges`);
    process.exit(1);
  }

  if (error.code === 'EADDRINUSE') {
    console.error(`${bind} is already in use`);
    process.exit(1);
  }

  throw error;
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);
  clearInterval(workerInterval);
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});


// Dead stubs removed  - real stage endpoints registered above app.listen()
