import { buildApiUrl, isLocalRuntime } from './runtimeApi.js';

const GAS_PROXY = import.meta.env.VITE_GAS_PROXY;
const GAS_URL = import.meta.env.VITE_GAS_URL;
const HEALTH = import.meta.env.VITE_HEALTH_URL || GAS_PROXY || GAS_URL;
const FOLDER = import.meta.env.VITE_REPORTS_FOLDER_ID;
const QUEUE_TOKEN = import.meta.env.VITE_QUEUE_TOKEN || 'local-dev-token';

function localAutomationUrl(fn, query = '') {
  const suffix = query ? `&${query}` : '';
  return `${buildApiUrl('/automation')}?fn=${fn}${suffix}`;
}

async function requestJson(url, options) {
  const response = await fetch(url, {
    ...options,
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      ...(options?.headers || {}),
    },
  });

  const ctype = response.headers.get('content-type') || '';
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText} - ${text.slice(0, 200)}`);
  }

  if (ctype.includes('json')) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function firstSuccess(urls, options) {
  let lastError = null;
  for (const url of urls.filter(Boolean)) {
    try {
      return await requestJson(url, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No valid endpoints configured');
}

export async function withRetry(fn, tries = 3, delay = 400) {
  let lastError = null;
  for (let index = 0; index < tries; index += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (index < tries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (index + 1)));
      }
    }
  }
  throw lastError;
}

export async function getHealth() {
  const urls = [];
  if (isLocalRuntime()) {
    urls.push(localAutomationUrl('getHealth'));
  }
  urls.push(HEALTH && `${HEALTH}?fn=getHealth`);
  urls.push(GAS_URL && `${GAS_URL}?fn=getHealth`);
  return withRetry(() => firstSuccess(urls));
}

export async function getCadence() {
  const urls = [];
  if (isLocalRuntime()) {
    urls.push(localAutomationUrl('getCadence'));
  }
  urls.push(GAS_PROXY && `${GAS_PROXY}?fn=getCadence`);
  urls.push(GAS_URL && `${GAS_URL}?fn=getCadence`);
  return withRetry(() => firstSuccess(urls));
}

export async function setCadence(payload) {
  const urls = [];
  if (isLocalRuntime()) {
    urls.push(localAutomationUrl('setCadence'));
  }
  urls.push(GAS_PROXY && `${GAS_PROXY}?fn=setCadence`);
  urls.push(GAS_URL && `${GAS_URL}?fn=setCadence`);
  return withRetry(() => firstSuccess(urls, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}

export async function getJobs(statusFilter) {
  const qs = statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : '';
  return withRetry(() => firstSuccess([localAutomationUrl('getJobs', `limit=50${qs}`)]));
}

export async function getReports() {
  const urls = [];
  if (isLocalRuntime()) {
    urls.push(localAutomationUrl('getReports'));
  }
  if (FOLDER) {
    urls.push(GAS_URL && `${GAS_URL}?fn=getReports&folderId=${encodeURIComponent(FOLDER)}`);
    urls.push(GAS_PROXY && `${GAS_PROXY}?fn=getReports&folderId=${encodeURIComponent(FOLDER)}`);
  }
  return withRetry(() => firstSuccess(urls));
}

export async function getOpportunities() {
  const urls = [];
  if (isLocalRuntime()) {
    urls.push(localAutomationUrl('getOpportunities'));
  }
  urls.push(GAS_PROXY && `${GAS_PROXY}?fn=getOpportunities`);
  urls.push(GAS_URL && `${GAS_URL}?fn=getOpportunities`);
  const data = await withRetry(() => firstSuccess(urls));
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.opportunities)) {
    return data.opportunities;
  }
  return [];
}

// Fire the full intake pipeline: solicitation → proposal + checklist + overview
// Returns { ok, jobId, message } immediately (202 Accepted); pipeline runs async.
// Poll GET /proposals to see the new record appear.
export async function captureOpportunity(payload) {
  if (!isLocalRuntime()) {
    throw new Error('captureOpportunity requires local server runtime');
  }
  return requestJson(buildApiUrl('/capture'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ── Capture Records ────────────────────────────────────────────────────────────
export async function getCaptureRecords() {
  if (!isLocalRuntime()) return [];
  try {
    const data = await requestJson(buildApiUrl('/capture-records'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createCaptureRecordApi(payload) {
  if (!isLocalRuntime()) throw new Error('createCaptureRecord requires local server runtime');
  return requestJson(buildApiUrl('/capture-records'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateCaptureRecordApi(id, patch) {
  if (!isLocalRuntime()) throw new Error('updateCaptureRecord requires local server runtime');
  return requestJson(buildApiUrl(`/capture-records/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export async function deleteCaptureRecordApi(id) {
  if (!isLocalRuntime()) throw new Error('deleteCaptureRecord requires local server runtime');
  return fetch(buildApiUrl(`/capture-records/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    credentials: 'omit',
  });
}

// ── Knowledge Items ────────────────────────────────────────────────────────────
export async function getKnowledgeItems() {
  if (!isLocalRuntime()) return [];
  try {
    const data = await requestJson(buildApiUrl('/knowledge-items'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createKnowledgeItemApi(payload) {
  if (!isLocalRuntime()) throw new Error('createKnowledgeItem requires local server runtime');
  return requestJson(buildApiUrl('/knowledge-items'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteKnowledgeItemApi(id) {
  if (!isLocalRuntime()) throw new Error('deleteKnowledgeItem requires local server runtime');
  return fetch(buildApiUrl(`/knowledge-items/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    credentials: 'omit',
  });
}

