import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalizeProposal } from '../shared/proposalNormalization.js';
import { DEFAULT_MODEL_ROUTING } from '../shared/proposalWorkflow.js';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_PATH = path.join(DATA_DIR, 'automation-db.json');

const DEFAULT_DB = {
  proposals: [],
  calendarEvents: [],
  directories: [],
  reports: [],
  opportunities: [],
  captureRecords: [],
  knowledgeItems: [],
  jobs: [],
  health: {
    events: [],
    last_processed: null,
  },
  cadence: {
    days: ['MON', 'WED'],
    time: '09:00',
    tz: 'America/New_York',
    enabled: true,
  },
  artifacts: [],
  settings: {
    companyName: 'Thrare Contracting',
    ownerName: 'Eric White',
    ownerEmail: 'admin@thrarecontracting.com',
    outboundEmail: 'admin@thrarecontracting.com',
    aiRouting: DEFAULT_MODEL_ROUTING,
  },
  businessProfile: {
    companyName: 'Thrare Contracting',
    focusAreas: [
      'environmental remediation',
      'recycling',
      'training support',
      'construction support',
      'staffing',
      'facilities support',
    ],
    keywords: [
      'training',
      'environmental',
      'recycling',
      'construction',
      'staff augmentation',
      'operations support',
      'grounds maintenance',
      'facility support',
    ],
    targetAgencies: [
      'Department of Defense',
      'Department of Energy',
      'Environmental Protection Agency',
      'GSA',
      'City of Atlanta',
    ],
  },
  watchers: {
    portals: [
      {
        id: 'portal-sam',
        name: 'SAM.gov',
        url: 'https://sam.gov',
        enabled: true,
        cadence: 'daily',
        tags: ['federal', 'solicitations'],
        mockData: true,
        sampleOpportunities: [
          {
            title: 'Environmental Services Support BPA',
            agency: 'Environmental Protection Agency',
            summary: 'Support environmental compliance, recycling, and field operations.',
            dueDateOffsetDays: 18,
            documents: ['rfp.pdf', 'pricing-sheet.xlsx'],
          },
          {
            title: 'Training Delivery and Program Support',
            agency: 'Department of Defense',
            summary: 'Provide curriculum delivery, logistics coordination, and staff augmentation.',
            dueDateOffsetDays: 12,
            documents: ['solicitation.pdf', 'attachments.zip'],
          },
        ],
      },
      {
        id: 'portal-bidnet',
        name: 'BidNet Direct',
        url: 'https://www.bidnetdirect.com/',
        enabled: true,
        cadence: 'daily',
        tags: ['state_local', 'municipal'],
        mockData: true,
        sampleOpportunities: [
          {
            title: 'Municipal Recycling and Disposal Services',
            agency: 'City Procurement Office',
            summary: 'Operate recycling pickup, reporting, and compliance management.',
            dueDateOffsetDays: 21,
            documents: ['itb.pdf'],
          },
        ],
      },
      {
        id: 'portal-bonfire',
        name: 'Bonfire (Forsyth)',
        url: 'https://forsythco.bonfirehub.com/',
        enabled: true,
        cadence: 'weekly',
        tags: ['county', 'services'],
        mockData: true,
        sampleOpportunities: [
          {
            title: 'Facilities and Grounds Support Services',
            agency: 'Forsyth County',
            summary: 'Provide grounds maintenance, facilities support, and incident response.',
            dueDateOffsetDays: 16,
            documents: ['rfq.pdf', 'scope.docx'],
          },
        ],
      },
      {
        id: 'portal-fpds',
        name: 'FPDS (Federal Past Awards)',
        url: 'https://www.fpds.gov',
        enabled: true,
        cadence: 'weekly',
        tags: ['market_research', 'federal', 'contract_history'],
      },
      {
        id: 'portal-usaspending',
        name: 'USAspending.gov',
        url: 'https://www.usaspending.gov',
        enabled: true,
        cadence: 'weekly',
        tags: ['market_research', 'federal', 'contract_history'],
      },
      {
        id: 'portal-gpr',
        name: 'Georgia Procurement Registry',
        url: 'https://ssl.doas.state.ga.us/gpr/',
        enabled: true,
        cadence: 'weekly',
        tags: ['market_research', 'ga_state_local', 'solicitations'],
      },
      {
        id: 'portal-team-ga',
        name: 'Team Georgia Marketplace',
        url: 'https://team.georgia.gov',
        enabled: true,
        cadence: 'weekly',
        tags: ['market_research', 'ga_state_local', 'solicitations'],
      },
      {
        id: 'portal-atlanta',
        name: 'City of Atlanta Procurement',
        url: 'https://www.atlantaga.gov/government/procurement',
        enabled: true,
        cadence: 'weekly',
        tags: ['market_research', 'ga_state_local', 'municipal'],
      },
      {
        id: 'portal-fulton',
        name: 'Fulton County Purchasing',
        url: 'https://www.fultoncountyga.gov/inside-fulton-county/fulton-county-departments/purchasing-contracting',
        enabled: true,
        cadence: 'weekly',
        tags: ['market_research', 'ga_state_local', 'county'],
      },
      {
        id: 'portal-dekalb',
        name: 'DeKalb County Purchasing',
        url: 'https://www.dekalbcountyga.gov/purchasing-contracting',
        enabled: true,
        cadence: 'weekly',
        tags: ['market_research', 'ga_state_local', 'county'],
      },
    ],
  },
};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDefaults(target, defaults) {
  const output = Array.isArray(defaults) ? [] : { ...target };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const currentValue = target?.[key];
    if (Array.isArray(defaultValue)) {
      output[key] = Array.isArray(currentValue) ? currentValue : clone(defaultValue);
      continue;
    }

    if (defaultValue && typeof defaultValue === 'object') {
      output[key] = mergeDefaults(currentValue || {}, defaultValue);
      continue;
    }

    output[key] = currentValue ?? defaultValue;
  }

  for (const [key, value] of Object.entries(target || {})) {
    if (!(key in output)) {
      output[key] = value;
    }
  }

  return output;
}

