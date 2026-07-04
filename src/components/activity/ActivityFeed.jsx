import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ActivityEventRow from './ActivityEventRow.jsx';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Midnight timestamp (local time) for a given Date.
 */
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Human day header: "Today", "Yesterday", or a formatted date
 * ("Wed, Jan 14" for this year, "Wed, Jan 14, 2025" otherwise).
 */
function dayLabel(dayStartMs, todayStartMs) {
  const diffDays = Math.round((todayStartMs - dayStartMs) / DAY_MS);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  const date = new Date(dayStartMs);
  const sameYear = date.getFullYear() === new Date(todayStartMs).getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
}

/**
 * Group events (already sorted desc by the parent) into calendar-day
 * buckets, most recent day first. Events with an unparsable `ts` are
 * skipped entirely rather than crashing the grouping/label logic; if that
 * leaves nothing to show, the caller falls back to the empty-state panel.
 */
function groupEventsByDay(events) {
  const todayStartMs = startOfDay(new Date());
  const order = [];
  const byDay = new Map();

  events.forEach((event) => {
    if (!event || !event.ts) return;
    const parsed = new Date(event.ts);
    const time = parsed.getTime();
    if (Number.isNaN(time)) return; // guard: skip invalid dates

    const dayStartMs = startOfDay(parsed);
    if (!byDay.has(dayStartMs)) {
      byDay.set(dayStartMs, []);
      order.push(dayStartMs);
    }
    byDay.get(dayStartMs).push(event);
  });

  return order
    .sort((a, b) => b - a)
    .map((dayStartMs) => ({
      key: String(dayStartMs),
      label: dayLabel(dayStartMs, todayStartMs),
      isToday: dayStartMs === todayStartMs,
      events: byDay.get(dayStartMs),
    }));
}

export default function ActivityFeed({ events = [], emptyNote = 'No activity yet.' }) {
  const groups = useMemo(
    () => groupEventsByDay(Array.isArray(events) ? events : []),
    [events],
  );

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-rare-gray-light dark:border-white/10 bg-white dark:bg-rare-ink/40 px-6 py-12">
        <p className="font-rare-sans text-sm text-rare-gray dark:text-white/50 text-center">
          {emptyNote}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* hairline rail down the left, spanning the whole feed */}
      <span
        aria-hidden="true"
        className="absolute left-[15px] top-2 bottom-2 w-px bg-rare-gray-light dark:bg-white/10"
      />

      <div className="relative space-y-6">
        {groups.map((group) => (
          <section key={group.key} aria-label={group.label}>
            <h3 className="relative z-10 pl-8 font-rare-serif text-sm font-semibold uppercase tracking-wide text-rare-ink dark:text-white/80">
              {group.label}
            </h3>

            <ul className="mt-3 space-y-4">
              {group.events.map((event, idx) => {
                const isTopNode = group.isToday && idx === 0;
                return (
                  <li key={event.id ?? `${group.key}-${idx}`} className="relative pl-8">
                    <span
                      aria-hidden="true"
                      className={`absolute left-[10px] top-1.5 z-10 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-rare-dark ${
                        isTopNode
                          ? 'momentum-node-active bg-rare-lime'
                          : 'border border-rare-gray/40 bg-white dark:border-white/30 dark:bg-rare-dark'
                      }`}
                    />
                    <ActivityEventRow event={event} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

ActivityFeed.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      ts: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      type: PropTypes.string,
      label: PropTypes.string,
      proposalId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      proposalTitle: PropTypes.string,
      meta: PropTypes.object,
    }),
  ),
  emptyNote: PropTypes.string,
};
