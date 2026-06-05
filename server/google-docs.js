/**
 * Creates a Google Doc from a proposal's compliance matrix.
 * Returns the Google Doc URL.
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from './google-auth.js';

function statusIcon(status = '') {
  const s = status.toLowerCase();
  if (s === 'compliant' || s === 'met' || s === 'yes') return '✅';
  if (s === 'gap' || s === 'missing' || s === 'no' || s === 'non_compliant') return '❌';
  if (s === 'partial') return '⚠️';
  return '•';
}

function riskBadge(risk = '') {
  const r = risk.toLowerCase();
  if (r === 'high') return '[HIGH RISK]';
  if (r === 'medium' || r === 'med') return '[MED RISK]';
  if (r === 'low') return '[LOW RISK]';
  return '';
}

export async function createComplianceDoc(proposal) {
  const auth = await getAuthenticatedClient();
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  const title = `${proposal.title} — Compliance Matrix`;

  // Create blank doc
  const created = await docs.documents.create({ requestBody: { title } });
  const docId = created.data.documentId;

  // Build the content as batchUpdate requests
  const matrix = Array.isArray(proposal.complianceMatrix) ? proposal.complianceMatrix : [];
  const winThemes = proposal.strategy?.winThemes || [];
  const summary = proposal.metadata?.draftOverview?.executiveSummary || proposal.metadata?.draftOverview?.summary || '';
  const agency = proposal.agency || '';
  const dueDate = proposal.dueDate || 'TBD';

  // Build plain text content to insert
  const lines = [];
  lines.push(`${proposal.title}\n`);
  lines.push(`Agency: ${agency}   Due: ${dueDate}\n\n`);

  if (summary) {
    lines.push(`EXECUTIVE SUMMARY\n`);
    lines.push(`${summary}\n\n`);
  }

  if (winThemes.length) {
    lines.push(`WIN THEMES\n`);
    winThemes.forEach(t => lines.push(`• ${t}\n`));
    lines.push(`\n`);
  }

  lines.push(`COMPLIANCE MATRIX\n`);
  lines.push(`${'─'.repeat(60)}\n`);

  if (matrix.length === 0) {
    lines.push(`No compliance requirements extracted yet.\n`);
  } else {
    matrix.forEach((row, i) => {
      const id = row.requirement_id || `REQ-${String(i + 1).padStart(3, '0')}`;
      const text = row.requirement_text || row.requirement || '';
      const status = row.status || 'unknown';
      const risk = row.risk_level || row.risk || '';
      const section = row.proposal_section || '';
      const notes = row.notes || '';

      lines.push(`${statusIcon(status)} ${id}  ${riskBadge(risk)}\n`);
      lines.push(`${text}\n`);
      if (section) lines.push(`Section: ${section}\n`);
      if (notes) lines.push(`Notes: ${notes}\n`);
      lines.push(`\n`);
    });
  }

  const fullText = lines.join('');

  // Insert all text at the end of the doc body
  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: fullText,
      },
    },
  ];

  // Style the title (first line)
  const titleEnd = proposal.title.length + 1;
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: 1, endIndex: titleEnd },
      paragraphStyle: { namedStyleType: 'HEADING_1' },
      fields: 'namedStyleType',
    },
  });

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests },
  });

  // Make it readable by anyone with the link
  await drive.permissions.create({
    fileId: docId,
    requestBody: { role: 'reader', type: 'anyone' },
  }).catch(() => { /* non-fatal if sharing fails */ });

  return `https://docs.google.com/document/d/${docId}/edit`;
}

// Brand theme colors for Proposal Flow final drafts.
const THEME = {
  primary: { red: 0.118, green: 0.251, blue: 0.686 },   // indigo-800
  secondary: { red: 0.188, green: 0.341, blue: 0.373 }, // slate-700
  accent: { red: 0.776, green: 0.188, blue: 0.188 },    // red-600 (risk)
  muted: { red: 0.424, green: 0.459, blue: 0.490 },     // gray-500
};

