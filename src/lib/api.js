// Prefer Cloudflare Worker proxy if configured, but support automatic fallback to Apps Script
const GAS_PROXY = import.meta.env.VITE_GAS_PROXY;
const GAS_URL = import.meta.env.VITE_GAS_URL;
const GAS = GAS_PROXY || GAS_URL;
const HEALTH = import.meta.env.VITE_HEALTH_URL || GAS_PROXY || GAS_URL;
const FOLDER = import.meta.env.VITE_REPORTS_FOLDER_ID;

// One-time runtime logging to verify endpoints in the deployed bundle
if (typeof window !== 'undefined' && !window.__PF_ENDPOINTS_LOGGED__) {
  window.__PF_ENDPOINTS_LOGGED__ = true;
  // eslint-disable-next-line no-console
  console.log('[PF] Endpoints:', {
    GAS_PROXY: import.meta.env.VITE_GAS_PROXY || null,
    GAS_URL: import.meta.env.VITE_GAS_URL || null,
    GAS_RESOLVED: GAS,
    HEALTH_RESOLVED: HEALTH,
    QUEUE_URL: (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_QUEUE_URL || null)),
  });
}

async function j(url, opt) { 
  const r = await fetch(url, {
    ...opt,
    credentials: 'omit',
    headers: {
      'Accept': 'application/json',
      ...(opt?.headers || {})
    }
  }); 
  
  const ctype = r.headers.get('content-type') || '';

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`Upstream returned HTML (${r.status}). Snippet: ${text.slice(0, 160)}`);
    }
    // Sometimes upstream sends JSON error with text/plain; try to parse
    try {
      if (text && (ctype.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('['))) {
        const parsed = JSON.parse(text);
        throw new Error(`${r.status} ${r.statusText} — ${JSON.stringify(parsed).slice(0, 200)}`);
      }
    } catch {}
    throw new Error(`${r.status} ${r.statusText} — ${text.slice(0, 200)}`);
  }
  
  // Try JSON first
  if (ctype.includes('json')) {
    return await r.json();
  }
  // Fallback: parse text that looks like JSON (guards against wrong content-type)
  const text = await r.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch {}
  }
  // Surface a helpful error if still not JSON
  throw new Error(`Failed to parse JSON response. Content-Type: ${ctype || 'n/a'}. Snippet: ${trimmed.slice(0, 200)}`);
}

// Try multiple candidate URLs in order until one yields valid JSON
async function jTry(urls, opt) {
  let lastErr;
  for (const u of urls.filter(Boolean)) {
    try {
      return await j(u, opt);
    } catch (e) {
      lastErr = e;
      // continue to next candidate
    }
  }
  throw lastErr || new Error('No valid endpoints configured');
}

export async function withRetry(fn, tries = 3, delay = 600) {
  let last;
  for (let i = 0; i < tries; i++) { 
    try { 
      return await fn(); 
    } catch (e) { 
      last = e; 
      if (i < tries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
    }
  }
  throw last;
}

export async function getHealth() { 
  const urls = [
    HEALTH && `${HEALTH}?fn=getHealth`,
    GAS_URL && `${GAS_URL}?fn=getHealth`,
  ];
  return withRetry(() => jTry(urls));
}

export async function getCadence() { 
  const urls = [
    GAS_PROXY && `${GAS_PROXY}?fn=getCadence`,
    GAS_URL && `${GAS_URL}?fn=getCadence`,
  ];
  return withRetry(() => jTry(urls));
}

export async function setCadence(payload) {
  const urls = [
    GAS_PROXY && `${GAS_PROXY}?fn=setCadence`,
    GAS_URL && `${GAS_URL}?fn=setCadence`,
  ];
  return withRetry(() => jTry(urls, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }));
}

export async function getReports() { 
  if (!FOLDER) throw new Error('Missing VITE_REPORTS_FOLDER_ID');
  const urls = [
    GAS_URL && `${GAS_URL}?fn=getReports&folderId=${encodeURIComponent(FOLDER)}`,
    GAS_PROXY && `${GAS_PROXY}?fn=getReports&folderId=${encodeURIComponent(FOLDER)}`,
  ];
  return withRetry(() => jTry(urls));
}

// Opportunities (Manus intake)
export async function getOpportunities() {
  const urls = [
    GAS_PROXY && `${GAS_PROXY}?fn=getOpportunities`,
    GAS_URL && `${GAS_URL}?fn=getOpportunities`,
  ];
  const data = await withRetry(() => jTry(urls));
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.opportunities)) return data.opportunities;
  return [];
}

// Backward compatibility
export async function gasGet(fn) {
  const urls = [
    GAS_PROXY && `${GAS_PROXY}?fn=${encodeURIComponent(fn)}`,
    GAS_URL && `${GAS_URL}?fn=${encodeURIComponent(fn)}`,
  ];
  return withRetry(() => jTry(urls));
}
