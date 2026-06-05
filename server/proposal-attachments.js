import { createId, getDb, nowIso, updateDb } from './automation-store.js';
import {
  buildImportCandidate,
  getWorkspaceRoot,
  materializeImportedFile,
} from './attachment-store.js';

function normalizeProposalFileRecord(file = {}) {
  const filename = file.filename || file.name || 'attachment';
  return {
    ...file,
    name: file.name || filename,
    filename,
    url: file.url || null,
  };
}

function listDuplicateFile(proposal, candidate) {
  const files = Array.isArray(proposal.files) ? proposal.files : [];
  return files.find((file) => (
    (file.sha256 && file.sha256 === candidate.sha256)
    || (file.sourcePath && file.sourcePath === candidate.sourcePath)
    || (
      file.filename === candidate.basename
      && Number(file.size || -1) === Number(candidate.size)
      && file.relativeSourcePath === candidate.relativeSourcePath
    )
  )) || null;
}

export async function importLocalProposalAttachments({ proposalId, sourcePaths, workspaceRoot }) {
  const normalizedSourcePaths = Array.isArray(sourcePaths) ? sourcePaths.filter(Boolean) : [];
  const resolvedWorkspaceRoot = workspaceRoot || getWorkspaceRoot();

  if (!proposalId) {
    const error = new Error('proposalId is required');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedSourcePaths.length === 0) {
    const error = new Error('sourcePaths is required and must contain at least one file path');
    error.statusCode = 400;
    throw error;
  }

  const existingDb = getDb();
  const proposal = existingDb.proposals.find((item) => item.id === proposalId);
  if (!proposal) {
    const error = new Error('Proposal not found');
    error.statusCode = 404;
    throw error;
  }

  const prepared = [];
  const invalid = [];

  for (const sourcePath of normalizedSourcePaths) {
    try {
      prepared.push(await buildImportCandidate(sourcePath, resolvedWorkspaceRoot));
    } catch (error) {
      invalid.push({
        sourcePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (prepared.length === 0) {
    const error = new Error('No valid source files were provided');
    error.statusCode = 400;
    error.details = invalid;
    throw error;
  }

  const imported = [];
  const skipped = [];

  updateDb((workingDb) => {
    const targetProposal = workingDb.proposals.find((item) => item.id === proposalId);
    if (!targetProposal) {
      return workingDb;
    }

    targetProposal.files = Array.isArray(targetProposal.files)
      ? targetProposal.files.map(normalizeProposalFileRecord)
      : [];

    for (const candidate of prepared) {
      const duplicate = listDuplicateFile(targetProposal, candidate);
      if (duplicate) {
        skipped.push({
          sourcePath: candidate.sourcePath,
          reason: 'duplicate',
          existingFileId: duplicate.id,
          filename: duplicate.filename || duplicate.name,
        });
        continue;
      }

      const fileId = createId('file');
      const stored = materializeImportedFile({
        proposalId,
        fileId,
        filename: candidate.basename,
        sourcePath: candidate.sourcePath,
      });
      const createdAt = nowIso();
      const url = `/proposal-flow/api/proposals/${encodeURIComponent(proposalId)}/files/${encodeURIComponent(fileId)}`;
      const record = normalizeProposalFileRecord({
        id: fileId,
        name: candidate.basename,
        filename: candidate.basename,
        type: candidate.contentType,
        contentType: candidate.contentType,
        size: candidate.size,
        createdAt,
        status: 'completed',
        source: 'local-import',
        sourcePath: candidate.sourcePath,
        relativeSourcePath: candidate.relativeSourcePath,
        sha256: candidate.sha256,
        storagePath: stored.storagePath,
        storedRelativePath: stored.storedRelativePath,
        url,
      });
      targetProposal.files.push(record);
      imported.push({
        id: record.id,
        filename: record.filename,
        sourcePath: record.sourcePath,
        relativeSourcePath: record.relativeSourcePath,
        size: record.size,
        url: record.url,
      });
    }

    if (imported.length > 0) {
      targetProposal.updatedAt = nowIso();
    }

    return workingDb;
  });

  return {
    ok: true,
    proposalId,
    workspaceRoot: resolvedWorkspaceRoot,
    imported,
    skipped,
    invalid,
  };
}
