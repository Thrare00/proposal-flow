// Thrare Contracting brand PDF generation via WeasyPrint.
// Logo-derived brand: crimson red (#CC1111) butterfly + lime green (#6ABF1E) "RARE" text.
// Serif-led "gentlemanly" typography with MLA-style paragraphs.
// Cover layout inspired by Fulton Gravel+Stone.docx professional letter format.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = path.join(__dirname, 'data', 'exports');

// ── Thrare Contracting brand tokens (from actual logo: Logo-nobackground.png.png) ──
const CRIMSON    = '#CC1111';   // logo butterfly red - primary accent
const LIME_GREEN = '#6ABF1E';   // logo "RARE" text - secondary accent / cert badges
const DARK_BG    = '#111111';   // dark cinematic cover background
const CREAM      = '#FAF8F5';   // warm off-white body background
const NEAR_BLACK = '#1A1A1A';   // body text
const WARM_GRAY  = '#6B6B6B';   // secondary text, captions
const LIGHT_GRAY = '#E8E6E3';   // table alt rows, subtle borders
const WHITE      = '#FFFFFF';   // card backgrounds, cover text
const GOLD       = '#D4A84B';   // sparingly - highlights, star accents
const RED_RISK   = '#a33';      // compliance risk
const GREEN_OK   = '#2d7a2d';   // compliance go

const SERIF = '"Bookman Old Style", "Georgia", "Times New Roman", serif';
const SANS  = '"Century Gothic", "Avenir Next", "Trebuchet MS", sans-serif';

// ── Company credential block ──
const COMPANY = {
  name: 'Thrare Contracting',
  dba: 'Thrare Contracting',
  president: 'Eric White Jr., Founder',
  email: 'admin@thrarecontracting.com',
  phone: '(678) 748-3578',
  address: '8735 Dunwoody Pl, Ste R (#6), Atlanta, GA 30350',
  uei: 'Z4WKS4UE8NJ6',
  cage: '9JAV8',
  ein: '99-2474896',
  certs: ['MBE', 'DBE', 'SDB', 'BAO'],
};

// ── Creative section header mapping ──
// Instead of generic headers, use distinguished, gentlemanly alternatives
const HEADER_MAP = {
  'Executive Summary':        'A Note to the Contracting Office',
  'Technical Approach':       'Our Approach and Methodology',
  'Management Plan':          'How We Lead and Deliver',
  'Staffing & Key Personnel': 'The People Behind the Work',
  'Staffing and Key Personnel': 'The People Behind the Work',
  'Past Performance':         'A Record of Results',
  'Quality Control':          'Our Standard of Excellence',
  'Pricing Narrative':        'Investment and Value',
  'Compliance Matrix':        'Compliance Traceability',
  'Proposal':                 'Scope of Services',
  'Proposal Draft':           'Scope of Services',
};

function mapHeader(original) {
  const key = original.trim();
  return HEADER_MAP[key] || key;
}

