export const STATUS_OPTIONS = [
  { value: 'intake', name: 'Intake' },
  { value: 'qualification', name: 'Qualification' },
  { value: 'pre_solicitation', name: 'Pre-solicitation' },
  { value: 'research', name: 'Research' },
  { value: 'technical_compliance', name: 'Compliance Matrix' },
  { value: 'pricing_strategy', name: 'Pricing Strategy' },
  { value: 'drafting', name: 'Rough Draft' },
  { value: 'review', name: 'AI Review' },
  { value: 'google_docs_final', name: 'Final Draft' },
  { value: 'submitted', name: 'Submitted' },
  { value: 'closed', name: 'Closed' },
];

const STATUS_NAME_MAP = Object.freeze({
  intake: 'Intake',
  qualification: 'Qualification',
  pre_solicitation: 'Pre-solicitation',
  research: 'Research',
  technical_compliance: 'Compliance Matrix',
  pricing_strategy: 'Pricing Strategy',
  drafting: 'Rough Draft',
  review: 'AI Review',
  google_docs_final: 'Final Draft',
  submitted: 'Submitted',
  closed: 'Closed',
  outline: 'Generate Outline',
  internal_review: 'AI Review',
  final_review: 'Final Draft',
  pricing_packaging: 'Pricing Strategy',
});

const STATUS_COLOR_MAP = Object.freeze({
  intake: 'bg-blue-100 text-blue-900',
  qualification: 'bg-cyan-100 text-cyan-900',
  pre_solicitation: 'bg-violet-100 text-violet-900',
  research: 'bg-indigo-100 text-indigo-900',
  technical_compliance: 'bg-amber-100 text-amber-900',
  pricing_strategy: 'bg-orange-100 text-orange-900',
  pricing_packaging: 'bg-orange-100 text-orange-900',
  drafting: 'bg-fuchsia-100 text-fuchsia-900',
  review: 'bg-emerald-100 text-emerald-900',
  google_docs_final: 'bg-green-100 text-green-900',
  submitted: 'bg-green-600 text-white',
  closed: 'bg-gray-200 text-gray-700',
  outline: 'bg-violet-100 text-violet-900',
  internal_review: 'bg-emerald-100 text-emerald-900',
  final_review: 'bg-green-100 text-green-900',
});

const STATUS_BORDER_MAP = Object.freeze({
  intake: 'border-blue-200',
  qualification: 'border-cyan-200',
  pre_solicitation: 'border-violet-200',
  research: 'border-indigo-200',
  technical_compliance: 'border-amber-200',
  pricing_strategy: 'border-orange-200',
  pricing_packaging: 'border-orange-200',
  drafting: 'border-fuchsia-200',
  review: 'border-emerald-200',
  google_docs_final: 'border-green-200',
  submitted: 'border-green-600',
  closed: 'border-gray-300',
  outline: 'border-violet-200',
  internal_review: 'border-emerald-200',
  final_review: 'border-green-200',
});

const STATUS_FLOW = STATUS_OPTIONS.map((option) => option.value);
const LEGACY_ALIAS_MAP = Object.freeze({
  outline: 'pre_solicitation',
  internal_review: 'review',
  final_review: 'google_docs_final',
  pricing_packaging: 'pricing_strategy',
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
