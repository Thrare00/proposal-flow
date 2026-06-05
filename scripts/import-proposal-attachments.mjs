import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { importLocalProposalAttachments } from '../server/proposal-attachments.js';

const proposalId = process.argv[2];
const attachmentsDir = process.argv[3];
const workspaceRoot = process.argv[4] || process.env.PROPOSAL_FLOW_WORKSPACE_ROOT || '/home/ericw/.openclaw/workspace';

if (!proposalId || !attachmentsDir) {
  console.error('Usage: node scripts/import-proposal-attachments.mjs <proposalId> <attachmentsDir> [workspaceRoot]');
  process.exit(1);
}

const sourcePaths = readdirSync(attachmentsDir)
  .filter((name) => name !== '.gitkeep')
  .map((name) => path.join(attachmentsDir, name))
  .filter((fullPath) => statSync(fullPath).isFile())
  .sort();

const result = await importLocalProposalAttachments({
  proposalId,
  sourcePaths,
  workspaceRoot,
});

console.log(JSON.stringify(result, null, 2));
