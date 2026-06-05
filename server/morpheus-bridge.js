import { mkdirSync, existsSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_WORKSPACE = '/home/ericw/.openclaw/workspace';

function getWorkspaceRoot() {
  return process.env.MORPHEUS_WORKSPACE_ROOT || DEFAULT_WORKSPACE;
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function safeWrite(filePath, contents) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, contents, 'utf8');
}

function safeAppend(filePath, contents) {
  ensureDir(path.dirname(filePath));
  appendFileSync(filePath, contents, 'utf8');
}

export function writeProposalTrigger(stage, proposal, payload = {}) {
  try {
    const workspace = getWorkspaceRoot();
    const triggerDir = path.join(workspace, 'proposals', 'triggers', stage);
    const triggerPath = path.join(triggerDir, `${proposal.id}.json`);
    const body = {
      proposalId: proposal.id,
      stage,
      createdAt: new Date().toISOString(),
      title: proposal.title,
      agency: proposal.agency,
      ...payload,
    };
    safeWrite(triggerPath, JSON.stringify(body, null, 2));
    return triggerPath;
  } catch {
    return null;
  }
}

export function writeProposalArtifact(proposal, artifact) {
  try {
    const workspace = getWorkspaceRoot();
    const artifactDir = path.join(workspace, 'proposals', 'artifacts', proposal.id);
    const artifactPath = path.join(artifactDir, `${artifact.id}.html`);
    safeWrite(artifactPath, artifact.html || '');
    return artifactPath;
  } catch {
    return null;
  }
}

export function appendStatusUpdate(line) {
  try {
    const workspace = getWorkspaceRoot();
    const statusPath = path.join(workspace, 'actions', 'proposal-flow-status.log');
    safeAppend(statusPath, `${line}\n`);
  } catch {
    // ignore
  }
}

export function updateTrackerLine(line) {
  try {
    const workspace = getWorkspaceRoot();
    const trackerPath = path.join(workspace, 'proposals', 'TRACKER.md');
    safeAppend(trackerPath, `${line}\n`);
  } catch {
    // ignore
  }
}
