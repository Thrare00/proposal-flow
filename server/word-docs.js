/**
 * Creates a professional .docx Final Draft using Thrare Contracting branding.
 * Returns { filePath, fileName }.
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel, Header } from 'docx';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// ── Thrare Contracting Brand (from actual logo: crimson red butterfly + lime green "RARE") ──
const BG_DARK = '111111';      // dark cinematic cover
const CARD_BG = '111111';
const CARD_BORDER = '333333';
const ROW_ALT = 'E8E6E3';     // warm light gray alternating rows
const RE_RED = 'CC1111';       // logo crimson red - primary accent
const LIME_GREEN = '6ABF1E';   // logo lime green - cert badges
const TEXT_PRIMARY = '1A1A1A'; // near-black body text
const TEXT_SECONDARY = '6B6B6B'; // warm gray
const TEXT_ON_DARK = 'FFFFFF'; // white on dark bg

const HEADING_FONT = 'Bookman Old Style';
const BODY_FONT = 'Bookman Old Style';

// ── Company info ──
const COMPANY = {
  name: 'Thrare Contracting',
  president: 'Eric White – President',
  email: 'admin@thrarecontracting.com',
  phone: '(678) 748-3578',
  uei: 'Z4WKS4UE8NJ6',
  cage: '9JAV8',
};

// ── Markdown → docx Paragraphs ──
function parseInlineRuns(text) {
  const runs = [];
  let i = 0;
  const re = /\*\*([^*]+)\*\*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(i, m.index);
    if (before) {
      runs.push(new TextRun({ text: before, font: BODY_FONT, size: 24, color: TEXT_PRIMARY }));
    }
    runs.push(new TextRun({ text: m[1], font: BODY_FONT, size: 24, color: TEXT_PRIMARY, bold: true }));
    i = m.index + m[0].length;
  }
  const rest = text.slice(i);
  if (rest) {
    runs.push(new TextRun({ text: rest, font: BODY_FONT, size: 24, color: TEXT_PRIMARY }));
  }
  return runs;
}

function parseMarkdownToDocxParagraphs(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const paragraphs = [];

  let tableRows = [];
  const flushTable = () => {
    if (tableRows.length === 0) return;
    const table = new Table({
      rows: tableRows.map((cells, rowIdx) =>
        new TableRow({
          children: cells.map(cell =>
            new TableCell({
              width: { size: Math.floor(9000 / cells.length), type: WidthType.DXA },
              shading: { fill: rowIdx === 0 ? BG_DARK : (rowIdx % 2 === 0 ? ROW_ALT : 'FFFFFF') },
              children: [new Paragraph({
                children: [new TextRun({
                  text: cell.trim(),
                  font: BODY_FONT,
                  size: 22,
                  color: rowIdx === 0 ? TEXT_ON_DARK : TEXT_PRIMARY,
                  bold: rowIdx === 0,
                })],
              })],
            })
          ),
        })
      ),
      width: { size: 9000, type: WidthType.DXA },
    });
    paragraphs.push(table);
    tableRows = [];
  };

  for (const line of lines) {
    // Table separator row (e.g. |---|---|)
    if (/^\|[\s-:|]+\|$/.test(line)) continue;

    // Table row
    if (/^\|.+\|$/.test(line)) {
      const cells = line.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    }

    // Flush any pending table
    flushTable();

    if (/^#\s+(.+)/.test(line)) {
      const text = line.replace(/^#\s+/, '');
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 120 },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: RE_RED } },
        children: [new TextRun({ text, font: HEADING_FONT, size: 32, bold: true, color: TEXT_PRIMARY })],
      }));
    } else if (/^##\s+(.+)/.test(line)) {
      const text = line.replace(/^##\s+/, '');
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 100 },
        border: { left: { style: BorderStyle.SINGLE, size: 4, color: RE_RED } },
        children: [new TextRun({ text, font: HEADING_FONT, size: 28, bold: true, color: TEXT_PRIMARY })],
      }));
    } else if (/^###\s+(.+)/.test(line)) {
      const text = line.replace(/^###\s+/, '');
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text, font: HEADING_FONT, size: 24, bold: true, color: TEXT_SECONDARY })],
      }));
    } else if (/^[-*]\s+(.+)/.test(line)) {
      const text = line.replace(/^[-*]\s+/, '');
      paragraphs.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
        children: parseInlineRuns(text),
      }));
    } else if (/^---+$/.test(line)) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: RE_RED } },
        children: [],
      }));
    } else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }));
    } else {
      paragraphs.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        children: parseInlineRuns(line),
      }));
    }
  }
  flushTable();
  return paragraphs;
}

// ── Main export ──
export async function createFinalDraftDocx(proposal, sourceDraft) {
  const title = proposal.title || 'Untitled Proposal';
  const agency = proposal.agency || 'Unknown Agency';
  const dueDate = proposal.dueDate || 'TBD';
  const solNumber = proposal.metadata?.solicitationNumber || proposal.metadata?.noticeId || '';

  // Build the letterhead header (appears on every page)
  const headerChildren = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
      children: [new TextRun({ text: COMPANY.name, font: HEADING_FONT, size: 36, bold: true, color: TEXT_PRIMARY })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 20 },
      children: [
        new TextRun({ text: 'MBE', font: HEADING_FONT, size: 16, bold: true, color: LIME_GREEN }),
        new TextRun({ text: ' \u00B7 ', font: HEADING_FONT, size: 16, color: TEXT_SECONDARY }),
        new TextRun({ text: 'DBE', font: HEADING_FONT, size: 16, bold: true, color: LIME_GREEN }),
        new TextRun({ text: ' \u00B7 ', font: HEADING_FONT, size: 16, color: TEXT_SECONDARY }),
        new TextRun({ text: 'SDB', font: HEADING_FONT, size: 16, bold: true, color: LIME_GREEN }),
        new TextRun({ text: ' \u00B7 ', font: HEADING_FONT, size: 16, color: TEXT_SECONDARY }),
        new TextRun({ text: 'BAO', font: HEADING_FONT, size: 16, bold: true, color: LIME_GREEN }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 20 },
      children: [new TextRun({ text: `${COMPANY.email}  |  ${COMPANY.phone}`, font: BODY_FONT, size: 18, color: TEXT_SECONDARY })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 },
      children: [new TextRun({ text: `UEI: ${COMPANY.uei}  |  CAGE: ${COMPANY.cage}`, font: BODY_FONT, size: 18, color: TEXT_SECONDARY })],
    }),
  ];

  // Cover section  - dark cinematic editorial
  const coverParagraphs = [
    new Paragraph({
      spacing: { before: 600, after: 200 },
      children: [new TextRun({ text: title, font: HEADING_FONT, size: 48, bold: true, color: TEXT_PRIMARY })],
    }),
    // Green accent line
    new Paragraph({
      spacing: { before: 0, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RE_RED } },
      children: [],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `Agency: ${agency}`, font: BODY_FONT, size: 24, color: TEXT_PRIMARY }),
        new TextRun({ text: `   |   Due: ${dueDate}`, font: BODY_FONT, size: 24, color: TEXT_PRIMARY }),
        ...(solNumber ? [new TextRun({ text: `   |   Solicitation: ${solNumber}`, font: BODY_FONT, size: 24, color: TEXT_PRIMARY })] : []),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Prepared by: ', font: BODY_FONT, size: 22, color: TEXT_SECONDARY }),
        new TextRun({ text: COMPANY.name, font: BODY_FONT, size: 22, bold: true, color: TEXT_PRIMARY }),
        new TextRun({ text: `  |  ${COMPANY.president}`, font: BODY_FONT, size: 22, color: TEXT_SECONDARY }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `UEI: ${COMPANY.uei}  |  CAGE: ${COMPANY.cage}`, font: BODY_FONT, size: 20, color: TEXT_SECONDARY }),
      ],
    }),
    // Cert badges
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: ' MBE ', font: HEADING_FONT, size: 20, bold: true, color: '000000', shading: { fill: LIME_GREEN } }),
        new TextRun({ text: '  ', font: BODY_FONT, size: 20 }),
        new TextRun({ text: ' DBE ', font: HEADING_FONT, size: 20, bold: true, color: '000000', shading: { fill: LIME_GREEN } }),
        new TextRun({ text: '  ', font: BODY_FONT, size: 20 }),
        new TextRun({ text: ' SDB ', font: HEADING_FONT, size: 20, bold: true, color: '000000', shading: { fill: LIME_GREEN } }),
        new TextRun({ text: '  ', font: BODY_FONT, size: 20 }),
        new TextRun({ text: ' BAO ', font: HEADING_FONT, size: 20, bold: true, color: '000000', shading: { fill: LIME_GREEN } }),
      ],
    }),
  ];

  // Body paragraphs from the markdown draft
  const bodyParagraphs = parseMarkdownToDocxParagraphs(sourceDraft || '[No upstream draft content]');

  const doc = new Document({
    sections: [{
      headers: {
        default: new Header({ children: headerChildren }),
      },
      children: [...coverParagraphs, ...bodyParagraphs],
    }],
  });

  // Write file
  const exportDir = path.resolve('server/data/exports');
  mkdirSync(exportDir, { recursive: true });

  const sanitized = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  const timestamp = Date.now();
  const fileName = `FinalDraft_${sanitized}_${timestamp}.docx`;
  const filePath = path.join(exportDir, fileName);

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(filePath, buffer);

  return { filePath, fileName };
}
