/**
 * Twenty CRM API Client (read-oriented + shared GraphQL transport)
 *
 * Read helpers return `null` on failure so the bridge can fall back cleanly.
 * Write callers should use `runTwentyGraphql`, which throws on transport/schema
 * errors so worker jobs fail loudly instead of silently drifting.
 */

import { MILESTONES, DECISION_MAKER_STATUSES } from './growth-constants.js';

const TIMEOUT_MS = 5000;
const HEALTH_TTL_MS = 30_000;

export function getTwentyBase() {
  return process.env.TWENTY_API_URL || 'http://localhost:3000';
}

export function getTwentyToken() {
  return process.env.TWENTY_API_TOKEN || '';
}

export function isTwentyConfigured() {
  return !!getTwentyToken();
}

let cachedHealthy = null;
let lastHealthCheckAt = 0;

export async function runTwentyGraphql(
  query,
  variables = {},
  {
    timeoutMs = TIMEOUT_MS,
    allowMissingToken = false,
  } = {},
) {
  const token = getTwentyToken();
  if (!token) {
    if (allowMissingToken) return null;
    throw new Error('TWENTY_API_TOKEN missing');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getTwentyBase()}/graphql`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Twenty GraphQL HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    }

    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors[0].message || 'Twenty GraphQL error');
    }

    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

async function gql(query, variables = {}) {
  try {
    return await runTwentyGraphql(query, variables, { allowMissingToken: true });
  } catch {
    return null;
  }
}

export async function isHealthy() {
  const now = Date.now();
  if (cachedHealthy !== null && now - lastHealthCheckAt < HEALTH_TTL_MS) {
    return cachedHealthy;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${getTwentyBase()}/healthz`, { signal: controller.signal });
    clearTimeout(timer);
    cachedHealthy = response.ok;
  } catch {
    cachedHealthy = false;
  }

  lastHealthCheckAt = now;
  return cachedHealthy;
}

export async function getCompanies(limit = 100) {
  const data = await gql(`{
    companies(first: ${limit}) {
      edges {
        node {
          id name domainName { primaryLinkUrl primaryLinkLabel }
          address { addressStreet1 addressCity addressState addressPostcode }
          createdAt updatedAt
        }
      }
    }
  }`);
  if (!data?.companies?.edges) return null;
  return data.companies.edges.map((edge) => normalizeCompany(edge.node));
}

export async function getContacts(limit = 100) {
  const data = await gql(`{
    people(first: ${limit}) {
      edges {
        node {
          id
          name { firstName lastName }
          jobTitle
          company { id name }
          emails { primaryEmail additionalEmails }
          phones { primaryPhoneNumber primaryPhoneCallingCode additionalPhones }
          createdAt updatedAt
        }
      }
    }
  }`);
  if (!data?.people?.edges) return null;
  return data.people.edges.map((edge) => normalizeContact(edge.node));
}

export async function getOpportunities(limit = 100) {
  const data = await gql(`{
    opportunities(first: ${limit}) {
      edges {
        node {
          id name amount { amountMicros currencyCode } stage closeDate
          company { id name }
          pointOfContact { id name { firstName lastName } }
          pursuitType source sourceRef priority
          nextAction nextActionDate blockerStatus
          fitScore strategicScore
          createdAt updatedAt
        }
      }
    }
  }`);
  if (!data?.opportunities?.edges) return null;
  return data.opportunities.edges.map((edge) => normalizeOpportunity(edge.node));
}

export async function getTasks(limit = 50) {
  const data = await gql(`{
    tasks(first: ${limit}) {
      edges {
        node {
          id title status dueAt body
          assignee { name { firstName lastName } }
          createdAt updatedAt
        }
      }
    }
  }`);
  if (!data?.tasks?.edges) return null;
  return data.tasks.edges.map((edge) => normalizeTask(edge.node));
}

export async function getActivities(limit = 50) {
  const data = await gql(`{
    notes(first: ${limit}, orderBy: { createdAt: DescNullsLast }) {
      edges {
        node {
          id title body bodyV2 { markdown } createdAt
          noteTargets { edges { node {
            targetCompany { id name }
            targetPerson { id name { firstName lastName } }
            targetOpportunity { id name }
          } } }
        }
      }
    }
  }`);
  if (!data?.notes?.edges) return null;
  return data.notes.edges.map((edge) => normalizeActivity(edge.node));
}

