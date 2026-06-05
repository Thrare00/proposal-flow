import { useCallback, useEffect, useState } from 'react';
import { buildApiUrl } from '../lib/runtimeApi.js';
import { getOperatorUpdates, postOperatorUpdate, resolveOperatorBlocked, getCronStatus } from '../lib/api.js';

/* ── tiny helpers ─────────────────────────────────────────────────────────── */

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function hourLabel(hourStr) {
  // hourStr = "2026-06-05T14"
  try {
    const d = new Date(hourStr + ':00:00Z');
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return hourStr;
  }
}

function itemText(item) {
  return typeof item === 'string' ? item : item.text || JSON.stringify(item);
}

/* ── badge ────────────────────────────────────────────────────────────────── */

function Badge({ label, color = 'slate' }) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber:   'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    red:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    blue:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    slate:   'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.slate}`}>
      {label}
    </span>
  );
}

/* ── section wrapper ──────────────────────────────────────────────────────── */

function Section({ title, count, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel rounded-xl border border-white/30 dark:border-slate-700/40 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          {icon} {title}
          {typeof count === 'number' && (
            <span className="ml-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </span>
        <span className="text-slate-400">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

/* ── quick post form ──────────────────────────────────────────────────────── */

function QuickPostForm({ onPosted }) {
  const [done, setDone] = useState('');
  const [queued, setQueued] = useState('');
  const [blocked, setBlocked] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const toArr = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
    setPosting(true);
    try {
      await postOperatorUpdate({
        done: toArr(done),
        queued: toArr(queued),
        blocked: toArr(blocked),
        source: 'manual',
      });
      setDone('');
      setQueued('');
      setBlocked('');
      onPosted?.();
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-panel rounded-xl border border-white/30 dark:border-slate-700/40 p-5 mb-6">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Post Update</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Done (one per line)</label>
          <textarea
            value={done}
            onChange={(e) => setDone(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 px-3 py-2 text-sm"
            placeholder="Drafted SOW response..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Queued (one per line)</label>
          <textarea
            value={queued}
            onChange={(e) => setQueued(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 px-3 py-2 text-sm"
            placeholder="Run compliance check..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-red-700 dark:text-red-400 mb-1">Blocked (one per line)</label>
          <textarea
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 px-3 py-2 text-sm"
            placeholder="Need Eric's signature..."
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={posting || (!done.trim() && !queued.trim() && !blocked.trim())}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {posting ? 'Posting...' : 'Post Update'}
        </button>
      </div>
    </form>
  );
}

/* ── single update card ───────────────────────────────────────────────────── */

function UpdateCard({ entry, onResolve }) {
  return (
    <div className="border border-white/20 dark:border-slate-700/30 rounded-lg p-4 mb-3 bg-white/30 dark:bg-slate-800/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-mono">{hourLabel(entry.hour)}</span>
          <span>&middot;</span>
          <span>{relativeTime(entry.ts)}</span>
          <Badge label={entry.source} color="slate" />
        </div>
      </div>

      {entry.done.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Done</span>
          <ul className="mt-1 space-y-0.5">
            {entry.done.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-emerald-500 mt-0.5">&#10003;</span>
                {itemText(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {entry.queued.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Queued</span>
          <ul className="mt-1 space-y-0.5">
            {entry.queued.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-blue-500 mt-0.5">&#9654;</span>
                {itemText(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {entry.blocked.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Blocked</span>
          <ul className="mt-1 space-y-0.5">
            {entry.blocked.map((item, i) => {
              const text = itemText(item);
              const resolved = typeof item === 'object' && item.resolved;
              return (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {resolved ? (
                    <span className="text-slate-400 line-through">{text}</span>
                  ) : (
                    <>
                      <span className="text-red-500">&#9632;</span>
                      <span className="text-slate-700 dark:text-slate-300">{text}</span>
                      <button
                        onClick={() => onResolve?.(entry.id, text)}
                        className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── main page ────────────────────────────────────────────────────────────── */

function CronPanel({ cron }) {
  if (!cron) return null;
  const loop = cron.loop || {};
  const cadence = cron.cadence || {};
  const queue = cron.queue || {};
  const statusColor = loop.status === 'healthy'
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';
  return (
    <div className="glass-panel rounded-xl border border-white/30 dark:border-slate-700/40 p-5 mb-6">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Loop Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-xs text-slate-500 block">Status</span>
          <span className={`font-semibold ${statusColor}`}>{loop.status || 'unknown'}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Passes</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{loop.totalPasses ?? 0}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Last Run</span>
          <span className="text-slate-700 dark:text-slate-300">{loop.lastRunAt ? relativeTime(loop.lastRunAt) : 'never'}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Queue</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{queue.queued ?? 0} queued, {queue.processing ?? 0} running</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <span className="text-xs text-slate-500 block">Cadence</span>
          <span className="text-slate-700 dark:text-slate-300">
            {cadence.enabled ? `${(cadence.days || []).join(', ')} @ ${cadence.time || '?'}` : 'disabled'}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Today</span>
          <span className="text-slate-700 dark:text-slate-300">
            {cadence.todayCode} {cadence.isCadenceDay ? '(active)' : '(off day)'}
          </span>
        </div>
        {cadence.lastResult?.enqueued?.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 block">Last Enqueued</span>
            <span className="text-slate-700 dark:text-slate-300">{cadence.lastResult.enqueued.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OperatorUpdates() {
  const [data, setData] = useState(null);
  const [cron, setCron] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUpdates = useCallback(async () => {
    try {
      const [res, cronRes] = await Promise.all([
        getOperatorUpdates({ limit: 100 }),
        getCronStatus(),
      ]);
      setData(res);
      setCron(cronRes);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
    const iv = setInterval(fetchUpdates, 30_000); // refresh every 30s
    return () => clearInterval(iv);
  }, [fetchUpdates]);

  const handleResolve = async (updateId, blockedText) => {
    try {
      await resolveOperatorBlocked(updateId, blockedText);
      fetchUpdates();
    } catch (err) {
      console.error('resolve failed', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { updates = [], summary = {} } = data || {};
  const { last24h = {} } = summary;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Operator Updates</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hourly cadence log — what was done, what's queued, what's blocked on you.
        </p>
      </div>

      {/* 24h summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass-panel rounded-lg p-3 text-center border border-white/30 dark:border-slate-700/40">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{last24h.totalDone ?? 0}</div>
          <div className="text-xs text-slate-500">Done (24h)</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center border border-white/30 dark:border-slate-700/40">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{last24h.totalQueued ?? 0}</div>
          <div className="text-xs text-slate-500">Queued Now</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center border border-white/30 dark:border-slate-700/40">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{last24h.unresolvedBlocked ?? 0}</div>
          <div className="text-xs text-slate-500">Blocked</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center border border-white/30 dark:border-slate-700/40">
          <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{last24h.count ?? 0}</div>
          <div className="text-xs text-slate-500">Updates (24h)</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <CronPanel cron={cron} />

      <QuickPostForm onPosted={fetchUpdates} />

      <Section title="Update Feed" icon="&#128337;" count={updates.length} defaultOpen={true}>
        {updates.length === 0 ? (
          <p className="text-sm text-slate-500">No updates yet. Post the first one above, or the agent will post automatically on the hour.</p>
        ) : (
          updates.map((entry) => (
            <UpdateCard key={entry.id} entry={entry} onResolve={handleResolve} />
          ))
        )}
      </Section>
    </div>
  );
}
