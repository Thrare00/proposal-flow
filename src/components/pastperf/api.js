// Server API client for Past Performance records.
// Mirrors the request/error conventions used in src/lib/api.js (requestJson):
// credentials: 'omit', Accept: application/json, throw on !response.ok with
// status + short body text, JSON-first response parsing.
import { buildApiUrl } from '../../lib/runtimeApi.js';

const BASE_URL = buildApiUrl('/past-performance');

async function requestJson(url, options) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch (networkError) {
    throw new Error(`Could not reach the server: ${networkError.message}`);
  }

  const ctype = response.headers.get('content-type') || '';

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}${text ? ` - ${text.slice(0, 200)}` : ''}`);
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

export async function getPastPerformanceRecords() {
  const data = await requestJson(BASE_URL);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.items)) return data.items;
  throw new Error('Unexpected response shape from past-performance API');
}

export async function createPastPerformanceRecord(payload) {
  return requestJson(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updatePastPerformanceRecord(id, patch) {
  return requestJson(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export async function deletePastPerformanceRecord(id) {
  return requestJson(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
