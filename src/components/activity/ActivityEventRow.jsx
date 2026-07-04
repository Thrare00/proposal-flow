import React from 'react';
import PropTypes from 'prop-types';
import { Send, CheckCircle, ArrowRight, Mail, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActivityEventRow = ({ event }) => {
  const { id, ts, type, label, proposalId, proposalTitle, meta } = event;

  // Icon and color by type
  const getIconAndColors = () => {
    switch (type) {
      case 'submission':
        return {
          Icon: CheckCircle,
          bgClass: 'bg-rare-gold/15',
          textClass: 'text-rare-gold',
        };
      case 'stage_change':
        return {
          Icon: ArrowRight,
          bgClass: 'bg-rare-lime/15',
          textClass: 'text-rare-lime',
        };
      case 'outreach':
        return {
          Icon: Mail,
          bgClass: 'bg-rare-ink/10 dark:bg-white/10',
          textClass: 'text-rare-ink dark:text-white/70',
        };
      case 'workflow':
        return {
          Icon: Activity,
          bgClass: 'bg-gray-100 dark:bg-white/10',
          textClass: 'text-rare-gray dark:text-white/50',
        };
      default:
        return {
          Icon: Activity,
          bgClass: 'bg-gray-100 dark:bg-white/10',
          textClass: 'text-rare-gray dark:text-white/50',
        };
    }
  };

  const { Icon, bgClass, textClass } = getIconAndColors();

  // Format relative time, guard invalid dates
  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Meta detail line: stage_change shows "from → to", outreach shows subject
  const getMetaDetail = () => {
    if (!meta) return null;

    if (type === 'stage_change' && meta.from && meta.to) {
      return `${meta.from} → ${meta.to}`;
    }

    if (type === 'outreach' && meta.subject) {
      return meta.subject;
    }

    return null;
  };

  const metaDetail = getMetaDetail();

  return (
    <div className="flex items-start gap-3 py-3 px-4" key={id}>
      {/* Left: Icon disc */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bgClass}`}>
        <Icon className={`w-4 h-4 ${textClass}`} />
      </div>

      {/* Middle: Label, proposal title link, meta detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900 dark:text-white">
            {label}
          </span>
          {proposalTitle && proposalId && (
            <Link
              to={`/proposals/${proposalId}`}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-rare-gold dark:hover:text-rare-gold/80 truncate"
            >
              {proposalTitle}
            </Link>
          )}
        </div>
        {metaDetail && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {metaDetail}
          </p>
        )}
      </div>

      {/* Right: Time */}
      <div className="flex-shrink-0 text-xs font-rare-sans text-rare-gray dark:text-gray-400 whitespace-nowrap">
        {formatTime(ts)}
      </div>
    </div>
  );
};

ActivityEventRow.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    ts: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.oneOf(['submission', 'stage_change', 'outreach', 'workflow']).isRequired,
    label: PropTypes.string.isRequired,
    proposalId: PropTypes.string,
    proposalTitle: PropTypes.string,
    meta: PropTypes.object,
  }).isRequired,
};

export default ActivityEventRow;