function normalizeCompany(company) {
  return {
    id: company.id,
    name: company.name || '',
    type: 'prospect',
    address: company.address?.addressStreet1 || '',
    city: company.address?.addressCity || '',
    state: company.address?.addressState || '',
    zip: company.address?.addressPostcode || '',
    website: company.domainName?.primaryLinkUrl || '',
    naics_codes: [],
    tags: [],
    notes: '',
    owner: '',
    created_at: company.createdAt,
    updated_at: company.updatedAt,
    _source: 'twenty',
  };
}

function normalizeContact(person) {
  return {
    id: person.id,
    name: `${person.name?.firstName || ''} ${person.name?.lastName || ''}`.trim(),
    title: person.jobTitle || '',
    company_id: person.company?.id || null,
    email: person.emails?.primaryEmail || '',
    phone: person.phones?.primaryPhoneNumber || '',
    source: 'twenty',
    tags: [],
    notes: '',
    owner: '',
    created_at: person.createdAt,
    updated_at: person.updatedAt,
    _source: 'twenty',
    decisionMakerStatus: inferDecisionMakerFromTitle(person.jobTitle),
    relationshipTemperature: 'cold',
    touchCount: 0,
  };
}

function inferDecisionMakerFromTitle(title) {
  if (!title) return DECISION_MAKER_STATUSES[0];

  const normalizedTitle = title.toLowerCase();
  if (/\b(ceo|coo|cfo|president|owner|principal|vp|director)\b/.test(normalizedTitle)) return 'owner_exec';
  if (/\b(manager|superintendent|supervisor)\b/.test(normalizedTitle)) return 'decision_maker';
  if (/\b(procurement|buyer|purchasing|contracting)\b/.test(normalizedTitle)) return 'procurement';
  if (/\b(assistant|coordinator|specialist|analyst)\b/.test(normalizedTitle)) return 'influencer';
  return DECISION_MAKER_STATUSES[0];
}

function normalizeOpportunity(opportunity) {
  const stageMap = {
    WON: 'awarded',
    LOST: 'lost',
    LEAD: 'lead',
    QUALIFIED: 'qualified',
    MEETING_SCHEDULED: 'qualified',
    PROPOSAL_SENT: 'proposal_sent',
    NEW: 'lead',
    SCREENING: 'qualified',
    MEETING: 'qualified',
    PROPOSAL: 'proposal_sent',
    CUSTOMER: 'awarded',
  };

  const amount = opportunity.amount;
  const estimatedValue = amount?.amountMicros
    ? Number(amount.amountMicros) / 1_000_000
    : (typeof amount === 'number' ? amount : null);

  const resolvedContact = resolveOpportunityContact({
    title: opportunity.name,
    companyName: opportunity.company?.name || '',
    contactId: opportunity.pointOfContact?.id || null,
    contactName: opportunity.pointOfContact?.name
      ? `${opportunity.pointOfContact.name.firstName || ''} ${opportunity.pointOfContact.name.lastName || ''}`.trim()
      : '',
  });

  return {
    id: opportunity.id,
    company_id: opportunity.company?.id || null,
    company_name: opportunity.company?.name || '',
    contact_id: resolvedContact.contact_id,
    contact_name: resolvedContact.contact_name,
    title: opportunity.name || '',
    source: opportunity.source || 'twenty',
    source_ref: opportunity.sourceRef || '',
    type: opportunity.pursuitType || 'bid',
    status: stageMap[opportunity.stage] || opportunity.stage || 'lead',
    stage: opportunity.stage || 'NEW',
    estimated_value: estimatedValue,
    deadline: opportunity.closeDate || null,
    priority: opportunity.priority || 'medium',
    next_action: opportunity.nextAction || '',
    next_action_date: opportunity.nextActionDate || null,
    blocker_status: opportunity.blockerStatus || 'none',
    fit_score: opportunity.fitScore || null,
    strategic_score: opportunity.strategicScore || null,
    proposal_flow_url: buildProposalFlowUrl(opportunity.id),
    notes: '',
    owner: '',
    created_at: opportunity.createdAt,
    updated_at: opportunity.updatedAt,
    _source: 'twenty',
    currentMilestone: inferMilestoneFromStage(opportunity.stage),
    nextMilestone: null,
    relationshipTemperature: 'warm',
    askType: inferAskType(opportunity.pursuitType),
    decisionMakerStatus: 'unknown',
    objectionType: null,
    touchCount: 0,
    lastMeaningfulDate: null,
  };
}

