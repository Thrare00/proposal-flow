/**
 * CRM Bridge - Unified read access across Twenty CRM and the legacy CRM.
 *
 * Read flow:
 *   1. Try Twenty first when configured and healthy.
 *   2. Fall back to the legacy CRM when Twenty is unavailable.
 *   3. Tag every returned record with `_source`.
 */

import * as twenty from './twenty-client.js';
import {
  computeUrgencyState,
  isMeaningfulActivity,
  nextMilestoneAfter,
  buildEscalation,
  PRESSURE_THRESHOLDS,
} from './growth-constants.js';

const LEGACY_CRM = process.env.LEGACY_CRM_URL || 'http://localhost:5180';
const TIMEOUT_MS = 5000;

async function legacyFetch(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${LEGACY_CRM}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timer);
    if (!response.ok) {
      console.warn(`[crm-bridge] legacy fetch failed for ${path}: HTTP ${response.status}`);
      return null;
    }
    return response.json();
  } catch (error) {
    clearTimeout(timer);
    console.warn(`[crm-bridge] legacy fetch failed for ${path}: ${error?.message || 'unknown error'}`);
    return null;
  }
}

function tagLegacy(records) {
  if (!Array.isArray(records)) return [];

  return records.map((record) => ({
    ...record,
    _source: 'legacy_crm',
    currentMilestone: record.currentMilestone || record.milestone || 'identified',
    relationshipTemperature: record.relationshipTemperature || 'warm',
    decisionMakerStatus: record.decisionMakerStatus || 'unknown',
    askType: record.askType || 'information',
    objectionType: record.objectionType || null,
    touchCount: record.touchCount || record.touch_count || 0,
    lastMeaningfulDate: record.lastMeaningfulDate || record.last_meaningful_date || null,
  }));
}

function normalizeLegacyTask(record) {
  return {
    id: record.id,
    title: record.title || '',
    status: record.status === 'completed' ? 'DONE' : record.status === 'in_progress' ? 'IN_PROGRESS' : 'TODO',
    dueDate: record.next_action_date || record.end_date || record.start_date || null,
    assignee: record.owner || '',
    body: record.notes || record.next_action || '',
    created_at: record.created_at || null,
    updated_at: record.updated_at || null,
    _source: 'legacy_crm',
  };
}

async function bridgeRead(twentyReader, legacyPath, { legacyTransform = tagLegacy } = {}) {
  const twentyHealthy = await twenty.isHealthy();
  if (twentyHealthy) {
    try {
      const twentyData = await twentyReader();
      if (twentyData !== null) {
        return { data: twentyData, source: 'twenty', fallback: false };
      }
      console.warn(`[crm-bridge] Twenty returned null for ${legacyPath}; attempting legacy fallback`);
    } catch (error) {
      console.warn(`[crm-bridge] Twenty read failed for ${legacyPath}: ${error?.message || 'unknown error'}`);
    }
  }

  const legacyData = await legacyFetch(legacyPath);
  if (legacyData !== null) {
    const records = Array.isArray(legacyData) ? legacyData : legacyData.data || [];
    return { data: legacyTransform(records), source: 'legacy_crm', fallback: true };
  }

  return { data: [], source: 'none', fallback: true };
}

export async function getCompanies() {
  return bridgeRead(() => twenty.getCompanies(), '/companies');
}

export async function getContacts() {
  return bridgeRead(() => twenty.getContacts(), '/contacts');
}

export async function getOpportunities() {
  return bridgeRead(() => twenty.getOpportunities(), '/opportunities');
}

export async function getTasks() {
  return bridgeRead(() => twenty.getTasks(), '/jobs', { legacyTransform: (records) => records.map(normalizeLegacyTask) });
}

export async function getActivities() {
  return bridgeRead(() => twenty.getActivities(), '/activity/recent');
}

