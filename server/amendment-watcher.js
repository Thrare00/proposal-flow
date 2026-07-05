/**
 * amendment-watcher — detects when a tracked SAM.gov solicitation changes
 * (amendment, updated requirements, new attachments) after Proposal Flow has
 * already started work on it.
 *
 * SAM's amendment schema is inconsistent across notice types, so rather than
 * trusting a single "amendment number" field, we fingerprint the SAM search
 * response for a proposal's solicitation (latest posted date + notice count +
 * a hash of title/description/type across all returned notices). If that
 * fingerprint changes between checks, we treat it as a possible amendment and
 * raise an alert. The first-ever check for a proposal only records the
 * fingerprint — it never raises a false alert.
 *
 * No API key (local dev): logs once and no-ops cleanly.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createId, getDb, nowIso, updateDb } from './automation-store.js';
import { notifyProposalUpdate } from './discord-notify.js';

const SAM_SEARCH_URL = 'https://api.sam.gov/opportunities/v2/search';
const SECRETS_PATH = '/opt/morpheus/secrets/.morpheus_secrets';

// Statuses considered "done" — no reason to keep polling SAM for these.
const TERMINAL_STATUSES = new Set(['closed', 'submitted']);

// Per-proposal throttle: don't re-hit SAM for a proposal more than once per window.
const RECHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

// Pacing between SAM calls within a single pass, and request timeout.
const PACE_MS = 1200;
const REQUEST_TIMEOUT_MS = 20_000;

let cachedApiKey; // undefined = not yet resolved, '' = resolved-but-absent
let warnedNoKey = false;

function readKeyFromSecretsFile() {
  try {
    if (!existsSync(SECRETS_PATH)) return '';
    const raw = readFileSync(SECRETS_PATH, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key === 'SAM_API_KEY') {
        return trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Best effort only — treat as absent.
  }
  return '';
}

function resolveApiKey() {
  if (cachedApiKey !== undefined) return cachedApiKey;
  cachedApiKey = process.env.SAM_API_KEY || readKeyFromSecretsFile() || '';
  return cachedApiKey;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSamDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

// Which identifier does this proposal carry for its tracked SAM solicitation?
function getSolicitationIdentifier(proposal) {
  const solNum = proposal.solicitation_number || proposal.metadata?.solicitationNumber;
  if (solNum) return { identifier: String(solNum), byNoticeId: false };
  const noticeId = proposal.metadata?.noticeId;
  if (noticeId) return { identifier: String(noticeId), byNoticeId: true };
  return null;
}

function buildSamUrl(identifier, apiKey, byNoticeId) {
  const today = new Date();
  const from = new Date(today);
  from.setFullYear(from.getFullYear() - 1);

  const params = new URLSearchParams({
    api_key: apiKey,
    limit: '10',
    postedFrom: formatSamDate(from),
    postedTo: formatSamDate(today),
  });
  params.set(byNoticeId ? 'noticeid' : 'solnum', identifier);
  return `${SAM_SEARCH_URL}?${params.toString()}`;
}

// Fetch notices for one solicitation identifier. Retries once with backoff on
// 429 (rate limit) / 401 (auth hiccup); any other non-OK status throws
// immediately so the caller can log-and-skip that proposal without derailing
// the whole pass.
async function fetchSamNotices(identifier, apiKey, byNoticeId) {
  const url = buildSamUrl(identifier, apiKey, byNoticeId);

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (res.status === 429 || res.status === 401) {
      if (attempt === 0) {
        await sleep(2000);
        continue;
      }
      throw new Error(`SAM API rate/auth error (${res.status})`);
    }

    if (!res.ok) {
      throw new Error(`SAM API error ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data?.opportunitiesData) ? data.opportunitiesData : [];
  }

  return [];
}

// Fingerprint a set of returned notices for a solicitation. Deliberately
// coarse — SAM's per-field amendment signal is unreliable, so we hash
// everything that tends to change when an amendment posts (title/description/
// type text across all returned notices) plus the notice count and the
// latest posted date.
function computeFingerprint(notices) {
  if (!notices.length) return null;

  const latestPostedDate = notices
    .map((n) => n.postedDate || n.publishDate || '')
    .filter(Boolean)
    .sort()
    .pop() || '';

  const textBlob = notices
    .slice()
    .sort((a, b) => (a.noticeId || '').localeCompare(b.noticeId || ''))
    .map((n) => `${n.noticeId || ''}|${n.title || ''}|${n.description || ''}|${n.type || ''}`)
    .join('\n');

  const hash = createHash('sha256').update(textBlob).digest('hex').slice(0, 16);

  return { hash, noticeCount: notices.length, latestPostedDate };
}

function fingerprintValue(fp) {
  return `${fp.hash}:${fp.noticeCount}:${fp.latestPostedDate}`;
}

async function checkOneProposal(proposal, apiKey) {
  const ident = getSolicitationIdentifier(proposal);
  if (!ident) return { alerted: false, skipped: true };

  const notices = await fetchSamNotices(ident.identifier, apiKey, ident.byNoticeId);
  const timestamp = nowIso();

  if (!notices.length) {
    // Nothing came back (delisted/expired/typo'd solnum) — just record the
    // check happened so we don't hammer SAM every tick; no alert either way.
    updateDb((db) => {
      const p = db.proposals.find((item) => item.id === proposal.id);
      if (p) {
        p.metadata = p.metadata || {};
        p.metadata.lastAmendmentCheck = timestamp;
      }
      return db;
    });
    return { alerted: false };
  }

  const fp = computeFingerprint(notices);
  const newFingerprint = fingerprintValue(fp);
  const previousFingerprint = proposal.metadata?.samFingerprint || null;
  const isFirstCheck = !previousFingerprint;
  const changed = !isFirstCheck && previousFingerprint !== newFingerprint;

  const latestNotice = notices
    .slice()
    .sort((a, b) => (a.postedDate || '').localeCompare(b.postedDate || ''))
    .pop();

  let alerted = false;

  updateDb((db) => {
    const p = db.proposals.find((item) => item.id === proposal.id);
    if (!p) return db;

    p.metadata = p.metadata || {};
    p.metadata.samFingerprint = newFingerprint;
    p.metadata.lastAmendmentCheck = timestamp;

    if (changed) {
      const detail = `SAM notice(s) for this solicitation changed — ${fp.noticeCount} notice(s) on record, latest posted ${fp.latestPostedDate || 'unknown date'}.`;

      p.metadata.amendmentAlert = {
        detectedAt: timestamp,
        detail,
        noticeId: latestNotice?.noticeId || ident.identifier,
        postedDate: fp.latestPostedDate || null,
        url: latestNotice?.uiLink || latestNotice?.additionalInfoLink || '',
      };
      p.updatedAt = timestamp;

      p.metadata.workflowSteps = Array.isArray(p.metadata.workflowSteps) ? p.metadata.workflowSteps : [];
      p.metadata.workflowSteps.unshift({
        id: createId('step'),
        timestamp,
        stage: p.status || 'unknown',
        status: 'alert',
        label: `Amendment detected on SAM.gov (posted ${fp.latestPostedDate || 'unknown date'}) — re-check requirements`,
      });
      p.metadata.workflowSteps = p.metadata.workflowSteps.slice(0, 100);

      alerted = true;
    }

    return db;
  });

  if (alerted) {
    notifyProposalUpdate(
      `⚠️ AMENDMENT — ${proposal.title || 'Untitled proposal'}: solicitation updated on SAM (${fp.latestPostedDate || 'recent'}). Re-check requirements.`,
    );
  }

  return { alerted };
}

/**
 * Scan tracked proposals for SAM solicitation changes/amendments.
 *
 * @param {{ force?: boolean }} options - `force` bypasses the per-proposal
 *   recheck throttle (used by the manual "Re-check amendments" action).
 * @returns {Promise<{ checked: number, alerted: number, skipped?: string }>}
 */
