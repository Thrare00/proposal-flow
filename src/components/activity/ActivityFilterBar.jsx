import React from 'react';
import PropTypes from 'prop-types';
import { Search } from 'lucide-react';

export default function ActivityFilterBar({
  types = [],
  active = [],
  onToggle = () => {},
  query = '',
  onQuery = () => {},
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const isActive = active.includes(type.id);
          return (
            <button
              key={type.id}
              onClick={() => onToggle(type.id)}
              className={`
                px-3 py-1 rounded-full font-rare-sans uppercase text-xs
                transition-colors duration-200
                ${
                  isActive
                    ? 'border border-rare-crimson text-rare-crimson'
                    : 'border border-transparent bg-gray-100 text-rare-gray dark:bg-white/10 dark:text-white/60'
                }
              `}
            >
              {type.label} ({type.count})
            </button>
          );
        })}
      </div>

      {/* Text search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rare-gray dark:text-white/40 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Filter by proposal…"
          className="
            w-full pl-10 pr-3 py-2 rounded border
            border-gray-200 dark:border-white/10
            bg-white dark:bg-white/5
            text-rare-ink dark:text-white
            placeholder-rare-gray dark:placeholder-white/40
            font-rare-sans text-sm
            focus:outline-none focus:border-rare-crimson dark:focus:border-rare-crimson
            transition-colors duration-200
          "
        />
      </div>
    </div>
  );
}

ActivityFilterBar.propTypes = {
  types: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
  active: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  onToggle: PropTypes.func,
  query: PropTypes.string,
  onQuery: PropTypes.func,
};