// ── Operator Updates (hourly cadence) ─────────────────────────────────────────
export async function getOperatorUpdates({ limit = 50, since } = {}) {
  if (!isLocalRuntime()) return { updates: [], summary: {} };
  const qs = new URLSearchParams();
  if (limit) qs.set('limit', limit);
  if (since) qs.set('since', since);
  return requestJson(`${buildApiUrl('/operator-updates')}?${qs}`);
}

export async function postOperatorUpdate(payload) {
  if (!isLocalRuntime()) throw new Error('postOperatorUpdate requires local server runtime');
  return requestJson(buildApiUrl('/operator-updates'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function resolveOperatorBlocked(updateId, blockedText) {
  if (!isLocalRuntime()) throw new Error('resolveOperatorBlocked requires local server runtime');
  return requestJson(buildApiUrl(`/operator-updates/${encodeURIComponent(updateId)}/resolve`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockedText }),
  });
}

export async function getCronStatus() {
  if (!isLocalRuntime()) return null;
  return requestJson(buildApiUrl('/cron-status'));
}

export async function getStageReadiness(proposalId) {
  if (!isLocalRuntime()) return null;
  return requestJson(buildApiUrl(`/proposals/${encodeURIComponent(proposalId)}/stage-readiness`));
}

// Force an immediate SAM.gov amendment re-check across active, tracked
// proposals. Returns { ok, checked, alerted } (or skipped:'no_api_key' when
// SAM_API_KEY isn't configured server-side).
export async function checkAmendments() {
  if (!isLocalRuntime()) throw new Error('checkAmendments requires local server runtime');
  return requestJson(buildApiUrl('/proposals/check-amendments'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function gasGet(fn) {
  const urls = [];
  if (isLocalRuntime()) {
    urls.push(localAutomationUrl(encodeURIComponent(fn)));
  }
  urls.push(GAS_PROXY && `${GAS_PROXY}?fn=${encodeURIComponent(fn)}`);
  urls.push(GAS_URL && `${GAS_URL}?fn=${encodeURIComponent(fn)}`);
  return withRetry(() => firstSuccess(urls));
}

function crmExecutionPath({ opportunityId, companyId } = {}) {
  if (opportunityId) {
    return buildApiUrl(`/crm/opportunities/${encodeURIComponent(opportunityId)}/execution`);
  }

  if (companyId) {
    return buildApiUrl(`/crm/companies/${encodeURIComponent(companyId)}/execution`);
  }

  return buildApiUrl('/crm/execution');
}

async function requestCrmExecution(payload, target = {}) {
  if (!isLocalRuntime()) {
    throw new Error('Twenty execution requires local server runtime');
  }

  return requestJson(crmExecutionPath(target), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Queue-Token': QUEUE_TOKEN,
    },
    body: JSON.stringify(payload),
  });
}

export async function previewTwentyExecution(payload, target = {}) {
  return requestCrmExecution({
    ...(payload || {}),
    dryRun: true,
  }, target);
}

export async function runTwentyExecution(payload, target = {}) {
  return requestCrmExecution(payload || {}, target);
}

export async function getTwentyExecutionStatus() {
  if (!isLocalRuntime()) {
    throw new Error('Twenty execution status requires local server runtime');
  }

  return requestJson(buildApiUrl('/crm/execution/status'), {
    headers: {
      'X-Queue-Token': QUEUE_TOKEN,
    },
  });
}
