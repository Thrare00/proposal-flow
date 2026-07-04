import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Info, X } from 'lucide-react';

export default function ActivityCoverageNote({ missingSources = [] }) {
  const [dismissed, setDismissed] = useState(false);

  // Return nothing if no missing sources or dismissed
  if (missingSources.length === 0 || dismissed) {
    return null;
  }

  return (
    <div className="bg-rare-gold/10 dark:bg-rare-gold/5 border border-rare-gold/20 dark:border-rare-gold/15 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-rare-gold flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-rare-sans font-semibold text-sm uppercase tracking-wide text-rare-ink dark:text-rare-gold mb-2">
            Coverage
          </h3>
          <ul className="space-y-1 text-sm text-rare-gray dark:text-rare-gray/80">
            {missingSources.map((source, idx) => (
              <li key={idx}>
                <span className="font-semibold">{source.label}</span>
                {' — '}
                <span>{source.reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 hover:bg-rare-gold/10 dark:hover:bg-rare-gold/10 rounded transition-colors text-rare-ink dark:text-rare-gold"
          aria-label="Dismiss coverage note"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

ActivityCoverageNote.propTypes = {
  missingSources: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      reason: PropTypes.string.isRequired,
    })
  ),
};
