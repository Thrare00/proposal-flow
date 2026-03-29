export const STATUS_OPTIONS = [
  { value: 'intake', name: 'Intake' },
  { value: 'qualification', name: 'Qualification' },
  { value: 'pre_solicitation', name: 'Pre-Solicitation Brief' },
  { value: 'research', name: 'Research' },
  { value: 'technical_compliance', name: 'Technical / Compliance' },
  { value: 'pricing_packaging', name: 'Pricing / Packaging' },
  { value: 'drafting', name: 'Claude Drafting' },
  { value: 'review', name: 'ChatGPT Review' },
  { value: 'google_docs_final', name: 'Google Docs Final' },
  { value: 'submitted', name: 'Submitted' },
];

const STATUS_NAME_MAP = Object.freeze({
  intake: 'Intake',
  qualification: 'Qualification',
  pre_solicitation: 'Pre-Solicitation Brief',
  research: 'Research',
  technical_compliance: 'Technical / Compliance',
  pricing_packaging: 'Pricing / Packaging',
  drafting: 'Claude Drafting',
  review: 'ChatGPT Review',
  google_docs_final: 'Google Docs Final',
  submitted: 'Submitted',
  outline: 'Pre-Solicitation Brief',
  internal_review: 'ChatGPT Review',
  final_review: 'Google Docs Final',
});

const STATUS_COLOR_MAP = Object.freeze({
  intake: 'bg-blue-50 text-blue-800',
  qualification: 'bg-cyan-50 text-cyan-800',
  pre_solicitation: 'bg-violet-50 text-violet-800',
  research: 'bg-indigo-50 text-indigo-800',
  technical_compliance: 'bg-amber-50 text-amber-800',
  pricing_packaging: 'bg-orange-50 text-orange-800',
  drafting: 'bg-fuchsia-50 text-fuchsia-800',
  review: 'bg-emerald-50 text-emerald-800',
  google_docs_final: 'bg-green-50 text-green-800',
  submitted: 'bg-green-600 text-white',
  outline: 'bg-violet-50 text-violet-800',
  internal_review: 'bg-emerald-50 text-emerald-800',
  final_review: 'bg-green-50 text-green-800',
});

const STATUS_BORDER_MAP = Object.freeze({
  intake: 'border-blue-200',
  qualification: 'border-cyan-200',
  pre_solicitation: 'border-violet-200',
  research: 'border-indigo-200',
  technical_compliance: 'border-amber-200',
  pricing_packaging: 'border-orange-200',
  drafting: 'border-fuchsia-200',
  review: 'border-emerald-200',
  google_docs_final: 'border-green-200',
  submitted: 'border-green-600',
  outline: 'border-violet-200',
  internal_review: 'border-emerald-200',
  final_review: 'border-green-200',
});

const STATUS_FLOW = STATUS_OPTIONS.map((option) => option.value);
const LEGACY_ALIAS_MAP = Object.freeze({
  outline: 'pre_solicitation',
  internal_review: 'review',
  final_review: 'google_docs_final',
});

function normalizeStatus(status) {
  if (!status) return 'intake';
  return LEGACY_ALIAS_MAP[status] || status;
}

export const getStatusName = (status) => STATUS_NAME_MAP[status] || STATUS_NAME_MAP[normalizeStatus(status)] || 'Unknown';
export const getStatusColor = (status) => STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[normalizeStatus(status)] || 'bg-gray-50 text-gray-700';
export const getStatusBorderColor = (status) => STATUS_BORDER_MAP[status] || STATUS_BORDER_MAP[normalizeStatus(status)] || 'border-gray-200';
export const getStatusOrder = (status) => {
  const normalized = normalizeStatus(status);
  const index = STATUS_FLOW.indexOf(normalized);
  return index === -1 ? STATUS_FLOW.length : index;
};
export const getAllStatuses = () => [...STATUS_FLOW];
export const getNextStatus = (status) => {
  const normalized = normalizeStatus(status);
  const index = STATUS_FLOW.indexOf(normalized);
  if (index === -1 || index === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
};
export const getPreviousStatus = (status) => {
  const normalized = normalizeStatus(status);
  const index = STATUS_FLOW.indexOf(normalized);
  if (index <= 0) return null;
  return STATUS_FLOW[index - 1];
};

export const getUrgencyLevel = (dueDate) => {
  if (!dueDate) return 'low';

  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'critical';
  if (diffDays <= 7) return 'high';
  if (diffDays <= 14) return 'medium';
  return 'low';
};
