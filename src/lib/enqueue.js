// Use a function to safely get environment variables that works during both build and runtime
function getEnvVar(name, defaultValue = '') {
  // During build, import.meta.env is not available
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return process.env[name] || defaultValue;
  }
  return import.meta.env[name] || process.env[name] || defaultValue;
}

const QUEUE_URL = getEnvVar('VITE_QUEUE_URL') || getEnvVar('VITE_ENQUEUE_ENDPOINT');
const QUEUE_TOKEN = getEnvVar('VITE_QUEUE_TOKEN');

export async function enqueue(jobOrArray) {
  if (typeof window === 'undefined') {
    // Skip during SSR/build
    return { id: 'build-skip', status: 'skipped' };
  }

  if (!QUEUE_URL) {
    console.warn('Missing VITE_QUEUE_URL or VITE_ENQUEUE_ENDPOINT in environment variables');
    return { id: 'no-queue-url', status: 'error', error: 'Queue URL not configured' };
  }
  
  if (!QUEUE_TOKEN) {
    console.warn('Missing VITE_QUEUE_TOKEN in environment variables');
    return { id: 'no-queue-token', status: 'error', error: 'Queue token not configured' };
  }
  
  const jobs = Array.isArray(jobOrArray) ? jobOrArray : [jobOrArray];
  const url = `${QUEUE_URL}?fn=enqueue`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Queue-Token': QUEUE_TOKEN 
      },
      body: JSON.stringify({ jobs })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`enqueue failed ${res.status}: ${text || res.statusText}`);
    }
    
    return await res.json().catch(() => ({}));
  } catch (error) {
    if (error.message.includes('<!DOCTYPE')) {
      throw new Error('Server returned HTML instead of JSON. Check if the endpoint URL is correct.');
    }
    throw error;
  }
}

// Plural helper for batching multiple jobs
export async function enqueueJobs(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error("enqueueJobs expects an array of jobs");
  }

  const results = [];
  for (const job of jobs) {
    results.push(await enqueue(job));
  }
  return results;
}

/**
 * Check connectivity to the enqueue endpoint
 * @returns {Promise<Object>} Object with connection status
 */
export async function checkConnectivity() {
  if (typeof window === 'undefined') {
    // Skip during SSR/build
    return {
      connected: true,
      status: 'skipped',
      message: 'Skipping connectivity check during build'
    };
  }

  if (!QUEUE_URL) {
    return {
      connected: false,
      status: 'error',
      error: 'Missing VITE_QUEUE_URL or VITE_ENQUEUE_ENDPOINT in environment variables',
    };
  }

  if (!QUEUE_TOKEN) {
    return {
      connected: false,
      status: 'error',
      error: 'Missing VITE_QUEUE_TOKEN in environment variables',
    };
  }

  try {
    const response = await fetch(QUEUE_URL, {
      method: 'HEAD',
      headers: QUEUE_TOKEN ? { 'X-Queue-Token': QUEUE_TOKEN } : {}
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}