export async function getDashboard() {
  const now = new Date();
  const [opportunities, tasks, activities] = await Promise.all([
    getOpportunities(),
    getTasks(),
    getActivities(),
  ]);

  const opportunityList = opportunities.data || [];
  const taskList = tasks.data || [];
  const activityList = activities.data || [];

  const meaningfulActivities = activityList.filter((activity) => isMeaningfulActivity(activity));
  const lastMeaningfulByOpportunity = {};
  const lastMeaningfulByCompany = {};

  for (const activity of meaningfulActivities) {
    const opportunityId = activity.linked?.opportunity?.id;
    const companyId = activity.linked?.company?.id;

    if (opportunityId && activity.created_at) {
      if (!lastMeaningfulByOpportunity[opportunityId] || activity.created_at > lastMeaningfulByOpportunity[opportunityId]) {
        lastMeaningfulByOpportunity[opportunityId] = activity.created_at;
      }
    }

    if (companyId && activity.created_at) {
      if (!lastMeaningfulByCompany[companyId] || activity.created_at > lastMeaningfulByCompany[companyId]) {
        lastMeaningfulByCompany[companyId] = activity.created_at;
      }
    }
  }

  const enrichedOpportunities = opportunityList.map((opportunity) => {
    const lastMeaningful = lastMeaningfulByOpportunity[opportunity.id]
      || lastMeaningfulByCompany[opportunity.company_id]
      || opportunity.lastMeaningfulDate
      || opportunity.updated_at
      || null;

    const currentMilestone = opportunity.currentMilestone || 'identified';
    const urgencyState = computeUrgencyState(lastMeaningful, currentMilestone);

    return {
      ...opportunity,
      currentMilestone,
      nextMilestone: nextMilestoneAfter(currentMilestone),
      urgencyState,
      lastMeaningfulDate: lastMeaningful,
      relationshipTemperature: opportunity.relationshipTemperature || 'warm',
      askType: opportunity.askType || 'information',
      decisionMakerStatus: opportunity.decisionMakerStatus || 'unknown',
      objectionType: opportunity.objectionType || null,
      touchCount: opportunity.touchCount || 0,
    };
  });

  const closestToCash = enrichedOpportunities
    .filter((opportunity) => opportunity.estimated_value > 0 && opportunity.deadline)
    .sort((left, right) => new Date(left.deadline) - new Date(right.deadline))
    .slice(0, 10)
    .map((opportunity) => ({
      title: opportunity.title,
      value: opportunity.estimated_value,
      deadline: opportunity.deadline,
      stage: opportunity.stage,
      company: opportunity.company_name,
      contact: opportunity.contact_name,
      priority: opportunity.priority,
      daysOut: Math.ceil((new Date(opportunity.deadline) - now) / 86400000),
      urgencyState: opportunity.urgencyState,
      currentMilestone: opportunity.currentMilestone,
      nextMilestone: opportunity.nextMilestone,
      relationshipTemperature: opportunity.relationshipTemperature,
      askType: opportunity.askType,
      decisionMakerStatus: opportunity.decisionMakerStatus,
    }));

  const blocked = enrichedOpportunities
    .filter((opportunity) => opportunity.blocker_status && opportunity.blocker_status !== 'none')
    .map((opportunity) => ({
      title: opportunity.title,
      blocker: opportunity.blocker_status,
      company: opportunity.company_name,
      value: opportunity.estimated_value,
      urgencyState: opportunity.urgencyState,
    }));

  const overdue = taskList
    .filter((task) => task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < now)
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .map((task) => ({
      title: task.title,
      dueDate: task.dueDate,
      status: task.status,
      daysOverdue: Math.ceil((now - new Date(task.dueDate)) / 86400000),
    }));

  const weekOut = new Date(now.getTime() + 7 * 86400000);
  const dueThisWeek = taskList
    .filter((task) => task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) >= now && new Date(task.dueDate) <= weekOut)
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .map((task) => ({
      title: task.title,
      dueDate: task.dueDate,
      status: task.status,
    }));

  const urgentActions = enrichedOpportunities
    .filter((opportunity) => opportunity.priority === 'urgent' || opportunity.priority === 'high' || opportunity.urgencyState === 'hot')
    .filter((opportunity) => opportunity.next_action)
    .sort((left, right) => new Date(left.next_action_date || '9999-12-31') - new Date(right.next_action_date || '9999-12-31'))
    .map((opportunity) => ({
      title: opportunity.title,
      nextAction: opportunity.next_action,
      nextActionDate: opportunity.next_action_date,
      company: opportunity.company_name,
      priority: opportunity.priority,
      urgencyState: opportunity.urgencyState,
      currentMilestone: opportunity.currentMilestone,
    }));

  const pipelineByStage = {};
  const totalValue = enrichedOpportunities.reduce((sum, opportunity) => sum + (opportunity.estimated_value || 0), 0);
  for (const opportunity of enrichedOpportunities) {
    const stage = opportunity.stage || 'UNKNOWN';
    if (!pipelineByStage[stage]) {
      pipelineByStage[stage] = { count: 0, value: 0 };
    }
    pipelineByStage[stage].count += 1;
    pipelineByStage[stage].value += opportunity.estimated_value || 0;
  }

  const recentActivity = activityList.slice(0, 10).map((activity) => ({
    title: activity.title,
    date: activity.created_at,
    linked: activity.linked,
    meaningful: isMeaningfulActivity(activity),
  }));

  const byUrgency = { hot: 0, watch: 0, warning: 0, stale: 0 };
  for (const opportunity of enrichedOpportunities) {
    if (Object.hasOwn(byUrgency, opportunity.urgencyState)) {
      byUrgency[opportunity.urgencyState] += 1;
    }
  }

  const escalations = enrichedOpportunities
    .filter((opportunity) => (
      opportunity.urgencyState === 'stale'
      || (opportunity.urgencyState === 'warning' && opportunity.estimated_value > 50000)
      || (opportunity.blocker_status && opportunity.blocker_status !== 'none')
    ))
    .map((opportunity) => buildEscalation({
      who: opportunity.company_name,
      account: opportunity.company_name,
      contact: opportunity.contact_name,
      whyCritical: opportunity.blocker_status && opportunity.blocker_status !== 'none'
        ? `Blocked: ${opportunity.blocker_status}`
        : opportunity.urgencyState === 'stale'
          ? `No meaningful activity for ${PRESSURE_THRESHOLDS.stale}+ days`
          : `High-value opp ($${opportunity.estimated_value}) at warning urgency`,
      nextAction: opportunity.next_action || `Re-engage ${opportunity.contact_name || opportunity.company_name}`,
      owner: opportunity.owner || 'unassigned',
      deadline: opportunity.next_action_date || opportunity.deadline,
      desiredOutcome: opportunity.blocker_status && opportunity.blocker_status !== 'none'
        ? `Unblock: resolve ${opportunity.blocker_status}`
        : `Move from ${opportunity.currentMilestone} to ${opportunity.nextMilestone || 'next milestone'}`,
    }));

  const reviveCandidates = enrichedOpportunities
    .filter((opportunity) => opportunity.urgencyState === 'stale' && opportunity.estimated_value > 0)
    .map((opportunity) => ({
      title: opportunity.title,
      company: opportunity.company_name,
      value: opportunity.estimated_value,
      currentMilestone: opportunity.currentMilestone,
      lastMeaningfulDate: opportunity.lastMeaningfulDate,
      suggestedReviveDate: new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10),
    }));

  return {
    generated: now.toISOString(),
    pipeline: {
      totalValue,
      count: enrichedOpportunities.length,
      byStage: pipelineByStage,
    },
    closestToCash,
    blocked,
    overdue,
    dueThisWeek,
    urgentActions,
    recentActivity,
    taskSummary: {
      total: taskList.length,
      todo: taskList.filter((task) => task.status === 'TODO' || task.status === 'open').length,
      inProgress: taskList.filter((task) => task.status === 'IN_PROGRESS').length,
      done: taskList.filter((task) => task.status === 'DONE').length,
      overdue: overdue.length,
    },
    growthPressure: {
      byUrgency,
      meaningfulActivityCount: meaningfulActivities.length,
      totalActivityCount: activityList.length,
      thresholds: PRESSURE_THRESHOLDS,
    },
    escalations,
    reviveCandidates,
  };
}

