import React, { useMemo } from 'react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StageRail from '../components/flow/StageRail.jsx';
import StageColumn from '../components/flow/StageColumn.jsx';

/**
 * Canonical, ordered pipeline stages (intake -> submitted).
 * Mirrors the bucket mapping in components/dashboard/PipelineFlow.jsx.
 * A proposal is placed in the first bucket whose `statuses` array includes
 * its current stage (workflow.currentStage, falling back to status).
 * PipelineFlow.jsx does not export this constant, so it is defined once here.
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

const OTHER_KEY = 'other';

function stageKeyFor(proposal) {
  const stage = proposal?.workflow?.currentStage ?? proposal?.status;
  if (!stage) return OTHER_KEY;
  const bucket = PIPELINE_STAGES.find((s) => s.statuses.includes(stage));
  return bucket ? bucket.key : OTHER_KEY;
}

export default function FlowBoardTabs() {
  const { proposals, isLoading } = useProposalContext();

  const { columns, total } = useMemo(() => {
    const active = (proposals || []).filter(
      (p) => p && p.status !== 'closed' && p.intakeLane !== 'archive'
    );

    const byKey = {};
    active.forEach((p) => {
      const key = stageKeyFor(p);
      (byKey[key] || (byKey[key] = [])).push({
        id: p.id,
        title: p.title || 'Untitled',
        agency: p.agency && p.agency !== 'Unknown Agency' ? p.agency : '',
        dueDate: p.dueDate || null,
      });
    });

    const ordered = PIPELINE_STAGES.map((s) => ({
      id: s.key,
      label: s.label,
      proposals: byKey[s.key] || [],
    }));

    // Surface any un-bucketed proposals so nothing is silently dropped.
    if ((byKey[OTHER_KEY] || []).length > 0) {
      ordered.push({ id: OTHER_KEY, label: 'Unstaged', proposals: byKey[OTHER_KEY] });
    }

    return { columns: ordered, total: active.length };
  }, [proposals]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        title="Flow Board"
        subtitle="Where every active solicitation stands right now"
      />

      {isLoading && total === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rare-crimson" />
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-rare-gray-light bg-white/60 py-16 text-center dark:border-white/10 dark:bg-rare-ink/60">
          <p className="font-rare-sans text-sm text-rare-gray dark:text-white/50">
            No active solicitations in flow. Capture one from the Capture Board to begin.
          </p>
        </div>
      ) : (
        <StageRail stages={columns.map((c) => ({ id: c.id, label: c.label, count: c.proposals.length }))}>
          {columns.map((col) => (
            <StageColumn
              key={col.id}
              stage={{ id: col.id, label: col.label }}
              proposals={col.proposals}
              isActive={col.proposals.length > 0}
            />
          ))}
        </StageRail>
      )}
    </div>
  );
}
