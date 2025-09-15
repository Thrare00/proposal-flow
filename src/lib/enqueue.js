const QUEUE_URL = import.meta.env.VITE_QUEUE_URL || import.meta.env.VITE_ENQUEUE_ENDPOINT;
const QUEUE_TOKEN = import.meta.env.VITE_QUEUE_TOKEN;

export async function enqueue(jobOrArray) {
  if (!QUEUE_URL) throw new Error('Missing VITE_QUEUE_URL or VITE_ENQUEUE_ENDPOINT in environment variables');
  if (!QUEUE_TOKEN) throw new Error('Missing VITE_QUEUE_TOKEN in environment variables');
  
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
  const endpoint = import.meta.env.VITE_ENQUEUE_ENDPOINT;
  const token = import.meta.env.VITE_QUEUE_TOKEN;

  if (!endpoint) {
    return {
      ok: false,
      status: 0,
      statusText: "No endpoint configured"
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'HEAD',
      headers: token ? { 'X-Queue-Token': token } : {}
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
