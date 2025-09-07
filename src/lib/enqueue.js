const ENDPOINT = import.meta.env.VITE_PF_ENDPOINT;   // e.g. https://script.google.com/macros/s/XXXXX/exec
const TOKEN = import.meta.env.VITE_QUEUE_TOKEN;   // must match Apps Script validator

function assertEnv() {
  if (!ENDPOINT) throw new Error("VITE_PF_ENDPOINT missing");
  if (!TOKEN) throw new Error("VITE_QUEUE_TOKEN missing");
}

export async function enqueue(job) {
  assertEnv();
  const payload = Array.isArray(job) ? job : [job];
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Queue-Token': TOKEN,
    },
    body: JSON.stringify(payload),
    mode: 'cors',
    redirect: 'follow',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`enqueue failed: ${res.status} ${res.statusText} ${text}`);
  }

  try {
    return await res.json();
  } catch (e) {
    return await res.text();
  }
}

export async function enqueueJobs(jobs = []) {
  if (!Array.isArray(jobs)) throw new Error("enqueueJobs expects an array");
  return enqueue(jobs);
}

export async function checkConnectivity() {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'HEAD',
      headers: {
        'X-Queue-Token': TOKEN,
      },
      mode: 'cors'
    });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message
    };
  }
}

export default { enqueue, enqueueJobs, checkConnectivity };
