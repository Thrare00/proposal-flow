import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ListChecks, Calendar, User } from 'lucide-react';

function daysUntil(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((due.getTime() - today.getTime()) / msPerDay);
}

function formatDueDate(dueDate) {
  if (!dueDate) return '—';
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return dueDate;
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function DoNextQueue({ items = [] }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className="bg-white/95 dark:bg-rare-ink shadow-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-4 h-4 text-rare-crimson" />
        <h2 className="font-rare-sans uppercase tracking-wide text-sm font-semibold text-rare-ink dark:text-white">
          Do Next
        </h2>
      </div>

      {!hasItems && (
        <p className="text-sm text-rare-gray dark:text-rare-gray py-6 text-center">
          Nothing queued — capture an opportunity to generate work.
        </p>
      )}

      {hasItems && (
        <ol className="divide-y divide-rare-gray/20">
          {items.map((item, index) => {
            const rank = index + 1;
            const isTop = index === 0;
            const delta = daysUntil(item.dueDate);
            const urgent = delta !== null && delta <= 2;

            return (
              <li
                key={item.taskId ?? `${item.proposalId}-${rank}`}
                className={[
                  'flex items-start gap-3 py-3 pl-3 pr-1',
                  isTop ? 'border-l-4 border-rare-lime' : 'border-l-4 border-transparent',
                ].join(' ')}
              >
                <span className="font-rare-serif text-lg text-rare-crimson leading-none pt-0.5 w-6 shrink-0 text-center">
                  {rank}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-rare-ink dark:text-white break-words">
                    {item.taskTitle}
                  </p>
                  {item.proposalId && (
                    <Link
                      to={`/proposals/${item.proposalId}`}
                      className="text-xs text-rare-gray hover:text-rare-crimson hover:underline"
                    >
                      {item.proposalTitle}
                    </Link>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {item.stage && (
                      <span className="font-rare-sans uppercase tracking-wide text-[10px] font-semibold text-rare-ink dark:text-white bg-rare-gray/15 dark:bg-white/10 rounded px-1.5 py-0.5">
                        {item.stage}
                      </span>
                    )}
                    {item.owner && (
                      <span className="flex items-center gap-1 text-[11px] text-rare-gray">
                        <User className="w-3 h-3" />
                        {item.owner}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 pt-0.5">
                  <Calendar className={`w-3 h-3 ${urgent ? 'text-rare-crimson' : 'text-rare-gray'}`} />
                  <span
                    className={
                      urgent
                        ? 'text-rare-crimson text-xs font-semibold whitespace-nowrap'
                        : 'text-rare-gray text-xs whitespace-nowrap'
                    }
                  >
                    {formatDueDate(item.dueDate)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

DoNextQueue.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      proposalId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      proposalTitle: PropTypes.string,
      taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      taskTitle: PropTypes.string,
      owner: PropTypes.string,
      dueDate: PropTypes.string,
      stage: PropTypes.string,
    })
  ),
};

export default DoNextQueue;
