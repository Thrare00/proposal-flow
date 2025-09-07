/**
 * Enqueue one or more jobs to the queue
 * @param {Object|Array} jobs - Single job object or array of job objects
 * @returns {Promise<Object>} Response from the server
 */
export async function enqueue(jobs) {
  const base = import.meta.env.VITE_WEB_APP_URL;
  const token = import.meta.env.VITE_QUEUE_TOKEN;
  
  if (!base || !token) {
    throw new Error("Queue service not configured (VITE_WEB_APP_URL / VITE_QUEUE_TOKEN)");
  }

  // Normalize to array if single job
  const jobsArray = Array.isArray(jobs) ? jobs : [jobs];
  
  try {
    const response = await fetch(base, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-queue-token': token
      },
      body: JSON.stringify(jobsArray)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Queue error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Enqueue error:', error);
    throw new Error(`Failed to enqueue jobs: ${error.message}`);
  }
}

/**
 * Check connectivity to the queue service
 * @returns {Promise<{ok: boolean, status?: number, statusText?: string}>}
 */
export async function checkConnectivity() {
  const base = import.meta.env.VITE_WEB_APP_URL;
  const token = import.meta.env.VITE_QUEUE_TOKEN;

  if (!base || !token) {
    return { ok: false, error: 'Missing configuration' };
  }

  try {
    const response = await fetch(base, {
      method: 'HEAD',
      headers: { 'x-queue-token': token }
    });
    
    return { 
      ok: response.ok, 
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Connectivity check failed:', error);
    return { 
      ok: false, 
      error: error.message,
      status: 0
    };
  }
}
