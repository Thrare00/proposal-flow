/**
 * amendment-email-watcher — detects AMENDMENT/ADDENDUM/MODIFICATION emails
 * from solicitation portals (BidNet, SAM.gov, IonWave, agency .gov/.mil
 * senders) landing in the rareearthcontracting@gmail.com inbox, matches them
 * to an active tracked proposal, and uses the LLM (see server/llm.js) to
 * extract a REVISED due date. If the due date changed, the proposal is
 * updated immediately and a loud Discord alert is fired — this is the
 * highest-value mistake-prevention path in Proposal Flow (a missed amendment
 * due-date change is how bids get thrown out on a technicality).
 *
 * READ MECHANISM: the `gog` CLI (Google CLI), already authorized
 * non-interactively for rareearthcontracting@gmail.com on the production
 * server (`gog gmail search` / `gog gmail get`). It is invoked here via
 * child_process. The keyring backend that unlocks the stored refresh token
 * needs GOG_KEYRING_PASSWORD in the environment; that's resolved the same
 * way amendment-watcher.js resolves SAM_API_KEY — env var first, then the
 * shared secrets file — since the systemd unit's own .env does not carry it.
 * (Alternative considered: server/google-auth.js's stored OAuth token has the
 * `https://mail.google.com/` scope and could read mail too, but `gog` is
 * already fully authed for the correct mailbox and needs no extra plumbing,
 * so it's the simpler and more reliable choice here.)
 *
 * No `gog` binary / no keyring password / gog call fails => logs once and
 * no-ops cleanly (never throws into the caller).
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createId, getDb, nowIso, updateDb } from './automation-store.js';
import { notifyProposalUpdate } from './discord-notify.js';
import { generateJson, isLlmAvailable } from './llm.js';

const execFileAsync = promisify(execFile);

const SECRETS_PATH = '/opt/morpheus/secrets/.morpheus_secrets';
const GOG_ACCOUNT = process.env.AMENDMENT_EMAIL_ACCOUNT || 'rareearthcontracting@gmail.com';

const LOOKBACK_DAYS = 14;
const MAX_SEARCH_RESULTS = 150;
const MAX_CANDIDATES_PER_PASS = 25; // caps gog `get` + LLM calls per pass
const MAX_PROCESSED_IDS = 50;
const GOG_TIMEOUT_MS = 30_000;

// Global throttle (not per-proposal) — see checkAmendmentEmails().
const RECHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const TERMINAL_STATUSES = new Set(['closed', 'submitted']);

const PORTAL_SENDER_HINTS = ['bidnetdirect', 'bidnet.com', 'sam.gov', 'ionwave', '.gov', '.mil'];
const AMENDMENT_TEXT_RE = /\b(amendment|addendum|modification|revised|due date|response date|closing date)\b/i;

let cachedKeyringPassword; // undefined = not yet resolved
let cachedGogBinary; // undefined = not yet resolved
const warnedOnce = new Set();

function warnOnce(key, message) {
  if (warnedOnce.has(key)) return;
  warnedOnce.add(key);
  console.warn(`[amendment-email-watcher] ${message}`);
}

function readSecret(name) {
  try {
    if (!existsSync(SECRETS_PATH)) return '';
    const raw = readFileSync(SECRETS_PATH, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key === name) {
        return trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Best effort only — treat as absent.
  }
  return '';
}

function resolveKeyringPassword() {
  if (cachedKeyringPassword !== undefined) return cachedKeyringPassword;
  cachedKeyringPassword = process.env.GOG_KEYRING_PASSWORD || readSecret('GOG_KEYRING_PASSWORD') || '';
  return cachedKeyringPassword;
}

function resolveGogBinary() {
  if (cachedGogBinary !== undefined) return cachedGogBinary;
  if (process.env.GOG_BIN) {
    cachedGogBinary = process.env.GOG_BIN;
    return cachedGogBinary;
  }
  const candidates = ['/usr/local/bin/gog', '/usr/bin/gog'];
  cachedGogBinary = candidates.find((c) => existsSync(c)) || 'gog';
  return cachedGogBinary;
}

async function runGog(args) {
  const password = resolveKeyringPassword();
  if (!password) {
    const err = new Error('GOG_KEYRING_PASSWORD not set (env or /opt/morpheus/secrets/.morpheus_secrets)');
    err.code = 'NO_KEYRING_PASSWORD';
    throw err;
  }
  const env = { ...process.env, GOG_KEYRING_PASSWORD: password };
  const { stdout } = await execFileAsync(resolveGogBinary(), args, {
    env,
    timeout: GOG_TIMEOUT_MS,
    maxBuffer: 25 * 1024 * 1024,
  });
  return stdout;
}

async function listCandidateMessages() {
  const stdout = await runGog([
    'gmail', 'search', '-a', GOG_ACCOUNT, `newer_than:${LOOKBACK_DAYS}d`,
    '--max', String(MAX_SEARCH_RESULTS),
    '-j', '--results-only',
  ]);
  const list = JSON.parse(stdout || '[]');
  return Array.isArray(list) ? list : [];
}

async function fetchMessageDetail(messageId) {
  const stdout = await runGog([
    'gmail', 'get', '-a', GOG_ACCOUNT, messageId,
    '-j', '--results-only', '--select', 'body,headers',
  ]);
  return JSON.parse(stdout || '{}');
}

function isLikelyPortalSender(fromHeader = '') {
  const lower = String(fromHeader).toLowerCase();
  return PORTAL_SENDER_HINTS.some((hint) => lower.includes(hint));
}

function isLikelyAmendmentText(text = '') {
  return AMENDMENT_TEXT_RE.test(text);
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSolicitationIdentifiers(proposal) {
  const ids = new Set();
  const solNum = proposal.solicitation_number || proposal.metadata?.solicitationNumber;
  if (solNum) ids.add(String(solNum).trim());
  const noticeId = proposal.metadata?.noticeId;
  if (noticeId) ids.add(String(noticeId).trim());
  return [...ids].filter((id) => id.length >= 4); // avoid trivial false-positive matches
}

function findMatchingProposal(proposals, haystackLower) {
  for (const proposal of proposals) {
    const ids = getSolicitationIdentifiers(proposal);
    if (ids.some((id) => haystackLower.includes(id.toLowerCase()))) return proposal;
  }
  return null;
}

/**
 * Ask the LLM for the revised due/response/closing date. Strict by design —
 * returns null unless the model is confident a new due date is clearly
 * stated (never infer from unrelated dates like posting date or Q&A cutoff).
 */
