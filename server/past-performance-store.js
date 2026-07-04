/**
 * Past Performance — completed-contract reference records used for GovCon
 * proposal narratives (CPARS-style writeups, relevance blurbs, etc).
 *
 * The store is a lightweight JSON file independent of automation-db.json,
 * matching the pattern used by operator-updates.js.
 *
 * Record shape:
 *   { id, contractName, agency, naics, psc, value, popStart, popEnd,
 *     cparsRating, relevanceBlurb, tags: [], owner }
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const STORE_PATH = path.join(DATA_DIR, 'past-performance.json');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  if (!existsSync(STORE_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(records) {
  ensureDir();
  const tmp = `${STORE_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf8');
  renameSync(tmp, STORE_PATH);
}

let cache = load();

function normalizeRecord(input = {}) {
  return {
    id: input.id || `pp-${randomUUID()}`,
    contractName: input.contractName || '',
    agency: input.agency || '',
    naics: input.naics || '',
    psc: input.psc || '',
    value: input.value ?? null,
    popStart: input.popStart || '',
    popEnd: input.popEnd || '',
    cparsRating: input.cparsRating || '',
    relevanceBlurb: input.relevanceBlurb || '',
    tags: Array.isArray(input.tags) ? input.tags : [],
    owner: input.owner || '',
  };
}

/** Return all past-performance records. */
export function getPastPerformance() {
  return cache;
}

/** Create a new record; server assigns id. Returns the created record. */
export function createPastPerformance(fields = {}) {
  const record = normalizeRecord({ ...fields, id: undefined });
  cache.unshift(record);
  save(cache);
  return record;
}

/** Update fields on an existing record by id. Returns the updated record, or null if not found. */
export function updatePastPerformance(id, fields = {}) {
  const index = cache.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const updated = normalizeRecord({ ...cache[index], ...fields, id: cache[index].id });
  cache[index] = updated;
  save(cache);
  return updated;
}

/** Delete a record by id. Returns true if a record was removed. */
export function deletePastPerformance(id) {
  const before = cache.length;
  cache = cache.filter((r) => r.id !== id);
  if (cache.length === before) return false;
  save(cache);
  return true;
}

/** Replace the entire store (used for seeding). */
export function seedPastPerformance(records = []) {
  cache = records.map((r) => normalizeRecord(r));
  save(cache);
  return cache;
}
