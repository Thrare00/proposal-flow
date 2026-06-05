import { buildApiUrl, isLocalRuntime } from './runtimeApi.js';

function getEnvVar(name, defaultValue = '') {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name] || defaultValue;
  }
  return defaultValue;
}

const REMOTE_QUEUE_URL = getEnvVar('VITE_QUEUE_URL')
  || getEnvVar('VITE_GAS_PROXY')
  || getEnvVar('VITE_ENQUEUE_ENDPOINT');
const QUEUE_TOKEN = getEnvVar('VITE_QUEUE_TOKEN') || 'local-dev-token';

function getQueueCandidates() {
  const candidates = [];

  if (isLocalRuntime()) {
    candidates.push(buildApiUrl('/automation'));
  }

  if (REMOTE_QUEUE_URL) {
    candidates.push(REMOTE_QUEUE_URL.replace(/\/$/, ''));
  }

  return [...new Set(candidates.filter(Boolean))];
}

async function fetchQueue(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Queue-Token': QUEUE_TOKEN,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`enqueue failed ${response.status}: ${text || response.statusText}`);
  }

  return response.json().catch(() => ({}));
}

export async function enqueue(jobOrArray) {
  if (typeof window === 'undefined') {
    return { id: 'build-skip', status: 'skipped' };
  }

  const jobs = Array.isArray(jobOrArray) ? jobOrArray : [jobOrArray];
  const urls = getQueueCandidates().map((baseUrl) => `${baseUrl}?fn=enqueue`);

  let lastError = null;
  for (const url of urls) {
    try {
      return await fetchQueue(url, {
        method: 'POST',
        body: JSON.stringify({ jobs }),
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Queue endpoint not configured');
}

export async function enqueueJobs(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error('enqueueJobs expects an array of jobs');
  }

  return enqueue(jobs);
}

export async function checkConnectivity() {
  if (typeof window === 'undefined') {
    return {
      connected: true,
      status: 'skipped',
      message: 'Skipping connectivity check during build',
    };
  }

  const urls = getQueueCandidates().map((baseUrl) => `${baseUrl}?fn=getHealth`);
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-Queue-Token': QUEUE_TOKEN },
      });

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    status: 0,
    statusText: lastError?.message || 'Unknown connectivity error',
    lastChecked: new Date().toISOString(),
  };
}
