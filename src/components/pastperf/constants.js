// Shared constants + tiny formatters for the Past Performance Library

export const CPARS_OPTIONS = [
  'Exceptional',
  'Very Good',
  'Satisfactory',
  'Marginal',
  'Unsatisfactory',
  'None',
];

export const OWNER_DEFAULT = 'Rare Earth';

export const EMPTY_RECORD = {
  contractName: '',
  agency: '',
  naics: '',
  psc: '',
  value: '',
  popStart: '',
  popEnd: '',
  cparsRating: 'None',
  relevanceBlurb: '',
  tags: '',
  owner: OWNER_DEFAULT,
};

// Legacy/server records may not have an owner yet — treat missing owner as ours.
export function isOurs(record) {
  const owner = (record?.owner || '').trim();
  return !owner || owner === OWNER_DEFAULT;
}

export function formatCurrency(value) {
  const num = Number(value);
  if (!isFinite(num) || num <= 0) return '—';
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function formatPop(popStart, popEnd) {
  if (!popStart && !popEnd) return '—';
  const fmt = (d) => {
    if (!d) return '?';
    const parsed = new Date(`${d}T00:00:00`);
    if (isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  return `${fmt(popStart)} – ${fmt(popEnd)}`;
}

export function parseTags(tagsString) {
  return String(tagsString || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
