#!/usr/bin/env node
// One-time additive migration: persist Pipeline v2 (Eric's 7-stage bid pipeline,
// 2026-07-10) onto every proposal record in server/data/automation-db.json.
//
//   - workflow.pipeline            derived 7-stage overlay (never replaces
//                                  workflow.currentStage, which stays the driver)
//   - pricingGovernance            gains the dbeSubcontracting section; existing
//                                  data preserved verbatim
//   - pricingStrategy              new distinct stage-6 section (references, does
//                                  not duplicate, the governance constraints)
//
// SAFETY: run with the proposal-flow service STOPPED — automation-store caches
// the db in memory and would clobber a file edited underneath it.
// A timestamped backup of the db is written before any change.
import { copyFileSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildPipelineV2,
  createPricingGovernance,
  createPricingStrategy,
} from '../shared/proposalWorkflow.js';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'automation-db.json');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `${DB_PATH}.bak-pipelinev2-${stamp}`;

copyFileSync(DB_PATH, backupPath);
console.log(`Backup written: ${backupPath}`);

const db = JSON.parse(readFileSync(DB_PATH, 'utf8'));
const rows = [];

for (const p of db.proposals || []) {
  p.workflow = p.workflow || {};
  const beforeStage = p.workflow.currentStage || null;
  p.workflow.pipeline = buildPipelineV2(p, p.workflow);

  const pgDefaults = createPricingGovernance();
  p.pricingGovernance = p.pricingGovernance || {};
  if (!p.pricingGovernance.dbeSubcontracting) {
    p.pricingGovernance.dbeSubcontracting = pgDefaults.dbeSubcontracting;
  }
  if (!p.pricingStrategy) {
    p.pricingStrategy = createPricingStrategy();
  }

  rows.push({
    id: (p.id || '').slice(0, 24),
    title: (p.title || '').slice(0, 40),
    status: p.status || '',
    oldStage: beforeStage || '(none)',
    pipelineV2: p.workflow.pipeline.currentStage,
  });
}

const tmpPath = `${DB_PATH}.tmp-migrate`;
writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
renameSync(tmpPath, DB_PATH);

console.log(`Migrated ${rows.length} proposal(s).`);
console.table(rows);
