export async function enqueue(job) {
  const endpoint = import.meta.env.VITE_ENQUEUE_ENDPOINT;
  const token = import.meta.env.VITE_QUEUE_TOKEN;

  if (!endpoint || !token) {
    throw new Error("Missing VITE_ENQUEUE_ENDPOINT or VITE_QUEUE_TOKEN in .env");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Queue-Token": token,
    },
    body: JSON.stringify(job),
  });

  if (!res.ok) {
    throw new Error(`Failed to enqueue: ${res.status} ${res.statusText}`);
  }

  return await res.json();
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
