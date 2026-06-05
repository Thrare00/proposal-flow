import { ProposalStatus } from '../types.js';
import type { ProposalStatusOrNull } from '../types.js';

// Canonical stage flow (matches shared/proposalWorkflow.js)
const STATUS_OPTIONS: { value: string; name: string }[] = [
  { value: 'ingestion', name: 'Ingestion' },
  { value: 'compliance', name: 'Compliance' },
  { value: 'strategy', name: 'Pre-solicitation' },
  { value: 'outline', name: 'Outline' },
  { value: 'pricing_strategy', name: 'Pricing Strategy' },
  { value: 'drafting', name: 'Drafting' },
  { value: 'red_team', name: 'AI Review' },
  { value: 'final_review', name: 'Final Draft' },
  { value: 'submitted', name: 'Submitted' },
  { value: 'closed', name: 'Closed' },
];

const STATUS_NAME_MAP: Record<string, string> = {
  ingestion: 'Ingestion',
  compliance: 'Compliance',
  strategy: 'Pre-solicitation',
  outline: 'Outline',
  pricing_strategy: 'Pricing Strategy',
  drafting: 'Drafting',
  red_team: 'AI Review',
  final_review: 'Final Draft',
  submitted: 'Submitted',
  closed: 'Closed',
  // Legacy aliases
  intake: 'Intake',
  qualification: 'Qualification',
  pre_solicitation: 'Pre-solicitation',
  research: 'Research',
  technical_compliance: 'Compliance Matrix',
  pricing_packaging: 'Pricing Strategy',
  review: 'AI Review',
  google_docs_final: 'Final Draft',
  internal_review: 'AI Review',
};

const STATUS_COLOR_MAP: Record<string, string> = {
  ingestion: 'bg-blue-50 text-blue-800',
  compliance: 'bg-amber-50 text-amber-800',
  strategy: 'bg-violet-50 text-violet-800',
  outline: 'bg-indigo-50 text-indigo-800',
  pricing_strategy: 'bg-orange-50 text-orange-800',
  drafting: 'bg-fuchsia-50 text-fuchsia-800',
  red_team: 'bg-emerald-50 text-emerald-800',
  final_review: 'bg-green-50 text-green-800',
  submitted: 'bg-green-600 text-white',
  closed: 'bg-gray-100 text-gray-500',
  // Legacy aliases
  intake: 'bg-blue-50 text-blue-800',
  qualification: 'bg-cyan-50 text-cyan-800',
  pre_solicitation: 'bg-violet-50 text-violet-800',
  research: 'bg-indigo-50 text-indigo-800',
  technical_compliance: 'bg-amber-50 text-amber-800',
  pricing_packaging: 'bg-orange-50 text-orange-800',
  review: 'bg-emerald-50 text-emerald-800',
  google_docs_final: 'bg-green-50 text-green-800',
  internal_review: 'bg-emerald-50 text-emerald-800',
};

const STATUS_BORDER_MAP: Record<string, string> = {
  ingestion: 'border-blue-200',
  compliance: 'border-amber-200',
  strategy: 'border-violet-200',
  outline: 'border-indigo-200',
  pricing_strategy: 'border-orange-200',
  drafting: 'border-fuchsia-200',
  red_team: 'border-emerald-200',
  final_review: 'border-green-200',
  submitted: 'border-green-600',
  closed: 'border-gray-300',
  // Legacy aliases
  intake: 'border-blue-200',
  qualification: 'border-cyan-200',
  pre_solicitation: 'border-violet-200',
  research: 'border-indigo-200',
  technical_compliance: 'border-amber-200',
  pricing_packaging: 'border-orange-200',
  review: 'border-emerald-200',
  google_docs_final: 'border-green-200',
  internal_review: 'border-emerald-200',
};

const STATUS_FLOW = STATUS_OPTIONS.map((o) => o.value);

const LEGACY_ALIAS_MAP: Record<string, string> = {
  intake: 'ingestion',
  qualification: 'ingestion',
  pre_solicitation: 'strategy',
  research: 'strategy',
  technical_compliance: 'compliance',
  pricing_packaging: 'pricing_strategy',
  review: 'red_team',
  google_docs_final: 'final_review',
  internal_review: 'red_team',
};

function normalizeStatus(status: string): string {
  if (!status) return 'ingestion';
  return LEGACY_ALIAS_MAP[status] || status;
}

export const getStatusName = (status: ProposalStatus): string =>
  STATUS_NAME_MAP[status] || STATUS_NAME_MAP[normalizeStatus(status)] || 'Unknown';

export const getStatusColor = (status: ProposalStatus): string =>
  STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[normalizeStatus(status)] || 'bg-gray-50 text-gray-700';

export const getStatusBorderColor = (status: ProposalStatus): string =>
  STATUS_BORDER_MAP[status] || STATUS_BORDER_MAP[normalizeStatus(status)] || 'border-gray-200';

export const getStatusOrder = (status: ProposalStatus): number => {
  const normalized = normalizeStatus(status);
  const index = STATUS_FLOW.indexOf(normalized);
  return index === -1 ? STATUS_FLOW.length : index;
};

export const getAllStatuses = (): ProposalStatus[] =>
  [...STATUS_FLOW] as ProposalStatus[];

export const getNextStatus = (status: ProposalStatus): ProposalStatusOrNull => {
  const normalized = normalizeStatus(status);
  const index = STATUS_FLOW.indexOf(normalized);
  if (index === -1 || index === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1] as ProposalStatus;
};

export const getPreviousStatus = (status: ProposalStatus): ProposalStatusOrNull => {
  const normalized = normalizeStatus(status);
  const index = STATUS_FLOW.indexOf(normalized);
  if (index <= 0) return null;
  return STATUS_FLOW[index - 1] as ProposalStatus;
};