export async function checkAmendments({ force = false } = {}) {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    if (!warnedNoKey) {
      console.warn(
        '[amendment-watcher] SAM_API_KEY not set (env or /opt/morpheus/secrets/.morpheus_secrets) — amendment checks disabled',
      );
      warnedNoKey = true;
    }
    return { checked: 0, alerted: 0, skipped: 'no_api_key' };
  }

  const db = getDb();
  const now = Date.now();

  const candidates = (db.proposals || []).filter((p) => {
    if (TERMINAL_STATUSES.has(p.status)) return false;
    if (!getSolicitationIdentifier(p)) return false;
    if (!force) {
      const last = p.metadata?.lastAmendmentCheck;
      if (last) {
        const lastMs = new Date(last).getTime();
        if (!Number.isNaN(lastMs) && (now - lastMs) < RECHECK_INTERVAL_MS) return false;
      }
    }
    return true;
  });

  let checked = 0;
  let alerted = 0;

  for (let i = 0; i < candidates.length; i++) {
    const proposal = candidates[i];
    try {
      const result = await checkOneProposal(proposal, apiKey);
      if (!result.skipped) checked++;
      if (result.alerted) alerted++;
    } catch (error) {
      console.error(`[amendment-watcher] check failed for proposal ${proposal.id}:`, error.message);
    }

    if (i < candidates.length - 1) {
      await sleep(PACE_MS);
    }
  }

  return { checked, alerted };
}