// Parse a markdown draft into a segment tree we can feed to the Docs API.
// Returns { plain, segments[] } where segments describe styling by range.
function parseMarkdownForDocs(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const segments = []; // { kind, start, end, meta? }
  let cursor = 0;

  // Helper: push plain text and record inline bold spans (**...**).
  const pushInline = (raw) => {
    let i = 0;
    const re = /\*\*([^*]+)\*\*/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const before = raw.slice(i, m.index);
      if (before) {
        out.push(before);
        cursor += before.length;
      }
      const start = cursor;
      out.push(m[1]);
      cursor += m[1].length;
      segments.push({ kind: 'bold', start, end: cursor });
      i = m.index + m[0].length;
    }
    const rest = raw.slice(i);
    if (rest) {
      out.push(rest);
      cursor += rest.length;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (/^#\s+/.test(line)) {
      const text = line.replace(/^#\s+/, '');
      const start = cursor;
      pushInline(text);
      segments.push({ kind: 'h1', start, end: cursor });
    } else if (/^##\s+/.test(line)) {
      const text = line.replace(/^##\s+/, '');
      const start = cursor;
      pushInline(text);
      segments.push({ kind: 'h2', start, end: cursor });
    } else if (/^###\s+/.test(line)) {
      const text = line.replace(/^###\s+/, '');
      const start = cursor;
      pushInline(text);
      segments.push({ kind: 'h3', start, end: cursor });
    } else if (/^[-*]\s+/.test(line)) {
      const text = line.replace(/^[-*]\s+/, '');
      const start = cursor;
      pushInline(text);
      segments.push({ kind: 'bullet', start, end: cursor });
    } else if (/^---+$/.test(line)) {
      // Treat horizontal rule as a paragraph-sized separator.
      const start = cursor;
      out.push('— — — — — — —');
      cursor += '— — — — — — —'.length;
      segments.push({ kind: 'hr', start, end: cursor });
    } else {
      pushInline(line);
    }
    // Newline after every line except end-of-file.
    if (idx < lines.length - 1) {
      out.push('\n');
      cursor += 1;
    }
  }
  return { plain: out.join(''), segments };
}

export async function createFinalDraftDoc(proposal, draftText) {
  const auth = await getAuthenticatedClient();
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  const title = `${proposal.title} — Final Draft`;
  const created = await docs.documents.create({ requestBody: { title } });
  const docId = created.data.documentId;

  const agency = proposal.agency || 'Unknown';
  const due = proposal.dueDate || 'TBD';
  const score = proposal.metadata?.aiReview?.complianceScore
    ?? proposal.metadata?.aiReview?.score
    ?? 'N/A';
  const solNumber = proposal.metadata?.solicitationNumber || proposal.metadata?.noticeId || '';

  // ── Build content: cover block + body ──
  const coverLines = [
    proposal.title || 'Proposal',
    `${agency} · Due: ${due}${solNumber ? ` · Solicitation: ${solNumber}` : ''}`,
    `Compliance Score: ${score}%`,
    '',
  ];
  const cover = coverLines.join('\n');
  const body = String(draftText || 'Final draft text not available yet.').trim();
  const { plain: parsedBody, segments: bodySegments } = parseMarkdownForDocs(body);
  const fullText = `${cover}\n${parsedBody}\n`;

  // Step 1: insert text in one shot.
  const insertRequests = [{ insertText: { location: { index: 1 }, text: fullText } }];

  // Step 2: style the cover block.
  // Google Docs insertions start at index 1; line-1 (title) ends at 1+title.length.
  const titleStart = 1;
  const titleEnd = titleStart + (proposal.title || 'Proposal').length;
  const metaStart = titleEnd + 1; // +1 for newline
  const metaEnd = metaStart + coverLines[1].length;
  const scoreStart = metaEnd + 1;
  const scoreEnd = scoreStart + coverLines[2].length;

  const styleRequests = [
    // Title = HEADING_1 + primary color + bold
    {
      updateParagraphStyle: {
        range: { startIndex: titleStart, endIndex: titleEnd },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType',
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: titleStart, endIndex: titleEnd },
        textStyle: {
          bold: true,
          foregroundColor: { color: { rgbColor: THEME.primary } },
        },
        fields: 'bold,foregroundColor',
      },
    },
    // Meta line (agency/due/sol)
    {
      updateTextStyle: {
        range: { startIndex: metaStart, endIndex: metaEnd },
        textStyle: {
          italic: true,
          foregroundColor: { color: { rgbColor: THEME.muted } },
          fontSize: { magnitude: 11, unit: 'PT' },
        },
        fields: 'italic,foregroundColor,fontSize',
      },
    },
    // Score line
    {
      updateTextStyle: {
        range: { startIndex: scoreStart, endIndex: scoreEnd },
        textStyle: {
          bold: true,
          foregroundColor: { color: { rgbColor: THEME.secondary } },
        },
        fields: 'bold,foregroundColor',
      },
    },
  ];

  // Step 3: Translate body segments into Docs requests.
  // bodyStartOffset = index at which parsedBody begins in the inserted text.
  const bodyStartOffset = 1 + cover.length + 1; // +1 for leading index, +1 for newline after cover
  const toDocs = (start, end) => ({
    startIndex: bodyStartOffset + start,
    endIndex: bodyStartOffset + end,
  });

  for (const seg of bodySegments) {
    if (seg.start === seg.end) continue;
    if (seg.kind === 'h1') {
      styleRequests.push({
        updateParagraphStyle: {
          range: toDocs(seg.start, seg.end),
          paragraphStyle: { namedStyleType: 'HEADING_1' },
          fields: 'namedStyleType',
        },
      });
      styleRequests.push({
        updateTextStyle: {
          range: toDocs(seg.start, seg.end),
          textStyle: { bold: true, foregroundColor: { color: { rgbColor: THEME.primary } } },
          fields: 'bold,foregroundColor',
        },
      });
    } else if (seg.kind === 'h2') {
      styleRequests.push({
        updateParagraphStyle: {
          range: toDocs(seg.start, seg.end),
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType',
        },
      });
      styleRequests.push({
        updateTextStyle: {
          range: toDocs(seg.start, seg.end),
          textStyle: { bold: true, foregroundColor: { color: { rgbColor: THEME.secondary } } },
          fields: 'bold,foregroundColor',
        },
      });
    } else if (seg.kind === 'h3') {
      styleRequests.push({
        updateParagraphStyle: {
          range: toDocs(seg.start, seg.end),
          paragraphStyle: { namedStyleType: 'HEADING_3' },
          fields: 'namedStyleType',
        },
      });
    } else if (seg.kind === 'bullet') {
      styleRequests.push({
        createParagraphBullets: {
          range: toDocs(seg.start, seg.end),
          bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
        },
      });
    } else if (seg.kind === 'bold') {
      styleRequests.push({
        updateTextStyle: {
          range: toDocs(seg.start, seg.end),
          textStyle: { bold: true },
          fields: 'bold',
        },
      });
    } else if (seg.kind === 'hr') {
      styleRequests.push({
        updateTextStyle: {
          range: toDocs(seg.start, seg.end),
          textStyle: { foregroundColor: { color: { rgbColor: THEME.muted } } },
          fields: 'foregroundColor',
        },
      });
    }
  }

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: [...insertRequests, ...styleRequests] },
  });

  await drive.permissions.create({
    fileId: docId,
    requestBody: { role: 'reader', type: 'anyone' },
  }).catch(() => { /* non-fatal */ });

  return `https://docs.google.com/document/d/${docId}/edit`;
}

