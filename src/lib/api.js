export async function gasGet(fn) {
  const base = import.meta.env.VITE_GAS_URL;
  const u = `${base}?fn=${encodeURIComponent(fn)}`;
  const r = await fetch(u, { method: "GET" });
  if (!r.ok) throw new Error(`GAS ${fn} failed ${r.status}`);
  return r.json();
}
