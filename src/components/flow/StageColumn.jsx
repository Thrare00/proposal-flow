import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Circle } from 'lucide-react';

const StageColumn = ({ stage, proposals = [], isActive = false }) => {
  // Check if a due date is within 7 days or past
  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7;
  };

  return (
    <div className="flex flex-col min-w-[220px] h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-rare-sans uppercase text-sm font-bold">
            {stage.label}
          </h2>
          {proposals.length > 0 && (
            <Circle className="w-2 h-2 fill-current momentum-node-active" />
          )}
        </div>
        <p className="font-rare-serif text-xs text-rare-gray mt-1">
          {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'}
        </p>
      </div>

      {/* Proposals List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-rare-gray text-sm">
            —
          </div>
        ) : (
          proposals.map((proposal) => (
            <Link
              key={proposal.id}
              to={`/proposals/${proposal.id}`}
              className="block bg-white/95 dark:bg-rare-ink rounded-lg shadow-card p-3 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-medium truncate text-sm text-rare-ink dark:text-white">
                {proposal.title}
              </h3>
              <p className="text-xs text-rare-gray mt-1 truncate">
                {proposal.agency}
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDueSoon(proposal.dueDate)
                    ? 'text-rare-crimson'
                    : 'text-rare-gray'
                }`}
              >
                {proposal.dueDate
                  ? new Date(proposal.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No due date'}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

StageColumn.propTypes = {
  stage: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  proposals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      agency: PropTypes.string.isRequired,
      dueDate: PropTypes.string,
    })
  ),
  isActive: PropTypes.bool,
};

export default StageColumn;
