/**
 * Operator Updates — hourly work-hour cadence log.
 *
 * Each update captures what was done, what is queued next, and what is
 * blocked on human (Eric) action.  The store is a lightweight JSON file
 * independent of automation-db.json so it can be appended to at high
 * frequency without touching the main database.
 *
 * Data shape per entry:
 *   { id, ts, hour, done[], queued[], blocked[], source, meta? }
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const UPDATES_PATH = path.join(DATA_DIR, 'operator-updates.json');
const MAX_ENTRIES = 500;

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  if (!existsSync(UPDATES_PATH)) return [];
  try {
    return JSON.parse(readFileSync(UPDATES_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function save(entries) {
  ensureDir();
  const tmp = `${UPDATES_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf8');
  renameSync(tmp, UPDATES_PATH);
}

let cache = load();

/** Return all updates (newest-first), optionally limited. */
export function getOperatorUpdates({ limit = 50, since } = {}) {
  let result = cache;
  if (since) {
    result = result.filter((u) => u.ts >= since);
  }
  return result.slice(0, limit);
}

/** Append one hourly update entry. Returns the created entry.
 *  blocked items can be strings or { text, proposalId?, severity? } objects.
 */
export function appendOperatorUpdate({ done = [], queued = [], blocked = [], source = 'agent', meta } = {}) {
  const now = new Date();
  const entry = {
    id: `op-${randomUUID()}`,
    ts: now.toISOString(),
    hour: now.toISOString().slice(0, 13), // e.g. "2026-06-05T14"
    done,
    queued,
    blocked,
    source,
    ...(meta ? { meta } : {}),
  };
  cache.unshift(entry);
  cache = cache.slice(0, MAX_ENTRIES);
  save(cache);
  return entry;
}

/** Get all unresolved blocked items across recent updates, optionally filtered by proposalId. */
export function getUnresolvedBlockers({ proposalId, limit = 50 } = {}) {
  const results = [];
  for (const update of cache) {
    for (const item of update.blocked) {
      const isObj = typeof item === 'object' && item !== null;
      const resolved = isObj && item.resolved;
      if (resolved) continue;
      const pid = isObj ? item.proposalId : undefined;
      if (proposalId && pid !== proposalId) continue;
      results.push({
        updateId: update.id,
        ts: update.ts,
        text: isObj ? item.text : item,
        proposalId: pid || null,
        severity: isObj ? item.severity || 'medium' : 'medium',
      });
      if (results.length >= limit) return results;
    }
  }
  return results;
}

/** Resolve a blocked item by id (marks it resolved, moves to done on latest entry). */
export function resolveBlockedItem(updateId, blockedText) {
  const entry = cache.find((u) => u.id === updateId);
  if (!entry) return null;
  const idx = entry.blocked.findIndex(
    (b) => (typeof b === 'string' ? b : b.text) === blockedText,
  );
  if (idx === -1) return null;
  const removed = entry.blocked.splice(idx, 1)[0];
  entry.done.push(typeof removed === 'string' ? `[resolved] ${removed}` : { ...removed, resolved: true });
  save(cache);
  return entry;
}

/** Summary stats for the dashboard widget. */
export function getOperatorSummary() {
  const latest = cache[0] || null;
  const last24h = cache.filter((u) => u.ts >= new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  const totalDone = last24h.reduce((n, u) => n + u.done.length, 0);
  const totalQueued = latest ? latest.queued.length : 0;
  const totalBlocked = last24h.reduce((n, u) => n + u.blocked.length, 0);
  const unresolvedBlocked = last24h.reduce(
    (n, u) => n + u.blocked.filter((b) => typeof b === 'string' || !b.resolved).length,
    0,
  );
  return {
    latest,
    last24h: { count: last24h.length, totalDone, totalQueued, totalBlocked, unresolvedBlocked },
  };
}
