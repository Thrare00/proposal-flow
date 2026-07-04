import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'automation-db.json');
const raw = fs.readFileSync(DB_PATH, 'utf8');
const db = JSON.parse(raw);

const contaminationMarkers = [
  /^Morpheus Score:/mi,
  /^Universal Score:/mi,
  /^Recommendation:/mi,
  /^Award:/mi,
];

function isContaminated(text = '') {
  return contaminationMarkers.some((rx) => rx.test(text));
}

function sanitizeText(text = '') {
  const lines = String(text).split(/\r?\n/);
  const kept = [];
  const moved = [];
  for (const line of lines) {
    if (contaminationMarkers.some((rx) => rx.test(line))) {
      moved.push(line.trim());
      continue;
    }
    kept.push(line);
  }
  return {
    cleaned: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    moved,
  };
}

let changed = 0;
for (const proposal of Array.isArray(db.proposals) ? db.proposals : []) {
  const current = proposal.solicitationText || '';
  if (!current || !isContaminated(current)) continue;
  const { cleaned, moved } = sanitizeText(current);
  proposal.solicitationTextRaw = proposal.solicitationTextRaw || cleaned;
  proposal.solicitationText = '';
  proposal.metadata = proposal.metadata || {};
  proposal.metadata.intakeAnalysis = proposal.metadata.intakeAnalysis || {};
  proposal.metadata.rankingMetadata = proposal.metadata.rankingMetadata || {};
  proposal.metadata.sanitizedAt = new Date().toISOString();
  proposal.metadata.sanitizedFromContamination = true;
  proposal.metadata.rankingMetadata.sanitizedLines = moved;
  changed += 1;
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log(JSON.stringify({ ok: true, changed }, null, 2));
