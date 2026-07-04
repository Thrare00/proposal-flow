import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const BlockedQueue = ({ items = [] }) => {
  const getRelativeTime = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'just now';
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-rare-lime/5 p-6 text-center shadow-card">
        <CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-rare-lime" />
        <p className="font-medium text-rare-lime">Nothing blocked — clear runway.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-rare-crimson/10 p-6 shadow-card">
      <h2 className="mb-4 font-rare-sans text-sm font-bold uppercase tracking-wide text-rare-ink">
        Blocked
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.proposalId}
            className="flex flex-col gap-2 border-b border-rare-gray/20 pb-4 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/proposals/${item.proposalId}`}
                className="text-base font-medium text-rare-ink transition-colors hover:text-rare-crimson"
              >
                {item.proposalTitle}
              </Link>
              <span className="whitespace-nowrap text-xs text-rare-gray">
                {getRelativeTime(item.since)}
              </span>
            </div>

            {item.reasons && item.reasons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.reasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="inline-block rounded-full bg-rare-crimson/10 px-2.5 py-1 text-xs font-medium text-rare-crimson"
                  >
                    {reason.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

BlockedQueue.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      proposalId: PropTypes.string.isRequired,
      proposalTitle: PropTypes.string.isRequired,
      reasons: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.oneOf(['handoff', 'overdue_task', 'compliance']).isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
      since: PropTypes.string.isRequired,
    })
  ),
};

export default BlockedQueue;
