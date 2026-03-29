import { createId, getDb, nowIso, updateDb, appendHealthEvent } from './automation-store.js';

const STAGE_SEQUENCE = ['intake', 'outline', 'drafting', 'internal_review', 'final_review', 'submitted'];

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

function scoreOpportunity(opportunity, businessProfile) {
  const text = [
    opportunity.title,
    opportunity.summary,
    opportunity.agency,
  ].join(' ').toLowerCase();

  let score = 40;
  const matches = [];

  for (const keyword of businessProfile.keywords || []) {
    if (text.includes(keyword.toLowerCase())) {
      score += 8;
      matches.push(`keyword:${keyword}`);
    }
  }

  for (const agency of businessProfile.targetAgencies || []) {
    if ((opportunity.agency || '').toLowerCase().includes(agency.toLowerCase())) {
      score += 10;
      matches.push(`agency:${agency}`);
    }
  }

  const normalizedScore = Math.max(0, Math.min(98, score));
  return {
    fitScore: normalizedScore,
    fitDecision: normalizedScore >= 60 ? 'recommended' : 'watch',
    fitReasons: matches.slice(0, 5),
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

function createProposalFromSolicitation(payload) {
  const createdAt = nowIso();
  const proposalId = createId('proposal');
  const dueDate = payload.dueDate || payload.due_date || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

  return {
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
  };
}

const FEDERAL_TASK_CHECKLIST = [
  { title: 'Review solicitation package and confirm due date', priority: 'high', offsetDays: 0 },
  { title: 'Extract evaluation criteria and scoring weights', priority: 'high', offsetDays: 1 },
  { title: 'Build compliance matrix (requirements vs. sections)', priority: 'high', offsetDays: 1 },
  { title: 'Identify win themes and differentiators', priority: 'high', offsetDays: 2 },
  { title: 'Draft Executive Summary', priority: 'high', offsetDays: 3 },
  { title: 'Draft Technical Approach', priority: 'high', offsetDays: 4 },
  { title: 'Draft Management Plan', priority: 'medium', offsetDays: 5 },
  { title: 'Draft Past Performance section', priority: 'medium', offsetDays: 6 },
  { title: 'Draft Pricing Narrative', priority: 'medium', offsetDays: 7 },
  { title: 'Internal review pass', priority: 'high', offsetDays: 8 },
  { title: 'Final review and format check', priority: 'high', offsetDays: 9 },
  { title: 'Submit by deadline', priority: 'high', offsetDays: 10 },
];

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
      createdAt: timestamp,
    });
  }
}

function processJob(job) {
  const timestamp = nowIso();
  let result = {
    ok: true,
    message: 'Processed',
    updates: {},
  };

  updateDb((db) => {
    switch (job.action) {
      case 'ingest_solicitation': {
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
          ok: true,
          message: `Portal watch scanned ${enabledPortals.length} portal(s)`,
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
          label: 'Proposal draft generated from guide and overview',
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

      case 'update_stage': {
        const proposalId = job.payload?.proposalId || job.payload?.opportunityId;
        const proposal = ensureProposal(db, proposalId);
        if (!proposal) {
          throw new Error(`Proposal not found for stage update: ${proposalId}`);
        }
        proposal.status = job.payload?.stage || nextStage(proposal.status);
        proposal.updatedAt = timestamp;
        appendWorkflowStep(proposal, {
          stage: proposal.status,
          label: `Proposal moved to ${proposal.status}`,
        });
        const opportunity = db.opportunities.find((item) => item.id === proposalId);
        if (opportunity) {
          opportunity.stage = proposal.status;
        }
        result = {
          ok: true,
          message: 'Proposal stage updated',
          updates: { proposalId, stage: proposal.status },
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
        db.opportunities.unshift({
          id: createId('opportunity'),
          title: `Scanned Opportunity ${new Date(timestamp).toLocaleTimeString('en-US')}`,
          agency: 'Scanned Agency',
          url: 'https://sam.gov',
          stage: 'opportunity',
          createdAt: timestamp,
          metrics: {
            Profitability: 65,
            StrategicFit: 75,
            Competition: 55,
            SubcontractingPotential: 45,
            LikelihoodOfAward: 55,
            RelationshipLeverage: 40,
            PastPerformanceMatch: 50,
          },
        });
        db.opportunities = db.opportunities.slice(0, 50);
        result = {
          ok: true,
          message: 'Opportunity scan completed',
          updates: {},
        };
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
        const report = addReport(db, 'weekly', job.payload?.lines || [
          `Weekly pipeline count: ${db.proposals.length}`,
          `Active opportunities: ${db.opportunities.length}`,
          `Directory records: ${db.directories.length}`,
        ]);
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

    const jobRecord = db.jobs.find((item) => item.id === job.id);
    if (jobRecord) {
      jobRecord.status = 'completed';
      jobRecord.processedAt = timestamp;
      jobRecord.result = result;
    }

    return db;
  });

  appendHealthEvent({
    action: job.action,
    jobId: job.id,
    ok: true,
    message: result.message,
    timestamp,
  });

  return result;
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
    db.jobs = db.jobs.slice(0, 500);
    return db;
  });

  return normalizedJobs;
}

export function runWorkerPass() {
  const db = getDb();
  const queuedJobs = db.jobs
    .filter((job) => job.status === 'queued')
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

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

      processJob(job);
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
    }
  }
}

function shouldCreateCadenceReport(db, kind) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return !db.reports.some((report) => report.kind === kind && report.createdTime?.startsWith(today));
}

export function runCadencePass() {
  const db = getDb();
  if (!db.cadence?.enabled) {
    return;
  }

  const now = new Date();
  const dayCode = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
  const cadenceDays = Array.isArray(db.cadence?.days) ? db.cadence.days : [];
  const isCadenceDay = cadenceDays.includes(dayCode);

  if (isCadenceDay && shouldCreateCadenceReport(db, 'daily')) {
    enqueueJobs([{ action: 'post_daily_report', payload: {} }]);
  }

  // Weekly reporting is a Friday-close artifact and should not depend on the
  // daily cadence selection. Otherwise a cadence like MON/WED can never emit a
  // Friday weekly report.
  if (dayCode === 'FRI' && shouldCreateCadenceReport(db, 'weekly')) {
    enqueueJobs([{ action: 'post_weekly_report', payload: {} }]);
  }
}
