import { getStatusColor, getStatusName } from '../utils/statusUtils.js';

export function ProposalStatusBadge({ status }) {
  const colorClass = getStatusColor(status);
  const label = getStatusName(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export default ProposalStatusBadge;
