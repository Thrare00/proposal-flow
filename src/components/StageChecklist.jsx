import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

// Stoplight convention:
//   not_started = yellow (waiting), in_progress = green (active), blocked = red, complete = checkmark
function statusMeta(status) {
  switch (status) {
    case 'complete':
      return { icon: CheckCircle2, color: 'text-emerald-600', fill: 'fill-emerald-500', label: 'Complete' };
    case 'in_progress':
      return { icon: Loader2, color: 'text-green-600', fill: '', label: 'In Progress', spin: true };
    case 'blocked':
      return { icon: Circle, color: 'text-red-600', fill: 'fill-red-500', label: 'Blocked' };
    default:
      return { icon: Circle, color: 'text-yellow-500', fill: 'fill-yellow-400', label: 'Not started' };
  }
}

function resolveStatus(raw, previousComplete) {
  if (raw === 'complete') return 'complete';
  if (raw === 'in_progress') return 'in_progress';
  if (!previousComplete && raw === 'not_started') return 'blocked';
  return raw || 'not_started';
}

export default function StageChecklist({ proposal }) {
  const artifacts = proposal.metadata?.generatedArtifacts || [];
  const hasArtifact = (type) => artifacts.some((artifact) => artifact.type === type);
  const hasFiles = (proposal.files || []).length > 0;
  const stageStatus = (stageId) => proposal.workflow?.stages?.find((stage) => stage.stageId === stageId)?.status;
  const deriveStatus = (completed, stageId) => {
    if (completed) return 'complete';
    const status = stageStatus(stageId);
    if (status === 'in_progress') return 'in_progress';
    if (status === 'blocked') return 'blocked';
    return 'not_started';
  };
  const complianceReady = hasArtifact('compliance_matrix') || (proposal.complianceMatrix || []).length > 0;
  const preSolicitationReady = hasArtifact('pre_solicitation');
  const outlineReady = hasArtifact('outline');
  const roughDraftReady = hasArtifact('rough_draft');
  const aiReviewReady = hasArtifact('ai_review');
  const finalDraftReady = hasArtifact('final_draft');
  const readyForFinal = finalDraftReady && (proposal.scoring?.unresolved_gap_count || 0) === 0 && (proposal.redTeamFindings || []).filter((item) => item.status !== 'resolved').length === 0;

  const rows = [
    { id: 'docs', label: 'Solicitation documents attached', status: hasFiles ? 'complete' : (stageStatus('ingestion') === 'in_progress' ? 'in_progress' : 'not_started') },
    { id: 'compliance', label: 'Compliance matrix built', status: deriveStatus(complianceReady, 'compliance') },
    { id: 'pre', label: 'Pre-solicitation complete', status: deriveStatus(preSolicitationReady, 'strategy') },
    { id: 'outline', label: 'Outline generated', status: deriveStatus(outlineReady, 'outline') },
    { id: 'rough', label: 'Rough draft generated', status: deriveStatus(roughDraftReady, 'drafting') },
    { id: 'review', label: 'AI review complete', status: deriveStatus(aiReviewReady, 'red_team') },
    { id: 'finaldoc', label: 'Final draft opened in Google Docs', status: deriveStatus(finalDraftReady, 'final_review') },
    { id: 'ready', label: 'Ready for final review', status: readyForFinal ? 'complete' : 'not_started' },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Stage Checklist</h3>
        <p className="text-sm text-gray-500">Each stage must complete before the next one can start.</p>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map((row, index) => {
          const previousComplete = index === 0 ? true : rows[index - 1].status === 'complete';
          const status = resolveStatus(row.status, previousComplete);
          const meta = statusMeta(status);
          const Icon = meta.icon;
          return (
            <div key={row.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${meta.color} ${meta.fill || ''} ${meta.spin ? 'animate-spin' : ''}`} />
                <div className="text-sm font-medium text-gray-900">{row.label}</div>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{meta.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
