import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Radar, AlertTriangle } from 'lucide-react';

const EXCLUDED_STATUSES = ['submitted', 'closed'];

const COLOR_STYLES = {
  crimson: {
    dot: 'bg-rare-crimson shadow-[0_0_10px_rgba(220,38,38,0.65)] animate-pulse',
    text: 'text-rare-crimson',
  },
  gold: {
    dot: 'bg-rare-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]',
    text: 'text-rare-gold',
  },
  lime: {
    dot: 'bg-rare-lime shadow-[0_0_8px_rgba(163,230,53,0.45)]',
    text: 'text-rare-lime',
  },
};

function buildItems(proposals, horizonDays) {
  if (!Array.isArray(proposals)) return [];

  const safeHorizon = horizonDays > 0 ? horizonDays : 21;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return proposals
    .filter((p) => {
      if (!p || p.id === undefined || p.id === null || !p.dueDate) return false;
      const status = String(p.status || '').trim().toLowerCase();
      return !EXCLUDED_STATUSES.includes(status);
    })
    .map((p) => {
      const due = new Date(p.dueDate);
      if (Number.isNaN(due.getTime())) return null;
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
      return {
        id: p.id,
        title: (p.title || 'Untitled proposal').trim() || 'Untitled proposal',
        diffDays,
      };
    })
    .filter((item) => item !== null && item.diffDays <= safeHorizon)
    .sort((a, b) => a.diffDays - b.diffDays)
    .map((item, idx) => {
      const clampedDays = Math.max(item.diffDays, 0);
      const leftPercent = Math.min(1, clampedDays / safeHorizon) * 100;

      let colorKey = 'lime';
      if (item.diffDays <= 3) colorKey = 'crimson';
      else if (item.diffDays <= 7) colorKey = 'gold';

      return {
        ...item,
        leftPercent,
        colorKey,
        isOverdue: item.diffDays < 0,
        labelAbove: idx % 2 === 0,
      };
    });
}

export default function DeadlineRadar({ proposals = [], horizonDays = 21 }) {
  const items = useMemo(() => buildItems(proposals, horizonDays), [proposals, horizonDays]);
  const hasOverdue = useMemo(() => items.some((item) => item.isOverdue), [items]);

  return (
    <div className="rounded-2xl border border-white/10 bg-rare-ink p-5 text-white shadow-lg shadow-black/20 sm:p-6 dark:border-white/10 dark:shadow-black/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 shrink-0 text-rare-gold" aria-hidden="true" />
          <h3 className="font-rare-sans text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Incoming &middot; Next {horizonDays} Days
          </h3>
        </div>
        {hasOverdue && (
          <span className="flex items-center gap-1 font-rare-sans text-[10px] font-semibold uppercase tracking-wide text-rare-crimson">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Overdue
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-rare-lime/50" aria-hidden="true" />
          <span className="font-rare-serif text-sm italic text-rare-lime">Horizon clear.</span>
          <span className="h-px flex-1 bg-rare-lime/50" aria-hidden="true" />
        </div>
      ) : (
        <div className="relative mt-12 h-20 sm:mt-10 sm:h-16">
          {/* track */}
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" aria-hidden="true" />

          {/* today marker */}
          <div className="absolute left-0 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="h-2 w-2 rounded-full bg-white/40" aria-hidden="true" />
            <span className="mt-1 whitespace-nowrap font-rare-sans text-[10px] uppercase tracking-wide text-white/40">
              Today
            </span>
          </div>

          {items.map((item) => {
            const colors = COLOR_STYLES[item.colorKey];
            const dayLabel = item.isOverdue ? 'OVERDUE' : `${item.diffDays}d`;

            return (
              <Link
                key={item.id}
                to={`/proposals/${item.id}`}
                className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{ left: `${item.leftPercent}%` }}
              >
                {item.labelAbove && (
                  <span className="absolute bottom-full left-1/2 mb-2 flex w-24 -translate-x-1/2 flex-col items-center text-center">
                    <span className="block max-w-full truncate font-rare-sans text-[11px] font-medium text-white/80 group-hover:text-white">
                      {item.title}
                    </span>
                    <span className={`font-rare-sans text-[10px] font-semibold ${colors.text}`}>{dayLabel}</span>
                  </span>
                )}

                <span
                  className={`block h-3 w-3 rounded-full ring-2 ring-rare-ink transition-transform duration-150 group-hover:scale-125 ${colors.dot}`}
                />

                {!item.labelAbove && (
                  <span className="absolute left-1/2 top-full mt-2 flex w-24 -translate-x-1/2 flex-col items-center text-center">
                    <span className={`font-rare-sans text-[10px] font-semibold ${colors.text}`}>{dayLabel}</span>
                    <span className="block max-w-full truncate font-rare-sans text-[11px] font-medium text-white/80 group-hover:text-white">
                      {item.title}
                    </span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

DeadlineRadar.propTypes = {
  proposals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      dueDate: PropTypes.string,
      status: PropTypes.string,
    })
  ),
  horizonDays: PropTypes.number,
};
