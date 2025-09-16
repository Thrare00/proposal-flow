import React from 'react';

export function UrgencyBadge({ urgency }) {
  const urgencyColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyColors[urgency]}`}>
      {urgency.replace('_', ' ')}
    </span>
  );
}

export default UrgencyBadge;
