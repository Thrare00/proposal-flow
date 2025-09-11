export async function gasGet(fn) {
  const base = import.meta.env.VITE_GAS_URL;
  const u = `${base}?fn=${encodeURIComponent(fn)}`;
  const r = await fetch(u, { method: "GET" });
  if (!r.ok) throw new Error(`GAS ${fn} failed ${r.status}`);
  return r.json();
}

export async function fetchHealth() {
  try {
    const res = await fetch(import.meta.env.VITE_HEALTH_URL || '/health.json', { 
      cache: 'no-store' 
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