export async function createPreSolDoc(proposal) {
  const auth = await getAuthenticatedClient();
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  const title = `${proposal.title} — Pre-Solicitation Analysis`;
  const created = await docs.documents.create({ requestBody: { title } });
  const docId = created.data.documentId;

  const ps = proposal.metadata?.preSolicitation || {};
  const lines = [];
  lines.push(`${proposal.title}\n`);
  lines.push(`Pre-Solicitation Analysis\n\n`);

  if (ps.subcontractingPosture) {
    lines.push(`SUBCONTRACTING POSTURE\n`);
    lines.push(`${ps.subcontractingPosture}\n\n`);
  }
  if (ps.teamingPosture) {
    lines.push(`TEAMING POSTURE\n`);
    lines.push(`${ps.teamingPosture}\n\n`);
  }
  if (ps.pricingPosture) {
    lines.push(`PRICING POSTURE\n`);
    lines.push(`${ps.pricingPosture}\n\n`);
  }
  if ((ps.riskNotes || []).length) {
    lines.push(`RISK NOTES\n`);
    ps.riskNotes.forEach(n => lines.push(`• ${n}\n`));
    lines.push(`\n`);
  }
  if ((ps.positioningNotes || []).length) {
    lines.push(`POSITIONING NOTES\n`);
    ps.positioningNotes.forEach(n => lines.push(`• ${n}\n`));
    lines.push(`\n`);
  }
  if ((ps.actionItems || []).length) {
    lines.push(`ACTION ITEMS\n`);
    ps.actionItems.forEach((item, i) => lines.push(`${i + 1}. ${item}\n`));
    lines.push(`\n`);
  }

  const fullText = lines.join('');

  const requests = [
    { insertText: { location: { index: 1 }, text: fullText } },
  ];

  const titleEnd = proposal.title.length + 1;
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: 1, endIndex: titleEnd },
      paragraphStyle: { namedStyleType: 'HEADING_1' },
      fields: 'namedStyleType',
    },
  });

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests },
  });

  await drive.permissions.create({
    fileId: docId,
    requestBody: { role: 'reader', type: 'anyone' },
  }).catch(() => { /* non-fatal */ });

  return `https://docs.google.com/document/d/${docId}/edit`;
}
