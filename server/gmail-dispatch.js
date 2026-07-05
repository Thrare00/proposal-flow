import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { getAuthenticatedClient } from './google-auth.js';

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function normalizeRecipients(value) {
  return ensureArray(value)
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMimeMessage({ from, to, cc, bcc, replyTo, subject, text, html }) {
  const lines = [];
  if (from) lines.push(`From: ${from}`);
  if (to.length) lines.push(`To: ${to.join(', ')}`);
  if (cc.length) lines.push(`Cc: ${cc.join(', ')}`);
  if (bcc.length) lines.push(`Bcc: ${bcc.join(', ')}`);
  if (replyTo) lines.push(`Reply-To: ${replyTo}`);
  lines.push(`Subject: ${subject || 'No subject'}`);
  lines.push('MIME-Version: 1.0');

  if (html) {
    const boundary = `boundary_${Date.now().toString(36)}`;
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(text || '');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(html);
    lines.push(`--${boundary}--`);
  } else {
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(text || '');
  }

  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function summarizeDispatch({ mode, provider = 'gmail', gmailResponse, smtpResponse, to, cc, bcc, subject, from, replyTo }) {
  return {
    mode,
    provider,
    from: from || null,
    replyTo: replyTo || null,
    gmailMessageId: gmailResponse?.data?.id || null,
    gmailThreadId: gmailResponse?.data?.threadId || null,
    labelIds: gmailResponse?.data?.labelIds || [],
    smtpMessageId: smtpResponse?.messageId || null,
    recipients: {
      to,
      cc,
      bcc,
    },
    subject,
  };
}

function useOfficialGovconSmtp(payload = {}) {
  if (payload.transport === 'smtp') return true;
  if (payload.transport === 'gmail') return false;
  if (payload.lane === 'official_govcon') return true;
  if (payload.officialGovcon === true) return true;
  return false;
}

function getOfficialGovconSmtpConfig() {
  const host = process.env.OFFICIAL_GOVCON_SMTP_HOST || process.env.NAMECHEAP_SMTP_HOST || 'mail.privateemail.com';
  const port = Number(process.env.OFFICIAL_GOVCON_SMTP_PORT || process.env.NAMECHEAP_SMTP_PORT || 587);
  const user = process.env.OFFICIAL_GOVCON_SMTP_USER || process.env.NAMECHEAP_SMTP_USER || 'admin@thrarecontracting.com';
  const pass = process.env.OFFICIAL_GOVCON_SMTP_PASS || process.env.NAMECHEAP_SMTP_PASS || '';
  const secureEnv = process.env.OFFICIAL_GOVCON_SMTP_SECURE || process.env.NAMECHEAP_SMTP_SECURE || '';
  const secure = secureEnv ? secureEnv === 'true' : port === 465;
  const from = process.env.OFFICIAL_GOVCON_FROM_EMAIL || user;
  const replyTo = process.env.OFFICIAL_GOVCON_REPLY_TO || from;

  if (!host || !port || !user || !pass) {
    throw new Error('Official govcon SMTP is not fully configured. Set OFFICIAL_GOVCON_SMTP_HOST, OFFICIAL_GOVCON_SMTP_PORT, OFFICIAL_GOVCON_SMTP_USER, and OFFICIAL_GOVCON_SMTP_PASS.');
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
    replyTo,
  };
}

async function dispatchOfficialGovconSmtpMessage(payload = {}) {
  const to = normalizeRecipients(payload.to);
  if (!to.length) {
    throw new Error('At least one recipient is required');
  }

  const cc = normalizeRecipients(payload.cc);
  const bcc = normalizeRecipients(payload.bcc);
  const config = getOfficialGovconSmtpConfig();
  const mode = payload.mode === 'send' ? 'send' : 'draft';
  if (mode !== 'send') {
    throw new Error('Official govcon SMTP supports send mode only.');
  }

  const from = payload.from || config.from;
  const replyTo = payload.replyTo || config.replyTo || from;
  const subject = payload.subject || 'No subject';
  const text = payload.text || payload.body || '';
  const html = payload.html || '';

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const smtpResponse = await transporter.sendMail({
    from,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    replyTo,
    subject,
    text,
    html: html || undefined,
  });

  return summarizeDispatch({
    mode,
    provider: 'smtp',
    smtpResponse,
    to,
    cc,
    bcc,
    subject,
    from,
    replyTo,
  });
}

function escapeGmailQueryValue(value) {
  return String(value).replace(/"/g, '\\"');
}

async function findRecentDuplicate({ gmail, to, subject, windowDays }) {
  if (!to.length || !subject) return null;
  const toClause = to.map((addr) => `to:(${addr})`).join(' OR ');
  const query = `in:sent (${toClause}) subject:"${escapeGmailQueryValue(subject)}" newer_than:${windowDays}d`;
  const { data } = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 1 });
  const match = (data.messages || [])[0];
  return match ? { messageId: match.id, threadId: match.threadId, query } : null;
}

async function dispatchViaGmail(payload = {}) {
  const to = normalizeRecipients(payload.to);
  if (!to.length) {
    throw new Error('At least one recipient is required');
  }

  const cc = normalizeRecipients(payload.cc);
  const bcc = normalizeRecipients(payload.bcc);
  const from = payload.from || undefined;
  const replyTo = payload.replyTo || from || undefined;
  const subject = payload.subject || 'No subject';
  const text = payload.text || payload.body || '';
  const html = payload.html || '';
  const mode = payload.mode === 'send' ? 'send' : 'draft';

  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  if (mode === 'send' && !payload.allowDuplicate) {
    const windowDays = Number(payload.dedupWindowDays || 3);
    const duplicate = await findRecentDuplicate({ gmail, to, subject, windowDays });
    if (duplicate) {
      const error = new Error(
        `Refusing to send: a matching message to ${to.join(', ')} with subject "${subject}" was already sent within ${windowDays}d (thread ${duplicate.threadId}). Pass allowDuplicate: true to override.`
      );
      error.statusCode = 409;
      error.duplicate = duplicate;
      throw error;
    }
  }

  const raw = buildMimeMessage({ from, to, cc, bcc, replyTo, subject, text, html });

  const requestBody = {
    message: {
      raw,
      threadId: payload.threadId || undefined,
    },
  };

  const gmailResponse = mode === 'send'
    ? await gmail.users.messages.send({ userId: 'me', requestBody: requestBody.message })
    : await gmail.users.drafts.create({ userId: 'me', requestBody });

  return summarizeDispatch({ mode, provider: 'gmail', gmailResponse, to, cc, bcc, subject, from, replyTo });
}

export async function dispatchGmailMessage(payload = {}) {
  if (useOfficialGovconSmtp(payload)) {
    return dispatchOfficialGovconSmtpMessage(payload);
  }
  return dispatchViaGmail(payload);
}
