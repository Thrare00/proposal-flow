import React from 'react';
import PropTypes from 'prop-types';

const StatTile = ({ icon: Icon, label, value, tone = 'neutral', sublabel = undefined }) => {
  const toneStyles = {
    lime: {
      circle: 'bg-rare-lime/15 text-rare-lime-dark',
    },
    crimson: {
      circle: 'bg-rare-crimson/10 text-rare-crimson',
    },
    gold: {
      circle: 'bg-rare-gold/15 text-rare-gold',
    },
    neutral: {
      circle: 'bg-gray-100 text-rare-gray dark:bg-white/10 dark:text-white/60',
    },
  };

  const circleClass = toneStyles[tone].circle;

  return (
    <div className="bg-white/95 dark:bg-rare-ink rounded-xl shadow-card p-4">
      <div className="flex items-center gap-3">
        <div className={`${circleClass} p-2 rounded-lg flex-shrink-0`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-rare-sans text-xs uppercase tracking-wide text-rare-gray dark:text-white/50">
            {label}
          </p>
          <p className="text-2xl font-bold text-rare-ink dark:text-white">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-rare-gray/70 dark:text-white/40 mt-1">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

StatTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  tone: PropTypes.oneOf(['lime', 'crimson', 'gold', 'neutral']),
  sublabel: PropTypes.string,
};

export default StatTile;
