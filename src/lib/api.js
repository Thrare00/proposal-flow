// Prefer Cloudflare Worker proxy if configured
const GAS_PROXY = import.meta.env.VITE_GAS_PROXY;
const GAS = GAS_PROXY || import.meta.env.VITE_GAS_URL;
const HEALTH = import.meta.env.VITE_HEALTH_URL || GAS_PROXY || import.meta.env.VITE_GAS_URL;
const FOLDER = import.meta.env.VITE_REPORTS_FOLDER_ID;

// One-time runtime logging to verify endpoints in the deployed bundle
if (typeof window !== 'undefined' && !window.__PF_ENDPOINTS_LOGGED__) {
  window.__PF_ENDPOINTS_LOGGED__ = true;
  // eslint-disable-next-line no-console
  console.log('[PF] Endpoints:', {
    GAS_PROXY: import.meta.env.VITE_GAS_PROXY || null,
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
  
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('Server returned HTML instead of JSON. Check if the endpoint URL is correct.');
    }
    throw new Error(`${r.status} ${r.statusText} — ${text.slice(0, 200)}`);
  }
  
  try {
    return await r.json();
  } catch (e) {
    throw new Error('Failed to parse JSON response');
  }
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
  if (!HEALTH) throw new Error('Missing VITE_HEALTH_URL/VITE_GAS_URL');
  return withRetry(() => j(`${HEALTH}?fn=getHealth`));
}

export async function getCadence() { 
  if (!GAS) throw new Error('Missing VITE_GAS_URL');
  return withRetry(() => j(`${GAS}?fn=getCadence`));
}

export async function setCadence(payload) {
  if (!GAS) throw new Error('Missing VITE_GAS_URL');
  return withRetry(() => j(
    `${GAS}?fn=setCadence`, 
    { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    }
  ));
}

export async function getReports() { 
  if (!GAS || !FOLDER) throw new Error('Missing VITE_GAS_URL or VITE_REPORTS_FOLDER_ID');
  return withRetry(() => j(`${GAS}?fn=getReports&folderId=${encodeURIComponent(FOLDER)}`));
}

// Backward compatibility
export async function gasGet(fn) {
  return withRetry(() => j(`${GAS}?fn=${encodeURIComponent(fn)}`));
}
