import PropTypes from 'prop-types';
import { Building2, Hash, Calendar, Pencil, Trash2, Users } from 'lucide-react';
import CparsBadge from './CparsBadge.jsx';
import { formatCurrency, formatPop, isOurs } from './constants.js';

export default function PastPerformanceCard({ record, onEdit, onDelete }) {
  const tags = Array.isArray(record.tags) ? record.tags : [];
  const ours = isOurs(record);

  return (
    <div className="bg-white/95 dark:bg-rare-ink shadow-card rounded-xl p-5 font-rare-sans flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-rare-ink dark:text-rare-cream truncate" title={record.contractName}>
            {record.contractName || 'Untitled contract'}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-rare-gray dark:text-rare-cream/60 truncate">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{record.agency || 'Unknown agency'}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <CparsBadge rating={record.cparsRating} />
          {!ours && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rare-crimson/10 text-rare-crimson whitespace-nowrap"
              title={`Partner-owned: ${record.owner}`}
            >
              <Users className="w-3 h-3" />
              {record.owner}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-rare-gray dark:text-rare-cream/60">
        {record.naics && (
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            NAICS {record.naics}
          </span>
        )}
        {record.psc && (
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            PSC {record.psc}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatPop(record.popStart, record.popEnd)}
        </span>
      </div>

      <div className="font-mono text-lg font-semibold text-rare-ink dark:text-rare-cream">
        {formatCurrency(record.value)}
      </div>

      {record.relevanceBlurb && (
        <p className="text-sm text-rare-gray dark:text-rare-cream/70 line-clamp-3">
          {record.relevanceBlurb}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs bg-rare-gray-light dark:bg-white/10 text-rare-ink dark:text-rare-cream/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 mt-auto border-t border-rare-gray/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => onEdit(record)}
          className="inline-flex items-center gap-1 text-xs text-rare-gray hover:text-rare-gold transition-colors"
          aria-label={`Edit ${record.contractName}`}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(record.id)}
          className="inline-flex items-center gap-1 text-xs text-rare-gray hover:text-rare-crimson transition-colors"
          aria-label={`Delete ${record.contractName}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

PastPerformanceCard.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.string.isRequired,
    contractName: PropTypes.string,
    agency: PropTypes.string,
    naics: PropTypes.string,
    psc: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    popStart: PropTypes.string,
    popEnd: PropTypes.string,
    cparsRating: PropTypes.string,
    relevanceBlurb: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    owner: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
