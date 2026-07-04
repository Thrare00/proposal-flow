import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Flame, TrendingUp } from 'lucide-react';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DOT_WEEKS = 8;

/**
 * Resolve the best available submit-time proxy for a proposal.
 * Returns a valid Date or null.
 */
function resolveSubmitDate(proposal) {
  const raw = proposal?.updatedAt ?? proposal?.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Global week index (weeks since epoch) used purely as a stable bucket key.
 */
function weekIndexOf(date) {
  return Math.floor(date.getTime() / WEEK_MS);
}

function monthKeyOf(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function useStreakData(proposals) {
  return useMemo(() => {
    const list = Array.isArray(proposals) ? proposals : [];

    const submittedDates = list
      .filter((p) => p && p.status === 'submitted')
      .map(resolveSubmitDate)
      .filter(Boolean);

    if (submittedDates.length === 0) {
      return {
        hasData: false,
        streak: 0,
        thisMonth: 0,
        lastMonth: 0,
        weekDots: Array.from({ length: DOT_WEEKS }, () => false),
      };
    }

    const now = new Date();
    const currentWeekIndex = weekIndexOf(now);
    const currentMonthKey = monthKeyOf(now);
    const lastMonthKey = currentMonthKey - 1;

    const weekIndexSet = new Set(submittedDates.map(weekIndexOf));

    // Consecutive weeks, counting back from the current week.
    let streak = 0;
    while (weekIndexSet.has(currentWeekIndex - streak)) {
      streak += 1;
    }

    // Last DOT_WEEKS weeks, oldest -> newest.
    const weekDots = Array.from({ length: DOT_WEEKS }, (_, i) => {
      const weeksAgo = DOT_WEEKS - 1 - i;
      return weekIndexSet.has(currentWeekIndex - weeksAgo);
    });

    let thisMonth = 0;
    let lastMonth = 0;
    submittedDates.forEach((d) => {
      const key = monthKeyOf(d);
      if (key === currentMonthKey) thisMonth += 1;
      else if (key === lastMonthKey) lastMonth += 1;
    });

    return { hasData: true, streak, thisMonth, lastMonth, weekDots };
  }, [proposals]);
}

export default function StreakMeter({ proposals = [] }) {
  const { hasData, streak, thisMonth, lastMonth, weekDots } = useStreakData(proposals);

  const flameColor = !hasData || streak === 0
    ? 'text-white/30'
    : streak === 1
      ? 'text-rare-lime'
      : 'text-rare-gold';

  const isAhead = hasData && thisMonth >= lastMonth;

  return (
    <div className="rounded-2xl bg-rare-ink dark:bg-rare-dark border border-white/10 dark:border-white/5 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-rare-sans uppercase tracking-wider text-xs text-white/50">
          Submission Streak
        </span>
        <Flame className={`h-5 w-5 ${flameColor}`} aria-hidden="true" />
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-rare-serif text-5xl font-semibold text-white leading-none">
          {hasData ? streak : 0}
        </span>
        {hasData && (
          <span className="font-rare-sans text-xs uppercase tracking-wide text-white/50">
            {streak === 1 ? 'week' : 'weeks'}
          </span>
        )}
      </div>

      {hasData ? (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
          <span>
            This month {thisMonth} &middot; last month {lastMonth}
          </span>
          {isAhead ? (
            <TrendingUp className="h-4 w-4 text-rare-lime" aria-hidden="true" />
          ) : (
            <TrendingUp className="h-4 w-4 text-white/50" aria-hidden="true" />
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-white/50">
          First submission starts the streak.
        </p>
      )}

      <div className="mt-5 flex items-center gap-1.5">
        {weekDots.map((active, idx) => (
          <span
            key={idx}
            className={`h-2 w-2 rounded-full ${active ? 'bg-rare-lime' : 'bg-white/10'}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

StreakMeter.propTypes = {
  proposals: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    })
  ),
};
