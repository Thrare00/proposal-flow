import React from 'react';
import PropTypes from 'prop-types';

const FunnelHeader = ({ counts, filteredOut = 0 }) => {
  const { watchlist = 0, review_queue = 0, active_pursuit = 0 } = counts || {};

  const stages = [
    { label: 'Watchlist', count: watchlist },
    { label: 'Review Queue', count: review_queue },
    { label: 'Active Pursuit', count: active_pursuit, isActive: true },
  ];

  return (
    <div className="bg-rare-ink/50 border border-rare-gold/20 rounded-lg p-6">
      {/* Funnel visualization */}
      <div className="flex items-center gap-8">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.label}>
            {/* Stage node */}
            <div className="flex flex-col items-center">
              <div className="font-rare-serif text-2xl font-bold text-rare-gold">
                {stage.count}
              </div>
              <div className="font-rare-sans text-xs uppercase text-rare-gray mt-1">
                {stage.label}
              </div>
              {stage.isActive && (
                <div className="momentum-node-active mt-2"></div>
              )}
            </div>

            {/* Rail connector between stages */}
            {index < stages.length - 1 && (
              <div className="momentum-fill flex-1 h-1 bg-rare-lime"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Hidden items caption */}
      {filteredOut > 0 && (
        <div className="mt-4 text-rare-gray text-xs">
          {filteredOut} hidden (past-due / due &lt;48h)
        </div>
      )}
    </div>
  );
};

FunnelHeader.propTypes = {
  counts: PropTypes.shape({
    watchlist: PropTypes.number,
    review_queue: PropTypes.number,
    active_pursuit: PropTypes.number,
  }).isRequired,
  filteredOut: PropTypes.number,
};

export default FunnelHeader;
