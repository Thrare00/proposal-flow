import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChevronRight } from 'lucide-react';

/**
 * Canonical 8-bucket proposal pipeline, left -> right, intake -> submitted.
 * Real field on a proposal is `status`. Each proposal is counted into the
 * first bucket whose `statuses` array includes its `status`. Proposals with
 * status `closed` (or no matching bucket) are ignored.
 */
const PIPELINE_STAGES = [
  { key: 'intake', label: 'Intake', statuses: ['intake'] },
  { key: 'strategy', label: 'Strategy', statuses: ['strategy', 'qualification', 'pre_solicitation'] },
  { key: 'compliance', label: 'Compliance', statuses: ['compliance', 'technical_compliance'] },
  { key: 'pricing', label: 'Pricing', statuses: ['pricing_strategy', 'pricing_packaging'] },
  { key: 'drafting', label: 'Drafting', statuses: ['drafting'] },
  { key: 'ai_review', label: 'AI Review', statuses: ['review', 'ai_review', 'red_team'] },
  { key: 'final', label: 'Final', statuses: ['final_review', 'google_docs_final', 'final_draft'] },
  { key: 'submitted', label: 'Submitted', statuses: ['submitted'] },
];

const BAR_TRACK_HEIGHT = 96; // px, matches h-24 track below
const MIN_ZERO_HEIGHT_PCT = 6; // visible sliver for empty stages
const MIN_ACTIVE_HEIGHT_PCT = 14; // floor so single-proposal stages stay legible

function PipelineFlow({ proposals = [], onStageClick = undefined }) {
  const stageCounts = useMemo(() => {
    const counts = PIPELINE_STAGES.map(() => 0);
    (proposals || []).forEach((proposal) => {
      const status = proposal && proposal.status;
      if (!status || status === 'closed') return;
      const bucketIndex = PIPELINE_STAGES.findIndex((stage) => stage.statuses.includes(status));
      if (bucketIndex !== -1) counts[bucketIndex] += 1;
    });
    return counts;
  }, [proposals]);

  const totalCount = useMemo(
    () => stageCounts.reduce((sum, count) => sum + count, 0),
    [stageCounts]
  );

  const maxCount = useMemo(() => Math.max(...stageCounts, 1), [stageCounts]);

  return (
    <div className="rounded-2xl border border-white/10 bg-rare-dark p-5 shadow-sm dark:bg-rare-ink sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-rare-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
          Pipeline
        </span>
        {totalCount > 0 && (
          <span className="font-rare-sans text-[11px] uppercase tracking-wide text-white/40">
            {totalCount} active
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <p className="font-rare-sans text-sm text-white/40">Pipeline empty</p>
      ) : (
        <div className="flex items-end overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, index) => {
            const count = stageCounts[index];
            const heightPct =
              count > 0
                ? Math.max((count / maxCount) * 100, MIN_ACTIVE_HEIGHT_PCT)
                : MIN_ZERO_HEIGHT_PCT;
            const isSubmitted = stage.key === 'submitted';
            const isLast = index === PIPELINE_STAGES.length - 1;

            const columnContent = (
              <>
                <span className="mb-2 font-rare-serif text-base font-bold text-white">
                  {count}
                </span>
                <div
                  className="flex items-end justify-center rounded-md bg-white/5"
                  style={{ height: `${BAR_TRACK_HEIGHT}px`, width: '2rem' }}
                >
                  <div
                    className={`momentum-fill w-full rounded-md bg-rare-lime ${
                      isSubmitted && count > 0 ? 'momentum-node-active' : ''
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="mt-2 whitespace-nowrap font-rare-sans text-[10px] uppercase tracking-wide text-white/50">
                  {stage.label}
                </span>
              </>
            );

            return (
              <div key={stage.key} className="flex flex-shrink-0 items-end">
                {onStageClick ? (
                  <button
                    type="button"
                    onClick={() => onStageClick(stage.statuses)}
                    className="flex flex-col items-center rounded-lg px-2.5 py-1 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rare-lime/50"
                  >
                    {columnContent}
                  </button>
                ) : (
                  <div className="flex flex-col items-center px-2.5 py-1">{columnContent}</div>
                )}

                {!isLast && (
                  <ChevronRight
                    className="mb-7 h-4 w-4 flex-shrink-0 text-white/25"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

PipelineFlow.propTypes = {
  proposals: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string,
    })
  ),
  onStageClick: PropTypes.func,
};

export default PipelineFlow;