function buildProposalFlowUrl(opportunityId) {
  if (!opportunityId) return '';
  return `/proposal-flow/crm/opportunities/${encodeURIComponent(opportunityId)}`;
}

function resolveOpportunityContact({ title = '', companyName = '', contactId = '', contactName = '' }) {
  const titleLower = String(title).toLowerCase();
  const companyLower = String(companyName).toLowerCase();
  const contactLower = String(contactName).toLowerCase();

  const isMartaJanitorial = titleLower.includes('janitorial') && companyLower.includes('marta');
  const isKnownWrongContact = contactLower.includes('tina phan');

  if (isMartaJanitorial && isKnownWrongContact) {
    return {
      contact_id: 'marta-nora-ray',
      contact_name: 'Nora Ray',
    };
  }

  return {
    contact_id: contactId || null,
    contact_name: contactName || '',
  };
}

function inferMilestoneFromStage(stage) {
  const stageMilestones = {
    NEW: 'identified',
    LEAD: 'identified',
    SCREENING: 'introduced',
    MEETING_SCHEDULED: 'first_conversation',
    MEETING: 'first_conversation',
    QUALIFIED: 'qualified',
    PROPOSAL_SENT: 'concrete_ask_made',
    PROPOSAL: 'concrete_ask_made',
    WON: 'nurture',
    CUSTOMER: 'nurture',
    LOST: 'identified',
  };

  return stageMilestones[stage] || MILESTONES[0];
}

function inferAskType(pursuitType) {
  const askTypeMap = {
    bid: 'proposal',
    rfp: 'proposal',
    rfq: 'quote',
    subcontract: 'vendor_packet',
    registration: 'registration',
    referral: 'referral',
    direct: 'meeting',
  };

  return askTypeMap[pursuitType] || 'information';
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title || '',
    status: task.status || 'open',
    dueDate: task.dueAt || null,
    assignee: task.assignee?.name?.firstName || '',
    body: task.body || '',
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    _source: 'twenty',
  };
}

function normalizeActivity(activity) {
  const targets = activity.noteTargets?.edges?.map((edge) => edge.node) || [];
  const linked = {};

  for (const target of targets) {
    if (target.targetCompany) {
      linked.company = { id: target.targetCompany.id, name: target.targetCompany.name };
    }
    if (target.targetPerson) {
      linked.person = {
        id: target.targetPerson.id,
        name: `${target.targetPerson.name?.firstName || ''} ${target.targetPerson.name?.lastName || ''}`.trim(),
      };
    }
    if (target.targetOpportunity) {
      linked.opportunity = { id: target.targetOpportunity.id, name: target.targetOpportunity.name };
    }
  }

  return {
    id: activity.id,
    title: activity.title || '',
    body: activity.bodyV2?.markdown || activity.body || '',
    type: 'note',
    linked,
    created_at: activity.createdAt,
    _source: 'twenty',
  };
}

export async function createOpportunity({ name, stage = 'NEW', source = 'proposal-flow', sourceRef = '', pursuitType = 'bid', priority = 'medium', closeDate = null, companyId = null }) {
  const data = await runTwentyGraphql(
    `mutation CreateOpportunity($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) {
        id name stage source sourceRef pursuitType priority closeDate createdAt
      }
    }`,
    {
      data: {
        name,
        stage,
        source,
        ...(sourceRef ? { sourceRef } : {}),
        ...(pursuitType ? { pursuitType } : {}),
        ...(priority ? { priority } : {}),
        ...(closeDate ? { closeDate } : {}),
        ...(companyId ? { companyId } : {}),
      },
    },
  ).catch(() => null);
  return data?.createOpportunity || null;
}

export function getStatus() {
  return {
    configured: isTwentyConfigured(),
    baseUrl: getTwentyBase(),
    healthy: cachedHealthy,
    lastCheck: lastHealthCheckAt ? new Date(lastHealthCheckAt).toISOString() : null,
  };
}
