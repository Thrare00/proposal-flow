// Minimal LLM helper for Proposal Flow stages.
// Wraps Anthropic (Claude Sonnet 4.6 by default) with graceful fallback.
// If ANTHROPIC_API_KEY is missing, isLlmAvailable() returns false and callers
// should fall back to deterministic logic.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { getAttachmentAbsolutePath } from './attachment-store.js';

const require = createRequire(import.meta.url);

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export function isLlmAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getLlmStatus() {
  return isLlmAvailable()
    ? `anthropic/${MODEL} enabled`
    : 'unavailable, using deterministic fallback';
}

async function callAnthropic({ system, userPrompt, maxTokens = 4096 }) {
  if (!isLlmAvailable()) {
    const err = new Error('LLM_UNAVAILABLE');
    err.code = 'LLM_UNAVAILABLE';
    throw err;
  }
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(60_000),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Anthropic request failed (${response.status})`);
  }
  return Array.isArray(data.content)
    ? data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    : '';
}

export async function generateText(systemPrompt, userPrompt, maxTokens = 4096) {
  const raw = await callAnthropic({ system: systemPrompt, userPrompt, maxTokens });
  return stripCodeFences(raw);
}

export async function generateJson(systemPrompt, userPrompt, fallback = {}, maxTokens = 4096) {
  const wrappedSystem = `${systemPrompt}\n\nRespond with ONLY valid JSON. No prose, no markdown fences.`;
  const raw = await callAnthropic({ system: wrappedSystem, userPrompt, maxTokens });
  return parseJsonSafe(raw, fallback);
}

export function stripCodeFences(value = '') {
  return String(value)
    .replace(/^```(?:json|markdown)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

export function parseJsonSafe(raw, fallback = {}) {
  const s = stripCodeFences(raw);
  try {
    return JSON.parse(s);
  } catch {
    // Try to extract the first JSON-looking substring.
    const match = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[1]); } catch {}
    }
    return fallback;
  }
}

async function extractPdfText(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const result = await pdfParse(readFileSync(filePath));
    const text = result?.text || '';
    if (text.trim().length >= 200) return text;

    // Fallback: check for OCR'd extracted_text.txt in ingest output directories
    const basename = path.basename(filePath, '.pdf');
    const ocrDirs = [
      '/home/ericw/morpheus/opportunities/active',
      '/home/ericw/.openclaw/workspace/opportunities/active',
    ];
    for (const dir of ocrDirs) {
      if (!existsSync(dir)) continue;
      try {
        const entries = require('fs').readdirSync(dir);
        // Find directory containing this filename slug
        const slug = basename.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
        const match = entries.find(e => e.includes(slug));
        if (match) {
          const extractedPath = path.join(dir, match, 'extracted_text.txt');
          if (existsSync(extractedPath)) {
            const ocrText = readFileSync(extractedPath, 'utf-8');
            if (ocrText.trim().length > text.trim().length) {
              console.log(`[llm] Using OCR'd text for ${basename} (${ocrText.length} chars)`);
              return ocrText;
            }
          }
        }
      } catch {}
    }
    return text;
  } catch (err) {
    console.warn(`[llm] PDF extract failed for ${filePath}: ${err.message}`);
    return '';
  }
}

// Build a concatenated text corpus from the proposal: solicitation text, notes,
// and all attached PDFs. Capped at ~150K chars (Claude has huge context).
export async function gatherSolicitationText(proposal) {
  const parts = [];
  if (proposal.solicitationText) parts.push(`SOLICITATION\n${proposal.solicitationText}`);
  if (proposal.notes) parts.push(`NOTES\n${proposal.notes}`);

  const files = Array.isArray(proposal.files) ? proposal.files : [];
  for (const file of files) {
    if (!file.storedRelativePath) continue;
    const name = file.filename || file.name || '';
    if (path.extname(name).toLowerCase() !== '.pdf') continue;
    const abs = getAttachmentAbsolutePath(proposal.id, file.storedRelativePath);
    if (!existsSync(abs)) continue;
    const text = await extractPdfText(abs);
    if (text.trim()) parts.push(`ATTACHMENT: ${name}\n${text}`);
  }

  return parts.join('\n\n---\n\n').slice(0, 150000);
}