async function extractDueDateFromEmail(emailText, subject) {
  if (!isLlmAvailable()) return null;

  const system = [
    'You extract the REVISED submission/response/due/closing date from a',
    'solicitation amendment email (government or commercial bid portal).',
    'Be strict: only return a date if the email clearly states a NEW due',
    'date, response date, or closing date/time for submitting a bid/proposal.',
    'Do not infer from unrelated dates such as the posting date, Q&A deadline,',
    'or site-visit date. If no new due date is clearly stated, return null.',
  ].join(' ');

  const userPrompt = [
    `SUBJECT: ${subject || '(no subject)'}`,
    '',
    'EMAIL BODY:',
    emailText.slice(0, 12000),
    '',
    'Respond with ONLY this JSON shape:',
    '{"dueDate": "YYYY-MM-DD" or null, "confidence": "high" | "medium" | "low"}',
  ].join('\n');

  let result;
  try {
    result = await generateJson(system, userPrompt, { dueDate: null, confidence: 'low' }, 512);
  } catch (error) {
    console.error('[amendment-email-watcher] LLM extraction failed:', error.message);
    return null;
  }

  if (!result || typeof result !== 'object') return null;
  if (result.confidence === 'low') return null;
  const value = result.dueDate;
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Apply a matched amendment email to its proposal: due-date change (loud
 * alert + history) or, absent a parseable date, a lighter manual-review
 * alert. Re-reads/mutates the live db inside updateDb so concurrent ticks
 * can't clobber each other, and guards against double-processing the same
 * message id (processedAmendmentEmails is the source of truth).
 */
function applyMatchedEmail({ proposalId, messageId, subject, sender, bodyExcerpt, newDueDateIso }) {
  const timestamp = nowIso();
  let dateChange = false;
  let alerted = false;
  let notifyMessage = null;

  updateDb((db) => {
    const p = db.proposals.find((item) => item.id === proposalId);
    if (!p) return db;

    p.metadata = p.metadata || {};
    const processed = Array.isArray(p.metadata.processedAmendmentEmails)
      ? p.metadata.processedAmendmentEmails
      : [];
    if (processed.includes(messageId)) return db; // already handled — no-op

    processed.unshift(messageId);
    p.metadata.processedAmendmentEmails = processed.slice(0, MAX_PROCESSED_IDS);

    const currentDueDate = p.dueDate || null;
    const normalizedCurrent = currentDueDate ? String(currentDueDate).slice(0, 10) : null;

    p.metadata.workflowSteps = Array.isArray(p.metadata.workflowSteps) ? p.metadata.workflowSteps : [];

    if (newDueDateIso && newDueDateIso !== normalizedCurrent) {
      p.metadata.dueDateHistory = Array.isArray(p.metadata.dueDateHistory) ? p.metadata.dueDateHistory : [];
      p.metadata.dueDateHistory.unshift({
        from: currentDueDate,
        to: newDueDateIso,
        source: 'email',
        subject,
        changedAt: timestamp,
      });
      p.metadata.dueDateHistory = p.metadata.dueDateHistory.slice(0, 50);

      p.dueDate = newDueDateIso;
      p.metadata.amendmentAlert = {
        detectedAt: timestamp,
        type: 'due_date_change',
        from: currentDueDate,
        to: newDueDateIso,
        subject,
        source: 'email',
        sender: sender || null,
        messageId,
      };
      p.updatedAt = timestamp;

      p.metadata.workflowSteps.unshift({
        id: createId('step'),
        timestamp,
        stage: p.status || 'unknown',
        status: 'alert',
        label: `Due date changed via amendment email — ${currentDueDate || 'unknown'} → ${newDueDateIso} ("${subject}")`,
      });

      dateChange = true;
      alerted = true;
      notifyMessage = `⚠️ DUE DATE CHANGED — ${p.title || 'Untitled proposal'}: ${currentDueDate || 'unknown'} → ${newDueDateIso} (amendment email). Verify requirements.`;
    } else {
      p.metadata.amendmentAlert = {
        detectedAt: timestamp,
        type: 'amendment',
        subject,
        source: 'email',
        sender: sender || null,
        messageId,
      };
      p.updatedAt = timestamp;

      p.metadata.workflowSteps.unshift({
        id: createId('step'),
        timestamp,
        stage: p.status || 'unknown',
        status: 'alert',
        label: `Possible amendment email detected — manual review needed ("${subject}")`,
      });

      alerted = true;
      notifyMessage = `⚠️ AMENDMENT EMAIL — ${p.title || 'Untitled proposal'}: "${subject}". No confident due-date change parsed — review manually.`;
    }

    p.metadata.workflowSteps = p.metadata.workflowSteps.slice(0, 100);
    return db;
  });

  if (alerted && notifyMessage) notifyProposalUpdate(notifyMessage);
  void bodyExcerpt; // kept in signature for future logging/debugging use only

  return { dateChange, alerted };
}

/**
 * Scan the rareearthcontracting@ inbox for amendment emails and apply any
 * matched, unprocessed ones to their tracked proposal.
 *
 * @param {{ force?: boolean }} options - `force` bypasses the global
 *   once-per-hour throttle (used by the manual check-amendment-emails route).
 * @returns {Promise<{ scanned: number, matched: number, dateChanges: number,
 *   alerted: number, unmatched?: number, skipped?: string }>}
 */
export async function checkAmendmentEmails({ force = false } = {}) {
  const db = getDb();

  if (!force) {
    const last = db.settings?.lastAmendmentEmailCheck;
    if (last) {
      const lastMs = new Date(last).getTime();
      if (!Number.isNaN(lastMs) && (Date.now() - lastMs) < RECHECK_INTERVAL_MS) {
        return { scanned: 0, matched: 0, dateChanges: 0, alerted: 0, skipped: 'throttled' };
      }
    }
  }

  // Record the attempt immediately so overlapping/rapid ticks can't pile up
  // gog calls while one pass is in flight.
  updateDb((d) => {
    d.settings = d.settings || {};
    d.settings.lastAmendmentEmailCheck = nowIso();
    return d;
  });

  const activeProposals = (db.proposals || []).filter(
    (p) => !TERMINAL_STATUSES.has(p.status) && getSolicitationIdentifiers(p).length > 0,
  );

  if (!activeProposals.length) {
    return { scanned: 0, matched: 0, dateChanges: 0, alerted: 0, skipped: 'no_tracked_proposals' };
  }

  const alreadyProcessed = new Set();
  for (const p of activeProposals) {
    for (const id of (p.metadata?.processedAmendmentEmails || [])) alreadyProcessed.add(id);
  }

  let messages;
  try {
    messages = await listCandidateMessages();
  } catch (error) {
    if (error.code === 'NO_KEYRING_PASSWORD') {
      warnOnce('no-password', `${error.message} — amendment email checks disabled`);
    } else if (error.code === 'ENOENT') {
      warnOnce('no-binary', `gog CLI not found on PATH — amendment email checks disabled`);
    } else {
      warnOnce('search-failed', `gog gmail search failed (${error.message}) — amendment email checks disabled until next restart`);
    }
    return { scanned: 0, matched: 0, dateChanges: 0, alerted: 0, skipped: 'no_mechanism' };
  }

  const candidates = messages
    .filter((m) => m && m.id && !alreadyProcessed.has(m.id))
    .filter((m) => isLikelyPortalSender(m.from) || isLikelyAmendmentText(m.subject))
    .slice(0, MAX_CANDIDATES_PER_PASS);

  let matched = 0;
  let dateChanges = 0;
  let alerted = 0;
  let unmatched = 0;

  for (const msg of candidates) {
    let detail;
    try {
      detail = await fetchMessageDetail(msg.id);
    } catch (error) {
      console.error(`[amendment-email-watcher] fetch failed for message ${msg.id}:`, error.message);
      continue;
    }

    const headers = detail.headers || {};
    const subject = headers.subject || msg.subject || '';
    const sender = headers.from || msg.from || '';
    const bodyText = stripHtml(detail.body || '');
    const haystackLower = `${subject}\n${bodyText}`.toLowerCase();

    const proposal = findMatchingProposal(activeProposals, haystackLower);
    if (!proposal) {
      unmatched++;
      continue;
    }
    matched++;

    let newDueDateIso = null;
    try {
      newDueDateIso = await extractDueDateFromEmail(bodyText, subject);
    } catch (error) {
      console.error(`[amendment-email-watcher] date extraction failed for message ${msg.id}:`, error.message);
    }

    const result = applyMatchedEmail({
      proposalId: proposal.id,
      messageId: msg.id,
      subject,
      sender,
      bodyExcerpt: bodyText.slice(0, 500),
      newDueDateIso,
    });

    if (result.dateChange) dateChanges++;
    if (result.alerted) alerted++;
  }

  if (unmatched > 0) {
    console.log(`[amendment-email-watcher] ${unmatched} candidate email(s) had no matching tracked proposal`);
  }

  return { scanned: candidates.length, matched, dateChanges, alerted, unmatched };
}