// ── Load logo as base64 data URI ──
let LOGO_DATA_URI = '';
try {
  const logoPath = '/mnt/c/Users/ericw/Documents/Thrare/Marketing/Logo-nobackground.png.png';
  if (fs.existsSync(logoPath)) {
    const logoB64 = fs.readFileSync(logoPath).toString('base64');
    LOGO_DATA_URI = `data:image/png;base64,${logoB64}`;
  }
} catch (_) { /* logo optional */ }

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToHtml(md) {
  if (!md) return '';
  let cleaned = md
    .replace(/^_Generated:.*_\n?/m, '')
    .replace(/^\*\*Offeror:\*\*.*\n?/m, '')
    .replace(/^\*\*Certifications:\*\*.*\n?/m, '')
    .replace(/^\*\*Point of Contact:\*\*.*\n?/m, '')
    .replace(/^---\s*$/gm, '');

  cleaned = cleaned.replace(/^#\s+Proposal Draft[^\n]*\n?/m, '');
  // Strip duplicate exec summary from body (already rendered on page 2)
  cleaned = cleaned.replace(/^##?\s+Executive Summary\s*\n([\s\S]*?)(?=^##?\s+|\s*$)/m, '');
  // Replace em dashes with hyphens
  cleaned = cleaned.replace(/\u2014/g, '-');

  const lines = cleaned.split('\n');
  const out = [];
  let tableRows = [];
  let listItems = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const hdr = tableRows[0];
    let h = '<table class="striped"><thead><tr>';
    for (const c of hdr) h += `<th>${inline(c.trim())}</th>`;
    h += '</tr></thead><tbody>';
    for (let i = 1; i < tableRows.length; i++) {
      h += '<tr>';
      for (const c of tableRows[i]) h += `<td>${inline(c.trim())}</td>`;
      h += '</tr>';
    }
    h += '</tbody></table>';
    out.push(h);
    tableRows = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    out.push('<ul>' + listItems.join('') + '</ul>');
    listItems = [];
  };

  const inline = (text) => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
    if (/^\|.+\|$/.test(trimmed)) {
      flushList();
      const cells = trimmed.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    }
    flushTable();

    if (/^[-*]\s+(.+)/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s+/, '');
      listItems.push(`<li>${inline(text)}</li>`);
      continue;
    }
    flushList();

    if (/^###\s+(.+)/.test(trimmed)) {
      const raw = trimmed.replace(/^###\s+/, '');
      out.push(`<h3>${inline(mapHeader(raw))}</h3>`);
    } else if (/^##\s+(.+)/.test(trimmed)) {
      const raw = trimmed.replace(/^##\s+/, '');
      out.push(`<h2>${inline(mapHeader(raw))}</h2>`);
    } else if (/^#\s+(.+)/.test(trimmed)) {
      const raw = trimmed.replace(/^#\s+/, '');
      out.push(`<h2 class="h1-accent">${inline(mapHeader(raw))}</h2>`);
    } else if (trimmed === '') {
      // skip blank lines
    } else {
      out.push(`<p>${inline(trimmed)}</p>`);
    }
  }
  flushTable();
  flushList();

  return out.join('\n');
}

function buildHtml(proposal, draftMarkdown) {
  const title = escapeHtml(proposal.title || 'Untitled Proposal');
  const agency = escapeHtml(proposal.agency || 'Unknown Agency');
  const dueDate = proposal.dueDate
    ? new Date(proposal.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD';
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const solNum = proposal.metadata?.solicitationNumber || '';

  const matrix = proposal.metadata?.complianceMatrix || proposal.complianceMatrix || [];
  const execSummary = proposal.metadata?.executiveSummary || proposal.executiveSummary || '';

  const draftHtml = markdownToHtml(draftMarkdown);

  const certTags = COMPANY.certs.map(c => `<span class="cert-tag">${c}</span>`).join(' ');

  const CATEGORY_ORDER = ['deadline', 'attachment', 'insurance', 'bonding', 'regulation', 'mandatory', 'format'];
  const CATEGORY_LABELS = {
    deadline: 'Deadlines and Due Dates',
    attachment: 'Required Attachments',
    insurance: 'Insurance Requirements',
    bonding: 'Bonding Requirements',
    regulation: 'Regulations and Compliance',
    mandatory: 'Mandatory Obligations',
    format: 'Format and Submission',
  };
  const grouped = {};
  for (const r of matrix) {
    const cat = r.category || 'mandatory';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  }
  const matrixHtml = CATEGORY_ORDER
    .filter(cat => grouped[cat]?.length)
    .map(cat => {
      const reqs = grouped[cat];
      const rows = reqs.map(r => {
        const riskColor = (r.risk_level === 'critical' || r.risk_level === 'high') ? RED_RISK : r.risk_level === 'medium' ? '#8a6d00' : GREEN_OK;
        return `<tr>
          <td style="white-space:nowrap">${escapeHtml(r.requirement_id)}</td>
          <td>${escapeHtml(r.requirement_text)}${r.mandatory ? ' <span class="mandatory-tag">MANDATORY</span>' : ''}</td>
          <td><span style="color:${riskColor};font-weight:600">${escapeHtml(r.risk_level || 'low')}</span></td>
          <td>${escapeHtml(r.status)}</td>
        </tr>`;
      }).join('\n');
      return `<h3>${escapeHtml(CATEGORY_LABELS[cat] || cat)} (${reqs.length})</h3>
      <table class="striped compact">
        <thead><tr><th>ID</th><th>Requirement</th><th>Risk</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="author" content="${escapeHtml(COMPANY.name)}">
  <meta name="description" content="Proposal: ${title}">
  <meta name="generator" content="Proposal Flow / Thrare Contracting">
  <style>
    @page {
      size: letter;
      margin: 22mm 25mm 25mm 25mm;
      background: ${CREAM};

      @top-right {
        content: string(section-title);
        font-family: ${SANS};
        font-size: 7.5pt;
        color: ${WARM_GRAY};
      }
      @bottom-center {
        content: counter(page);
        font-family: ${SANS};
        font-size: 8.5pt;
        color: ${WARM_GRAY};
      }
      @bottom-left {
        content: "${COMPANY.name}  |  ${COMPANY.certs.join(' / ')}";
        font-family: ${SANS};
        font-size: 7pt;
        color: ${WARM_GRAY};
      }
      @bottom-right {
        content: "CAGE: ${COMPANY.cage}  |  UEI: ${COMPANY.uei}";
        font-family: ${SANS};
        font-size: 7pt;
        color: ${WARM_GRAY};
      }
    }
    @page:first {
      margin: 0;
      background: ${DARK_BG};
      @top-right { content: ""; }
      @bottom-center { content: ""; }
      @bottom-left { content: ""; }
      @bottom-right { content: ""; }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --crimson: ${CRIMSON};
      --lime: ${LIME_GREEN};
      --dark: ${DARK_BG};
      --cream: ${CREAM};
      --black: ${NEAR_BLACK};
      --gray: ${WARM_GRAY};
      --light: ${LIGHT_GRAY};
      --white: ${WHITE};
      --gold: ${GOLD};
      --serif: ${SERIF};
      --sans: ${SANS};
    }

    html, body { background: var(--cream); }
    body {
      color: var(--black);
      font-family: var(--serif);
      font-size: 11pt;
      line-height: 1.65;
    }

    /* ── COVER PAGE ── */
    .cover {
      width: 215.9mm;
      min-height: 279.4mm;
      background: ${DARK_BG};
      color: ${WHITE};
      padding: 28mm 30mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      break-after: page;
    }
    .cover-top {
      text-align: center;
      padding-bottom: 14pt;
      border-bottom: 2pt solid ${CRIMSON};
    }
    .cover-logo {
      width: 180pt;
      height: auto;
      margin-bottom: 10pt;
    }
    .cover-company-name {
      font-family: var(--sans);
      font-size: 24pt;
      font-weight: 600;
      letter-spacing: 1.5pt;
      color: ${WHITE};
    }
    .cover-company-sub {
      font-family: var(--serif);
      font-size: 10pt;
      color: ${WARM_GRAY};
      margin-top: 4pt;
      letter-spacing: 0.5pt;
    }
    .cover-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      padding: 24pt 0;
    }
    .cover-eyebrow {
      font-family: var(--sans);
      font-size: 9pt;
      color: ${LIME_GREEN};
      letter-spacing: 3pt;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 18pt;
    }
    .cover-title {
      font-family: var(--serif);
      font-size: 28pt;
      font-weight: 700;
      color: ${WHITE};
      line-height: 1.2;
      letter-spacing: -0.3pt;
      margin-bottom: 14pt;
    }
    .cover-sub {
      font-family: var(--serif);
      font-size: 12pt;
      color: rgba(255,255,255,0.7);
      line-height: 1.5;
      margin-bottom: 20pt;
    }
    .cert-tag {
      display: inline-block;
      background: ${LIME_GREEN};
      color: ${WHITE};
      font-family: var(--sans);
      font-size: 7.5pt;
      font-weight: 700;
      padding: 3pt 10pt;
      border-radius: 2pt;
      letter-spacing: 1pt;
      text-transform: uppercase;
      margin: 0 3pt;
    }
    .cover-footer {
      border-top: 1pt solid rgba(255,255,255,0.15);
      padding-top: 14pt;
      text-align: center;
    }
    .cover-meta {
      font-family: var(--serif);
      font-size: 9pt;
      color: rgba(255,255,255,0.65);
      line-height: 1.8;
    }
    .cover-meta strong { color: ${WHITE}; font-weight: 600; }
    .cover-accent-bottom {
      height: 2.5pt;
      background: ${CRIMSON};
      margin: 14pt -30mm -28mm -30mm;
      width: calc(100% + 60mm);
    }

    /* ── LETTERHEAD (page 2+) ── */
    .letterhead {
      text-align: right;
      padding-bottom: 8pt;
      border-bottom: 1.5pt solid ${CRIMSON};
      margin-bottom: 16pt;
    }
    .letterhead-name {
      font-family: var(--sans);
      font-size: 14pt;
      font-weight: 600;
      color: ${NEAR_BLACK};
    }
    .letterhead-certs {
      font-family: var(--sans);
      font-size: 7.5pt;
      color: ${LIME_GREEN};
      font-weight: 600;
      letter-spacing: 0.5pt;
      margin-top: 2pt;
    }
    .letterhead-contact {
      font-family: var(--serif);
      font-size: 8pt;
      color: ${WARM_GRAY};
      margin-top: 2pt;
    }

    /* ── HEADINGS ── */
    h1 {
      font-family: var(--serif);
      font-size: 20pt;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.2pt;
      margin: 0 0 12pt 0;
      border-left: 3pt solid ${CRIMSON};
      padding-left: 12pt;
      color: ${NEAR_BLACK};
      break-after: avoid;
    }
    h2, .h1-accent {
      font-family: var(--serif);
      font-size: 14pt;
      font-weight: 700;
      line-height: 1.3;
      margin: 24pt 0 8pt 0;
      color: ${NEAR_BLACK};
      break-after: avoid;
      string-set: section-title content();
    }
    .h1-accent {
      border-left: 3pt solid ${CRIMSON};
      padding-left: 12pt;
      margin-top: 28pt;
    }
    h3 {
      font-family: var(--serif);
      font-size: 12pt;
      font-weight: 600;
      font-style: italic;
      line-height: 1.3;
      margin: 16pt 0 6pt 0;
      color: ${WARM_GRAY};
      break-after: avoid;
    }
    .chapter-label {
      font-family: var(--sans);
      font-size: 8pt;
      color: ${CRIMSON};
      letter-spacing: 2pt;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4pt;
    }

    /* ── TEXT (MLA-style) ── */
    p {
      margin: 0 0 0 0;
      text-indent: 24pt;
      line-height: 1.65;
      color: var(--black);
      text-align: justify;
    }
    p + p { margin-top: 4pt; }
    .lead {
      font-size: 11.5pt;
      line-height: 1.65;
      color: ${NEAR_BLACK};
      margin-bottom: 8pt;
      text-indent: 24pt;
      text-align: justify;
    }
    .no-indent { text-indent: 0; }
    strong { font-weight: 700; }
    em { font-style: italic; color: ${WARM_GRAY}; }
    a { color: ${CRIMSON}; text-decoration: none; }

    ul, ol { margin: 6pt 0 10pt 0; padding-left: 24pt; line-height: 1.65; }
    ul li::marker { color: ${CRIMSON}; }
    li { margin: 3pt 0; }

    /* ── TABLE ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin: 10pt 0;
      break-inside: avoid;
    }
    th {
      text-align: left;
      font-family: var(--sans);
      font-weight: 600;
      color: ${WHITE};
      padding: 6pt 8pt;
      border-bottom: 1pt solid #333;
      background: ${NEAR_BLACK};
    }
    td {
      padding: 5pt 8pt;
      border-bottom: 0.3pt solid ${LIGHT_GRAY};
      vertical-align: top;
    }
    table.striped tbody tr:nth-child(even) td { background: ${LIGHT_GRAY}; }
    table.compact th { padding: 3pt 6pt; font-size: 8pt; }
    table.compact td { padding: 2pt 6pt; font-size: 8pt; line-height: 1.4; }

    .mandatory-tag {
      display: inline-block;
      background: #fce8e8;
      color: ${RED_RISK};
      font-family: var(--sans);
      font-size: 6.5pt;
      font-weight: 600;
      padding: 1pt 5pt;
      border-radius: 2pt;
      text-transform: uppercase;
    }

    /* ── CALLOUT ── */
    .callout {
      background: #f0f5ee;
      border-left: 3pt solid ${LIME_GREEN};
      padding: 10pt 14pt;
      border-radius: 2pt;
      margin: 12pt 0;
      line-height: 1.55;
      break-inside: avoid;
      text-indent: 0;
    }

    /* ── AUTHORIZED PERSONNEL BLOCK ── */
    .auth-block {
      margin: 24pt 0;
      padding: 14pt 18pt;
      border: 1pt solid ${LIGHT_GRAY};
      border-left: 3pt solid ${LIME_GREEN};
      background: ${WHITE};
      break-inside: avoid;
    }
    .auth-block h3 {
      font-style: normal;
      font-family: var(--sans);
      color: ${NEAR_BLACK};
      margin-bottom: 6pt;
      font-size: 10pt;
    }
    .auth-block p {
      text-indent: 0;
      font-size: 9.5pt;
      margin: 2pt 0;
      text-align: left;
    }

    /* ── SECTION BREAKS ── */
    section { break-inside: avoid; }
    .chapter { break-before: page; }

    /* ── FOOTER ── */
    .doc-footer {
      margin-top: 30pt;
      padding-top: 8pt;
      border-top: 1.5pt solid ${CRIMSON};
      font-family: var(--sans);
      font-size: 7.5pt;
      color: ${WARM_GRAY};
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- COVER -->
  <section class="cover">
    <div class="cover-top">
      ${LOGO_DATA_URI ? `<img class="cover-logo" src="${LOGO_DATA_URI}" alt="Thrare Contracting">` : ''}
      <div class="cover-company-name">${escapeHtml(COMPANY.name)}</div>
      <div class="cover-company-sub">${escapeHtml(COMPANY.president)} | ${escapeHtml(COMPANY.dba)}</div>
    </div>
    <div class="cover-body">
      <div class="cover-eyebrow">Government Proposal</div>
      <div class="cover-title">${title}</div>
      <div class="cover-sub">Prepared for ${agency}${solNum ? ` | Solicitation ${escapeHtml(solNum)}` : ''}</div>
      <div style="margin-bottom:12pt">${certTags}</div>
    </div>
    <div class="cover-footer">
      <div class="cover-meta">
        <strong>${escapeHtml(COMPANY.address)}</strong><br>
        ${escapeHtml(COMPANY.phone)} | ${escapeHtml(COMPANY.email)}<br>
        UEI: ${escapeHtml(COMPANY.uei)} | CAGE: ${escapeHtml(COMPANY.cage)} | EIN: ${escapeHtml(COMPANY.ein)}<br><br>
        <strong>Response Due:</strong> ${dueDate} | <strong>Date Prepared:</strong> ${now}
      </div>
    </div>
    <div class="cover-accent-bottom"></div>
  </section>

  <!-- LETTERHEAD + EXECUTIVE SUMMARY as "A Note to the Contracting Office" -->
  <section>
    <div class="letterhead">
      <div class="letterhead-name">${escapeHtml(COMPANY.name)}</div>
      <div class="letterhead-certs">${COMPANY.certs.join(' | ')}</div>
      <div class="letterhead-contact">${escapeHtml(COMPANY.email)} | ${escapeHtml(COMPANY.phone)} | ${escapeHtml(COMPANY.address)}</div>
    </div>
    ${execSummary ? `
    <div class="chapter-label">Introduction</div>
    <h1>A Note to the Contracting Office</h1>
    <p class="lead">${escapeHtml(execSummary)}</p>
    ` : ''}

    <!-- AUTHORIZED OFFEROR PERSONNEL -->
    <div class="auth-block">
      <h3>Authorized Offeror Personnel</h3>
      <p><strong>${escapeHtml(COMPANY.president)}</strong></p>
      <p>${escapeHtml(COMPANY.name)} | DBA ${escapeHtml(COMPANY.dba)}</p>
      <p>${escapeHtml(COMPANY.address)}</p>
      <p>${escapeHtml(COMPANY.phone)} | ${escapeHtml(COMPANY.email)}</p>
      <p>UEI: ${escapeHtml(COMPANY.uei)} | CAGE: ${escapeHtml(COMPANY.cage)} | EIN: ${escapeHtml(COMPANY.ein)}</p>
    </div>
  </section>

  <!-- PROPOSAL BODY -->
  <section class="chapter">
    <div class="chapter-label">Proposal</div>
    <h1>Scope of Services</h1>
    ${draftHtml || '<p class="no-indent" style="color:#a33">[No draft content. Run Rough Draft and AI Review stages first.]</p>'}
  </section>

  <!-- COMPLIANCE MATRIX -->
  ${matrix.length > 0 ? `
  <section class="chapter">
    <div class="chapter-label">Appendix</div>
    <h1>Compliance Traceability</h1>
    <p class="lead no-indent">${matrix.length} requirements tracked, ${matrix.filter(r => r.mandatory).length} mandatory.</p>
    ${matrixHtml}
  </section>
  ` : ''}

  <div class="doc-footer">
    ${escapeHtml(COMPANY.name)} | DBA ${escapeHtml(COMPANY.dba)} | ${COMPANY.certs.join(' / ')} | CAGE: ${escapeHtml(COMPANY.cage)} | UEI: ${escapeHtml(COMPANY.uei)}
  </div>

</body>
</html>`;
}

/**
 * Generate a Thrare Contracting branded PDF for the given proposal.
 * Returns { fileName, filePath }.
 */
export async function createProposalPdf(proposal, draftMarkdown) {
  if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

  const slug = (proposal.title || 'proposal')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const fileName = `${slug}-final.pdf`;
  const pdfPath = path.join(EXPORTS_DIR, fileName);

  const html = buildHtml(proposal, draftMarkdown);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proposal-pdf-'));
  const htmlPath = path.join(tmpDir, 'proposal.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');

  const htmlExportPath = path.join(EXPORTS_DIR, `${slug}-final.html`);
  fs.writeFileSync(htmlExportPath, html, 'utf-8');

  try {
    execSync(
      `python3 -c "from weasyprint import HTML; HTML('${htmlPath}').write_pdf('${pdfPath}')"`,
      { timeout: 60_000, stdio: 'pipe' }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  return { fileName, filePath: pdfPath, htmlPath: htmlExportPath };
}