function createSampleProposal() {
  const now = new Date().toISOString();
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  return normalizeProposal({
    id: 'seed-proposal-1',
    title: 'Seed Solicitation - Training Support Services',
    agency: 'Department of Defense',
    dueDate,
    status: 'intake',
    notes: 'Initial seeded proposal used to bootstrap the local automation backend.',
    source: 'seed',
    type: 'federal',
    createdAt: now,
    updatedAt: now,
    tasks: [
      {
        id: 'seed-task-1',
        proposalId: 'seed-proposal-1',
        title: 'Review solicitation package',
        owner: 'Morpheus',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        status: 'pending',
        priority: 'high',
        createdAt: now,
      },
    ],
    files: [],
    metadata: {
      sourceType: 'seed',
      draftOverviewStatus: 'pending',
      proposalDraftStatus: 'pending',
      workflowSteps: [
        {
          id: 'seed-step-1',
          stage: 'intake',
          label: 'Seed proposal created',
          status: 'completed',
          timestamp: now,
        },
      ],
    },
  });
}

function createSampleOpportunity() {
  return {
    id: 'seed-opp-1',
    title: 'Training Support Services',
    agency: 'Department of Defense',
    url: 'https://sam.gov',
    stage: 'opportunity',
    createdAt: new Date().toISOString(),
    metrics: {
      Profitability: 72,
      StrategicFit: 82,
      Competition: 58,
      SubcontractingPotential: 49,
      LikelihoodOfAward: 64,
      RelationshipLeverage: 45,
      PastPerformanceMatch: 80,
    },
  };
}

function initializeDb() {
  const db = clone(DEFAULT_DB);
  db.proposals = [createSampleProposal()];
  db.opportunities = [createSampleOpportunity()];
  db.reports = [];
  return db;
}

function loadDb() {
  ensureDataDir();

  if (!existsSync(DB_PATH)) {
    const db = initializeDb();
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    return db;
  }

  try {
    const raw = readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return mergeDefaults(parsed, DEFAULT_DB);
  } catch (error) {
    if (existsSync(DB_PATH)) {
      const corruptPath = path.join(DATA_DIR, `automation-db.corrupt-${Date.now()}.json`);
      try {
        copyFileSync(DB_PATH, corruptPath);
      } catch {
        // Best effort only; if backup fails we still need a recoverable boot path.
      }
    }
    const db = initializeDb();
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    return db;
  }
}

let dbCache = loadDb();

function saveDb() {
  ensureDataDir();
  const tempPath = `${DB_PATH}.tmp`;
  writeFileSync(tempPath, JSON.stringify(dbCache, null, 2), 'utf8');
  renameSync(tempPath, DB_PATH);
}

export function getDb() {
  return clone(dbCache);
}

export function updateDb(mutator) {
  const workingCopy = clone(dbCache);
  const result = mutator(workingCopy) || workingCopy;
  dbCache = mergeDefaults(result, DEFAULT_DB);
  saveDb();
  return clone(dbCache);
}

export function appendHealthEvent(event) {
  return updateDb((db) => {
    db.health.events.unshift({
      id: event.id || randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    });
    db.health.events = db.health.events.slice(0, 200);
    db.health.last_processed = {
      timestamp: event.timestamp || new Date().toISOString(),
      action: event.action || 'unknown',
      status: event.status || (event.ok !== false ? 'applied' : 'failed'),
      success: event.ok !== false,
      jobId: event.jobId || null,
      message: event.error || event.message || '',
      warningCount: event.warningCount || 0,
      errorCount: event.errorCount || 0,
    };
    return db;
  });
}

export function upsertProposal(proposal) {
  return updateDb((db) => {
    const index = db.proposals.findIndex((item) => item.id === proposal.id);
    if (index === -1) {
      db.proposals.push(proposal);
    } else {
      db.proposals[index] = proposal;
    }
    return db;
  });
}

export function createId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

export function nowIso() {
  return new Date().toISOString();
}
