import { useState } from 'react';
import { Loader2, ArrowRight, Trophy, XCircle, Zap, ClipboardEdit } from 'lucide-react';
import { buildApiUrl } from '../lib/runtimeApi.js';

const PF_TO_TWENTY_STAGE = {
  intake: 'NEW',
  qualification: 'SCREENING',
  pre_solicitation: 'SCREENING',
  research: 'MEETING',
  technical_compliance: 'MEETING',
  pricing_strategy: 'PROPOSAL',
  pricing_packaging: 'PROPOSAL',
  drafting: 'PROPOSAL',
  review: 'PROPOSAL',
  google_docs_final: 'PROPOSAL',
  submitted: 'CUSTOMER',
};

const TWENTY_STAGE_SEQUENCE = ['NEW', 'SCREENING', 'MEETING', 'PROPOSAL', 'CUSTOMER'];

function nextTwentyStage(current) {
  const idx = TWENTY_STAGE_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= TWENTY_STAGE_SEQUENCE.length - 1) return null;
  return TWENTY_STAGE_SEQUENCE[idx + 1];
}

export default function CrmActions({ proposal, onRefresh, addToast }) {
  const [busy, setBusy] = useState('');
  const [nextActionText, setNextActionText] = useState('');
  const [showNextAction, setShowNextAction] = useState(false);

  const opportunityId = proposal?.metadata?.twentyOpportunityId || proposal?.twentyOpportunityId;
  if (!opportunityId) return null;

  const currentTwentyStage = PF_TO_TWENTY_STAGE[proposal.status] || 'NEW';
  const next = nextTwentyStage(currentTwentyStage);

  async function executeCrm(payload, label) {
    setBusy(label);
    try {
      const res = await fetch(buildApiUrl('/crm/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `Server error ${res.status}`);
      addToast?.({ title: label, description: data.message || 'Action completed', variant: 'default' });
      await onRefresh?.();
      return data;
    } catch (err) {
      addToast?.({ title: `${label} failed`, description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setBusy('');
    }
  }

  const handleAccept = () => executeCrm({
    opportunityId,
    proposalId: proposal.id,
    update: { stage: 'SCREENING' },
    tasks: [{ title: `Follow up on ${proposal.title || 'opportunity'}`, body: 'Accepted — schedule initial review and confirm requirements.' }],
    notes: [{ title: 'Opportunity accepted', body: `Moved to SCREENING. Ready for qualification.` }],
  }, 'Accept');

  const handleAdvance = () => {
    if (!next) return;
    executeCrm({
      opportunityId,
      proposalId: proposal.id,
      update: { stage: next },
      notes: [{ title: `Stage advanced to ${next}`, body: `Manually advanced from ${currentTwentyStage} to ${next}.` }],
    }, `Advance to ${next}`);
  };

  const handleMarkWon = () => executeCrm({
    opportunityId,
    proposalId: proposal.id,
    update: { stage: 'CUSTOMER' },
    tasks: [
      { title: 'Create invoice for awarded contract', body: 'Contract won — generate invoice per SOW terms.' },
      { title: 'Schedule kickoff meeting', body: 'Coordinate with client POC for project kickoff.' },
      { title: 'Mobilize team and resources', body: 'Assign personnel, procure materials, set up project tracking.' },
    ],
    notes: [{ title: 'CONTRACT WON', body: `**${proposal.title}** marked as won. Invoice, kickoff, and mobilization tasks created.` }],
  }, 'Mark Won');

  const handleMarkLost = () => executeCrm({
    opportunityId,
    proposalId: proposal.id,
    notes: [{ title: 'Opportunity lost', body: `**${proposal.title}** marked as lost. Review for lessons learned.` }],
  }, 'Mark Lost');

  const handleSetNextAction = () => {
    if (!nextActionText.trim()) return;
    executeCrm({
      opportunityId,
      proposalId: proposal.id,
      update: { nextAction: nextActionText.trim() },
      notes: [{ title: 'Next action set', body: nextActionText.trim() }],
    }, 'Set Next Action').then((result) => {
      if (result) {
        setNextActionText('');
        setShowNextAction(false);
      }
    });
  };

  const btn = (label, icon, onClick, variant = 'primary', disabled = false) => (
    <button
      onClick={onClick}
      disabled={Boolean(busy) || disabled}
      className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        variant === 'danger'
          ? 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
          : variant === 'success'
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : variant === 'secondary'
              ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {busy === label ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <span className="mr-2">{icon}</span>
      )}
      {label}
    </button>
  );

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">CRM Actions</h2>
            <p className="text-sm text-gray-500">
              Twenty stage: <span className="font-medium text-gray-700">{currentTwentyStage}</span>
              {next && <span className="text-gray-400"> → {next}</span>}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
            Connected
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {currentTwentyStage === 'NEW' && btn('Accept', <Zap className="h-4 w-4" />, handleAccept)}
          {next && btn(`Advance to ${next}`, <ArrowRight className="h-4 w-4" />, handleAdvance, 'secondary')}
          {btn('Mark Won', <Trophy className="h-4 w-4" />, handleMarkWon, 'success')}
          {btn('Mark Lost', <XCircle className="h-4 w-4" />, handleMarkLost, 'danger')}
          {btn(
            showNextAction ? 'Cancel' : 'Set Next Action',
            <ClipboardEdit className="h-4 w-4" />,
            () => setShowNextAction(!showNextAction),
            'secondary',
          )}
        </div>

        {showNextAction && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={nextActionText}
              onChange={(e) => setNextActionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetNextAction()}
              placeholder="e.g., Call POC to confirm scope requirements"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSetNextAction}
              disabled={!nextActionText.trim() || Boolean(busy)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
