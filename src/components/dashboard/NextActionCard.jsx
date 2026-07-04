import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Crosshair, CalendarClock, ListChecks, ArrowRight, Compass } from 'lucide-react';

/**
 * ReadinessBar — a single slim horizontal readiness meter.
 * Renders nothing if `value` is null/undefined so callers can pass
 * potentially-missing scoring fields directly.
 */
function ReadinessBar({ label, value = null }) {
  if (value === null || value === undefined) return null;
  const pct = Math.max(0, Math.min(100, Number(value)));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-rare-sans text-[11px] uppercase tracking-wider text-rare-cream/60">
          {label}
        </span>
        <span className="font-rare-sans text-[11px] tabular-nums text-rare-cream/80">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="momentum-fill h-full rounded-full bg-rare-lime"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

ReadinessBar.propTypes = {
  label: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

/**
 * Computes whole-day countdown to a due date, ignoring time-of-day.
 * Returns null if dueDate is missing/unparseable.
 */
function getDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDue = new Date(due);
  startOfDue.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDue.getTime() - startOfToday.getTime()) / msPerDay);
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-l-4 border-rare-lime bg-rare-ink shadow-card">
      <div className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 font-rare-sans text-xs uppercase tracking-widest text-rare-lime">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          Up Next
        </span>
        <p className="font-rare-serif text-2xl text-white sm:text-3xl">
          Pipeline clear — go hunt
        </p>
        <p className="max-w-md text-sm text-rare-cream/60">
          No proposal is queued up right now. Start a new one to keep the pipeline moving.
        </p>
        <Link
          to="/proposals/new"
          className="btn-primary inline-flex items-center gap-2 rounded-lg bg-rare-crimson px-5 py-2.5 font-rare-sans text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-rare-crimson-dark"
        >
          Start a Proposal
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function NextActionCard({ proposal = null }) {
  if (!proposal) {
    return <EmptyState />;
  }

  const {
    id,
    title,
    agency,
    dueDate,
    workflow,
    complianceStatus,
    scoring,
    tasks,
  } = proposal;

  const daysUntilDue = getDaysUntilDue(dueDate);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3;

  const complianceValue =
    scoring?.compliance_score ?? complianceStatus?.completenessPercent ?? null;
  const draftValue = scoring?.draft_readiness_percent ?? null;
  const submissionValue = scoring?.submission_readiness_percent ?? null;

  const taskList = Array.isArray(tasks) ? tasks : [];
  const completedTasks = taskList.filter((t) => t?.completed).length;
  const totalTasks = taskList.length;

  const currentStage = workflow?.currentStage;

  return (
    <div className="relative overflow-hidden rounded-2xl border-l-4 border-rare-crimson bg-rare-ink shadow-card">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 font-rare-sans text-xs uppercase tracking-widest text-rare-crimson">
              <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
              Up Next
            </span>
            <h2 className="mt-2 truncate font-rare-serif text-2xl text-white sm:text-3xl">
              {title || 'Untitled proposal'}
            </h2>
            {agency && (
              <p className="mt-1 truncate text-sm text-rare-cream/60">{agency}</p>
            )}
            {currentStage && (
              <p className="mt-1 font-rare-sans text-[11px] uppercase tracking-wider text-rare-cream/40">
                {currentStage}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end text-right">
            {daysUntilDue === null ? (
              <span className="font-rare-sans text-xs uppercase tracking-wider text-rare-cream/40">
                No due date
              </span>
            ) : isDueToday ? (
              <span className="font-rare-serif text-2xl text-rare-lime sm:text-3xl">
                Due today — submit day
              </span>
            ) : (
              <>
                <span
                  className={`font-rare-serif text-4xl leading-none sm:text-5xl ${
                    isUrgent || isOverdue ? 'text-rare-crimson' : 'text-white'
                  }`}
                >
                  {Math.abs(daysUntilDue)}
                </span>
                <span
                  className={`mt-1 flex items-center gap-1 font-rare-sans text-[11px] uppercase tracking-wider ${
                    isUrgent || isOverdue ? 'text-rare-crimson' : 'text-rare-cream/60'
                  }`}
                >
                  <CalendarClock className="h-3 w-3" aria-hidden="true" />
                  {isOverdue ? 'days overdue' : 'days left'}
                </span>
              </>
            )}
          </div>
        </div>

        {(complianceValue !== null || draftValue !== null || submissionValue !== null) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ReadinessBar label="Compliance" value={complianceValue} />
            <ReadinessBar label="Draft" value={draftValue} />
            <ReadinessBar label="Submission" value={submissionValue} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          {totalTasks > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 font-rare-sans text-xs uppercase tracking-wider text-rare-cream/70">
              <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
              {completedTasks}/{totalTasks} tasks
            </span>
          )}

          <Link
            to={`/proposals/${id}`}
            className="btn-primary ml-auto inline-flex items-center gap-2 rounded-lg bg-rare-crimson px-5 py-2.5 font-rare-sans text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-rare-crimson-dark"
          >
            Attack This Bid
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

NextActionCard.propTypes = {
  proposal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    agency: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    status: PropTypes.string,
    workflow: PropTypes.shape({
      currentStage: PropTypes.string,
    }),
    complianceStatus: PropTypes.shape({
      completenessPercent: PropTypes.number,
    }),
    scoring: PropTypes.shape({
      compliance_score: PropTypes.number,
      draft_readiness_percent: PropTypes.number,
      submission_readiness_percent: PropTypes.number,
    }),
    tasks: PropTypes.arrayOf(
      PropTypes.shape({
        completed: PropTypes.bool,
      })
    ),
  }),
};

export default NextActionCard;
