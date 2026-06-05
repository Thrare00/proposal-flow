import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ATTACHMENTS_DIR = path.join(process.cwd(), 'server', 'data', 'attachments');
const DEFAULT_WORKSPACE_ROOT = process.env.PROPOSAL_FLOW_WORKSPACE_ROOT || '/home/ericw/.openclaw/workspace';

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function safeSegment(value, fallback = 'file') {
  return String(value || fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || fallback;
}

function withinRoot(targetPath, rootPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function detectContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.xls':
      return 'application/vnd.ms-excel';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.csv':
      return 'text/csv; charset=utf-8';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function hashFile(filePath) {
  const file = createReadStream(filePath);
  const hash = createHash('sha256');

  return new Promise((resolve, reject) => {
    file.on('data', (chunk) => hash.update(chunk));
    file.on('error', reject);
    file.on('end', () => resolve(hash.digest('hex')));
  });
}

export function getWorkspaceRoot() {
  return path.resolve(DEFAULT_WORKSPACE_ROOT);
}

export function getAttachmentsDir() {
  ensureDir(ATTACHMENTS_DIR);
  return ATTACHMENTS_DIR;
}

export function getProposalAttachmentDir(proposalId) {
  const dirPath = path.join(getAttachmentsDir(), safeSegment(proposalId, 'proposal'));
  ensureDir(dirPath);
  return dirPath;
}

export function isAllowedImportPath(sourcePath, workspaceRoot = getWorkspaceRoot()) {
  return withinRoot(path.resolve(sourcePath), path.resolve(workspaceRoot));
}

export async function buildImportCandidate(sourcePath, workspaceRoot = getWorkspaceRoot()) {
  const resolvedPath = path.resolve(sourcePath);
  const resolvedRoot = path.resolve(workspaceRoot);

  if (!withinRoot(resolvedPath, resolvedRoot)) {
    throw new Error(`Source path is outside workspace root: ${resolvedPath}`);
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`Source file does not exist: ${resolvedPath}`);
  }

  const stats = statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Source path is not a file: ${resolvedPath}`);
  }

  const sha256 = await hashFile(resolvedPath);
  const relativeSourcePath = path.relative(resolvedRoot, resolvedPath);
  const basename = path.basename(resolvedPath);

  return {
    sourcePath: resolvedPath,
    relativeSourcePath,
    basename,
    size: stats.size,
    sha256,
    contentType: detectContentType(resolvedPath),
    extension: path.extname(resolvedPath),
  };
}

export function materializeImportedFile({ proposalId, fileId, filename, sourcePath }) {
  const extension = path.extname(filename || sourcePath);
  const targetName = `${safeSegment(fileId, 'file')}-${safeSegment(path.basename(filename || sourcePath, extension), 'attachment')}${extension}`;
  const targetDir = getProposalAttachmentDir(proposalId);
  const storedRelativePath = path.posix.join('attachments', safeSegment(proposalId, 'proposal'), targetName);
  const targetPath = path.join(targetDir, targetName);

  copyFileSync(sourcePath, targetPath);

  return {
    storagePath: targetPath,
    storedRelativePath,
  };
}

export function getAttachmentAbsolutePath(proposalId, storedRelativePath) {
  const proposalDir = getProposalAttachmentDir(proposalId);
  const targetName = path.basename(storedRelativePath || '');
  return path.join(proposalDir, targetName);
}

export function getAttachmentContentType(fileRecord = {}) {
  return fileRecord.contentType || detectContentType(fileRecord.filename || fileRecord.name || '');
}
