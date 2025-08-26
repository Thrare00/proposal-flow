export function ProposalStatusBadge({ status }) {
  const statusColors = {
    intake: 'bg-blue-100 text-blue-800',
    outline: 'bg-yellow-100 text-yellow-800',
    drafting: 'bg-orange-100 text-orange-800',
    internal_review: 'bg-purple-100 text-purple-800',
    final_review: 'bg-indigo-100 text-indigo-800',
    submitted: 'bg-green-100 text-green-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default ProposalStatusBadge;
