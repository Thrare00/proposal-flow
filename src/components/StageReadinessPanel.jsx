import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { getStageReadiness } from '../lib/api.js';

/**
 * StageReadinessPanel — shows the current stage's output completeness,
 * what the next stage expects, and recent handoff history.
 *
 * Self-contained: fetches its own data from /api/proposals/:id/stage-readiness.
 */
export default function StageReadinessPanel({ proposalId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!proposalId) return;
    setLoading(true);
    getStageReadiness(proposalId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [proposalId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <p className="text-sm italic text-slate-400 dark:text-slate-500">Loading stage readiness…</p>
      </div>
    );
  }

  if (error || !data?.readiness) {
    return null; // silent fail — don't clutter UI if server is unavailable
  }

  const { readiness, handoffs = [] } = data;
  const {
    currentStage,
    nextStage,
    outputsPresent = [],
    outputsMissing = [],
    nextStageExpects = [],
    canAdvance,
  } = readiness;

  if (!currentStage) return null;

  const stageName = (id) =>
    id
      ? id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '—';

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-violet-700 dark:border-slate-700 dark:text-violet-300">
        <Layers className="h-5 w-5" />
        <h3 className="text-base font-semibold">Stage Advance Readiness</h3>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Current → Next */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
          <span className="rounded-md bg-violet-50 px-2.5 py-0.5 text-violet-700 border border-violet-200">
            {stageName(currentStage)}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {nextStage ? stageName(nextStage) : 'Final stage'}
          </span>
          <span
            className={`ml-auto text-xs font-semibold uppercase tracking-wide ${
              canAdvance ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {canAdvance ? '✓ Ready' : 'Incomplete'}
          </span>
        </div>

        {/* Outputs present */}
        {outputsPresent.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Outputs present
            </p>
            <div className="space-y-1">
              {outputsPresent.map((o) => (
                <div key={o} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-mono text-xs">{o}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outputs missing */}
        {outputsMissing.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Missing outputs
            </p>
            <div className="space-y-1">
              {outputsMissing.map((o) => (
                <div key={o} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-mono text-xs">{o}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next stage expects */}
        {nextStageExpects.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Next stage needs
            </p>
            <div className="space-y-1">
              {nextStageExpects.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Circle className="mt-0.5 h-3 w-3 flex-shrink-0 fill-slate-300 dark:fill-slate-600" />
                  <span className="text-xs">{e}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Handoff history (last 3) */}
        {handoffs.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recent handoffs
            </p>
            <div className="space-y-1.5">
              {handoffs.slice(-3).reverse().map((h, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border ${
                    h.signal === 'clean'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {h.signal === 'clean'
                    ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    : <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span className="font-medium">{stageName(h.from)} → {stageName(h.to)}</span>
                  <span className="ml-auto text-slate-400 dark:text-slate-500">
                    {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