export async function getIntegrationStatus() {
  const twentyHealthy = await twenty.isHealthy();
  const twentyStatus = twenty.getStatus();

  let legacyHealthy = false;
  try {
    const legacyHealth = await legacyFetch('/health');
    legacyHealthy = legacyHealth?.status === 'ok';
  } catch {
    legacyHealthy = false;
  }

  const twentyConfigured = twentyStatus.configured || twentyHealthy;

  return {
    twenty: {
      configured: twentyConfigured,
      healthy: twentyHealthy,
      url: twentyStatus.baseUrl,
      lastCheck: twentyStatus.lastCheck,
      note: twentyConfigured
        ? (twentyHealthy ? 'Connected and healthy' : 'Configured but not reachable')
        : 'Not configured (TWENTY_API_TOKEN not set)',
    },
    legacy_crm: {
      healthy: legacyHealthy,
      url: LEGACY_CRM,
      note: legacyHealthy ? 'Connected and healthy' : 'Not reachable',
    },
    bridge: {
      version: '1.1.0',
      mode: 'read-through',
      activeSource: twentyHealthy ? 'twenty' : (legacyHealthy ? 'legacy_crm' : 'none'),
      entities: {
        companies: { bridged: true, source: twentyHealthy ? 'twenty' : 'legacy_crm' },
        contacts: { bridged: true, source: twentyHealthy ? 'twenty' : 'legacy_crm' },
        opportunities: { bridged: true, source: twentyHealthy ? 'twenty' : 'legacy_crm' },
        tasks: { bridged: true, source: twentyHealthy ? 'twenty' : 'legacy_crm' },
        activities: { bridged: true, source: twentyHealthy ? 'twenty' : 'legacy_crm' },
        invoices: { bridged: false, source: 'legacy_crm', note: 'Stays in legacy CRM' },
        collections: { bridged: false, source: 'legacy_crm', note: 'Stays in legacy CRM' },
        finance: { bridged: false, source: 'legacy_crm', note: 'Stays in legacy CRM' },
      },
    },
    execution: {
      enabled: twentyConfigured,
      healthy: twentyHealthy,
      mode: twentyConfigured ? 'queue-backed writes' : 'disabled',
      supportedOperations: [
        'opportunity.update',
        'task.create',
        'note.create',
      ],
      routes: [
        '/proposal-flow/api/crm/execution',
        '/proposal-flow/api/crm/opportunities/:opportunityId/execution',
        '/proposal-flow/api/crm/companies/:companyId/execution',
      ],
    },
  };
}
