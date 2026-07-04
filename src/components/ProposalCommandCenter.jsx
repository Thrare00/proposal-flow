import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileSearch,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import { buildApiUrl } from '../lib/runtimeApi.js';

const TAB_LABELS = [
  { id: 'dashboard', label: 'Dashboard', icon: Target },
  { id: 'compliance', label: 'Compliance Matrix', icon: ClipboardCheck },
  { id: 'pricing_governance', label: 'Pricing Governance', icon: DollarSign },
  { id: 'pre_solicitation', label: 'Pre-solicitation', icon: AlertTriangle },
  { id: 'outline', label: 'Generate Outline', icon: FileSearch },
  { id: 'rough_draft', label: 'Rough Draft', icon: Sparkles },
  { id: 'ai_review', label: 'AI Review', icon: ShieldAlert },
  { id: 'final_draft', label: 'Final Draft', icon: CheckCircle2 },
];

function MetricCard({ label, value, tone = 'default' }) {
  const tones = {
    default: 'border-gray-200 bg-white',
    good: 'border-emerald-200 bg-emerald-50',
    warn: 'border-amber-200 bg-amber-50',
    danger: 'border-red-200 bg-red-50',
  };

  return (
    <div className={`rounded-lg border p-4 ${tones[tone] || tones.default}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

export default function ProposalCommandCenter({ proposal, onProposalRefresh, addToast }) {
  const [tab, setTab] = useState('dashboard');
  const [activeAction, setActiveAction] = useState('');

  const openRedFlags = useMemo(
    () => (proposal.redTeamFindings || []).filter((item) => item.status !== 'resolved'),
    [proposal.redTeamFindings],
  );

  const runAction = async (path, successTitle, successDescription, openInBrowser = false) => {
    const popup = openInBrowser ? window.open('', '_blank') : null;
    const nextTab = path.includes('compliance-matrix')
      ? 'compliance'
      : path.includes('pre-solicitation')
        ? 'pre_solicitation'
        : path.includes('outline')
          ? 'outline'
          : path.includes('rough-draft')
            ? 'rough_draft'
            : path.includes('ai-review')
              ? 'ai_review'
              : path.includes('final-draft')
                ? 'final_draft'
                : null;
    try {
      setActiveAction(path);
      const response = await fetch(buildApiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Server error ${response.status}`);
      }
      await onProposalRefresh?.();
      const nextUrl = data.docxUrl || data.gdocUrl || data.artifactUrl;
      if (openInBrowser && nextUrl && popup) {
        popup.location = nextUrl;
      }
      addToast?.({
        title: successTitle,
        description: successDescription,
        variant: 'default',
      });
      if (nextTab) setTab(nextTab);
      return data;
    } catch (error) {
      addToast?.({
        title: 'Action failed',
        description: error.message || 'The workflow action did not complete.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setActiveAction('');
    }
  };

  const actionButton = (label, path, busyText, successDescription, variant = 'primary', openInBrowser = false) => (
    <button
      onClick={() => runAction(path, label, successDescription, openInBrowser)}
      disabled={Boolean(activeAction)}
      className={`rounded-md px-4 py-2 text-sm font-medium ${
        variant === 'secondary'
          ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {activeAction === path ? (
        <span className="inline-flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {busyText}
        </span>
      ) : label}
    </button>
  );

  const complianceLimits = proposal.metadata?.complianceLimits || [];
  const hasPageOrCharLimit = complianceLimits.some((limit) => ['page', 'character', 'word', 'section'].includes(String(limit.type || '').toLowerCase()));
  const preSolicitation = proposal.metadata?.preSolicitation || {};
  const outlineSections = proposal.outline?.sections || [];
  const roughDraft = proposal.metadata?.roughDraft?.draftText || '';
  const aiReview = proposal.metadata?.aiReview || {};
  const finalDraftArtifact = (proposal.metadata?.generatedArtifacts || []).find((item) => item.type === 'final_draft');
  const docxUrl = finalDraftArtifact?.docxUrl
    ? buildApiUrl(finalDraftArtifact.docxUrl.replace(/^\/proposal-flow\/api/, ''))
    : '';
  const [exporting, setExporting] = useState('');

  const exportToGoogleDocs = async (endpoint, label) => {
    setExporting(endpoint);
    try {
      const response = await fetch(buildApiUrl(`/proposals/${proposal.id}/export/${endpoint}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Export failed (${response.status})`);
      if (data.gdocUrl) window.open(data.gdocUrl, '_blank');
      addToast?.({ title: `${label} exported`, description: 'Google Doc opened in new tab.', variant: 'default' });
    } catch (err) {
      addToast?.({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">GovCon Command Center</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compliance-first workflow with staged artifacts and visible outputs at every step.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actionButton('Build Compliance Matrix', `/proposals/${proposal.id}/compliance-matrix`, 'Building...', 'Compliance matrix generated on page', 'primary')}
            {actionButton('Pre-solicitation', `/proposals/${proposal.id}/pre-solicitation`, 'Generating...', 'Pre-solicitation generated on page', 'secondary')}
            {actionButton('Generate Outline', `/proposals/${proposal.id}/outline`, 'Outlining...', 'Outline generated on page', 'secondary')}
            {actionButton('Rough Draft', `/proposals/${proposal.id}/rough-draft`, 'Drafting...', 'Rough draft generated on page', 'secondary')}
            {actionButton('AI Review', `/proposals/${proposal.id}/ai-review`, 'Reviewing...', 'AI review generated on page', 'secondary')}
            {actionButton('Final Draft', `/proposals/${proposal.id}/final-draft`, 'Generating...', 'Final draft Word document ready', 'secondary', false)}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 px-6 py-3 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          {TAB_LABELS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-medium ${
                tab === id ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Current Stage" value={proposal.workflow?.currentStage || 'ingestion'} tone="default" />
              <MetricCard label="Compliance" value={`${proposal.complianceStatus?.completenessPercent || 0}%`} tone={proposal.complianceStatus?.completenessPercent >= 80 ? 'good' : 'warn'} />
              <MetricCard label="Draft Readiness" value={`${proposal.scoring?.draft_readiness_percent || 0}%`} tone={proposal.scoring?.draft_readiness_percent >= 70 ? 'good' : 'warn'} />
              <MetricCard label="Submission Readiness" value={`${proposal.scoring?.submission_readiness_percent || 0}%`} tone={proposal.scoring?.submission_readiness_percent >= 85 ? 'good' : 'danger'} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <MetricCard label="Missing Evidence" value={proposal.complianceStatus?.missingEvidenceCount || 0} tone={(proposal.complianceStatus?.missingEvidenceCount || 0) === 0 ? 'good' : 'warn'} />
              <MetricCard label="Open Gaps" value={proposal.scoring?.unresolved_gap_count || 0} tone={(proposal.scoring?.unresolved_gap_count || 0) === 0 ? 'good' : 'danger'} />
              <MetricCard label="Open Red-Team Findings" value={openRedFlags.length} tone={openRedFlags.length === 0 ? 'good' : 'danger'} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Workflow guardrail</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Whole-proposal drafting stays blocked until ingestion, compliance, pre-solicitation, and outline are complete.
                Current state:{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {proposal.workflow?.stageGate?.canDraftWholeProposal ? 'ready to draft' : 'still gated'}
                </span>
              </p>
            </div>
          </>
        )}

        {tab === 'compliance' && (
          <>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-semibold">Constraints & Limits</div>
              <ul className="mt-2 list-disc pl-5">
                {complianceLimits.length
                  ? complianceLimits.map((item, idx) => (
                    <li key={`${item.type}-${idx}`}>
                      {item.type}: {item.value} {item.source ? `(${item.source})` : ''}
                    </li>
                  ))
                  : null}
                {!hasPageOrCharLimit && (
                  <li>No explicit page/character limit found</li>
                )}
              </ul>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Req ID</th>
                    <th className="px-4 py-3">Requirement</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {(proposal.complianceMatrix || []).length ? (
                    proposal.complianceMatrix.map((item) => (
                      <tr key={item.id || item.requirement_id} className="border-t border-gray-100 align-top">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.requirement_id}</td>
                        <td className="px-4 py-3 text-gray-700">{item.requirement_text}</td>
                        <td className="px-4 py-3 text-gray-600">{item.proposal_section || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.status}</td>
                        <td className="px-4 py-3 text-gray-600">{item.risk_level}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No compliance matrix yet. Run Build Compliance Matrix first.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(proposal.complianceMatrix || []).length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => exportToGoogleDocs('compliance-matrix', 'Compliance Matrix')}
                  disabled={Boolean(exporting)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {exporting === 'compliance-matrix' ? (
                    <span className="inline-flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting...</span>
                  ) : 'Export to Google Docs'}
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'pricing_governance' && (
          <PricingGovernancePanel proposal={proposal} addToast={addToast} onProposalRefresh={onProposalRefresh} />
        )}

        {tab === 'pre_solicitation' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-700">Subcontracting posture</div>
              <p className="mt-2 text-sm text-gray-600">{preSolicitation.subcontractingPosture || 'Not generated yet.'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-700">Teaming posture</div>
              <p className="mt-2 text-sm text-gray-600">{preSolicitation.teamingPosture || 'Not generated yet.'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-700">Pricing posture</div>
              <p className="mt-2 text-sm text-gray-600">{preSolicitation.pricingPosture || 'Not generated yet.'}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-700">Risk notes</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  {(preSolicitation.riskNotes || []).length
                    ? preSolicitation.riskNotes.map((note, idx) => <li key={`${note}-${idx}`}>{note}</li>)
                    : <li>No risks captured yet.</li>}
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-700">Positioning notes</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  {(preSolicitation.positioningNotes || []).length
                    ? preSolicitation.positioningNotes.map((note, idx) => <li key={`${note}-${idx}`}>{note}</li>)
                    : <li>No positioning notes captured yet.</li>}
                </ul>
              </div>
            </div>
            {(preSolicitation.subcontractingPosture || preSolicitation.teamingPosture) && (
              <div className="mt-4">
                <button
                  onClick={() => exportToGoogleDocs('pre-solicitation', 'Pre-Solicitation')}
                  disabled={Boolean(exporting)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {exporting === 'pre-solicitation' ? (
                    <span className="inline-flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting...</span>
                  ) : 'Export to Google Docs'}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'outline' && (
          <div className="space-y-3">
            {outlineSections.length ? (
              outlineSections.map((section) => (
                <div key={section.sectionKey || section.title} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{section.title}</div>
                      <div className="mt-1 text-sm text-gray-600">{section.purpose}</div>
                      <div className="mt-2 text-sm text-gray-500">Evaluator question: {section.evaluatorQuestion || 'n/a'}</div>
                      <div className="mt-3 text-sm text-gray-700">{section.paragraph || section.notes || ''}</div>
                    </div>
                    <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      Page budget: {section.pageBudget || 0}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No outline generated yet. Run Generate Outline first.
              </div>
            )}
          </div>
        )}

        {tab === 'rough_draft' && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {roughDraft ? roughDraft : 'No rough draft yet. Run Rough Draft first.'}
          </div>
        )}

        {tab === 'ai_review' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard label="Compliance Score" value={aiReview.complianceScore || 0} tone={aiReview.complianceScore >= 80 ? 'good' : 'warn'} />
              <MetricCard label="Missing Requirements" value={(aiReview.missingRequirements || []).length} tone={(aiReview.missingRequirements || []).length === 0 ? 'good' : 'danger'} />
              <MetricCard label="Weak Sections" value={(aiReview.weakSections || []).length} tone={(aiReview.weakSections || []).length === 0 ? 'good' : 'warn'} />
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-semibold">Review Summary</div>
              <p className="mt-2">{aiReview.reviewSummary || 'No AI review yet. Run AI Review first.'}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-700">Presentation Suggestions</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  {(aiReview.presentationSuggestions || []).length
                    ? aiReview.presentationSuggestions.map((suggestion, idx) => <li key={`${suggestion}-${idx}`}>{suggestion}</li>)
                    : <li>No suggestions recorded yet.</li>}
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-700">Missing Requirements</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  {(aiReview.missingRequirements || []).length
                    ? aiReview.missingRequirements.map((req, idx) => <li key={`${req}-${idx}`}>{req}</li>)
                    : <li>No missing requirements recorded.</li>}
                </ul>
              </div>
            </div>
            {aiReview.improvedDraft && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="font-semibold">Improved Draft</div>
                <p className="mt-2 whitespace-pre-line">{aiReview.improvedDraft}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'final_draft' && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {docxUrl ? (
              <div>
                <div className="font-semibold">Final draft is ready</div>
                <p className="mt-3">
                  <a
                    href={docxUrl}
                    download
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Download Word Document (.docx)
                  </a>
                </p>
                {finalDraftArtifact && (
                  <p className="mt-2">
                    <a className="text-blue-600 underline text-xs" href={buildApiUrl(`/proposals/${proposal.id}/artifacts/${finalDraftArtifact.id}`)} target="_blank" rel="noreferrer">
                      View raw markdown artifact
                    </a>
                  </p>
                )}
              </div>
            ) : (
              'No final draft yet. Run Final Draft to generate the Word document.'
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pricing Governance Panel ────────────────────────────────────────────────

const REVIEW_STATUSES = ['not_started', 'in_progress', 'approved', 'flagged'];
const CONSTRAINT_TYPES = ['ceiling', 'floor', 'fixed', 'not_to_exceed', 'range', 'other'];
const REVIEW_COLORS = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  flagged: 'bg-red-100 text-red-800',
};

function PricingGovernancePanel({ proposal, addToast, onProposalRefresh }) {
  const pg = proposal.pricingGovernance || {};
  const [saving, setSaving] = useState(false);

  const save = async (patch) => {
    setSaving(true);
    try {
      const res = await fetch(buildApiUrl(`/proposals/${proposal.id}/pricing-governance`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Save failed');
      await onProposalRefresh?.();
      addToast?.({ title: 'Pricing governance saved', variant: 'default' });
    } catch (e) {
      addToast?.({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleBool = (section, key) => {
    const cur = pg[section] || {};
    save({ [section]: { ...cur, [key]: !cur[key] } });
  };

  const updateField = (section, key, value) => {
    const cur = pg[section] || {};
    save({ [section]: { ...cur, [key]: value } });
  };

  const addConstraint = () => {
    const next = [...(pg.constraints || []), {
      id: `pgc-${Date.now()}`, lineItem: '', constraintType: 'ceiling',
      description: '', threshold: null, unit: '', source: '', status: 'open', notes: '',
    }];
    save({ constraints: next });
  };

  const removeConstraint = (id) => {
    save({ constraints: (pg.constraints || []).filter((c) => c.id !== id) });
  };

  const updateConstraint = (id, key, value) => {
    save({
      constraints: (pg.constraints || []).map((c) =>
        c.id === id ? { ...c, [key]: value } : c,
      ),
    });
  };

  const addAssumption = () => {
    const next = [...(pg.assumptions || []), {
      id: `pga-${Date.now()}`, text: '', validated: false, validatedBy: '', validatedAt: null, notes: '',
    }];
    save({ assumptions: next });
  };

  const removeAssumption = (id) => {
    save({ assumptions: (pg.assumptions || []).filter((a) => a.id !== id) });
  };

  const updateAssumption = (id, key, value) => {
    save({
      assumptions: (pg.assumptions || []).map((a) =>
        a.id === id ? { ...a, [key]: value } : a,
      ),
    });
  };

  const constraints = pg.constraints || [];
  const assumptions = pg.assumptions || [];
  const bond = pg.bondInsurance || {};
  const wage = pg.wageDetermination || {};
  const tax = pg.taxEscalation || {};

  return (
    <div className="space-y-6">
      {/* Review status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Review Status</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${REVIEW_COLORS[pg.reviewStatus] || REVIEW_COLORS.not_started}`}>
            {(pg.reviewStatus || 'not_started').replace(/_/g, ' ')}
          </span>
        </div>
        <select
          value={pg.reviewStatus || 'not_started'}
          onChange={(e) => save({ reviewStatus: e.target.value })}
          disabled={saving}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {REVIEW_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Margin Floor & Risk */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Margin Floor (%)</label>
          <input
            type="number" step="0.01" min="0" max="1"
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
            defaultValue={pg.marginFloor ?? ''}
            onBlur={(e) => {
              const v = e.target.value === '' ? null : Number(e.target.value);
              if (v !== pg.marginFloor) save({ marginFloor: v });
            }}
          />
          <p className="mt-1 text-xs text-gray-500">e.g. 0.15 = 15% minimum margin</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Risk Adjustment Notes</label>
          <textarea
            rows={2}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
            defaultValue={pg.riskAdjustmentNotes || ''}
            onBlur={(e) => {
              if (e.target.value !== (pg.riskAdjustmentNotes || '')) save({ riskAdjustmentNotes: e.target.value });
            }}
          />
        </div>
      </div>

      {/* Bond / Insurance */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Bond & Insurance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={bond.paymentBondRequired || false} onChange={() => toggleBool('bondInsurance', 'paymentBondRequired')} />
            Payment Bond
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={bond.performanceBondRequired || false} onChange={() => toggleBool('bondInsurance', 'performanceBondRequired')} />
            Performance Bond
          </label>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bond %</label>
            <input
              type="number" step="1" min="0"
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              defaultValue={bond.bondPercentage ?? ''}
              onBlur={(e) => updateField('bondInsurance', 'bondPercentage', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Insurance Min ($)</label>
            <input
              type="number" step="1000" min="0"
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              defaultValue={bond.insuranceMinimum ?? ''}
              onBlur={(e) => updateField('bondInsurance', 'insuranceMinimum', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-2">
          <textarea
            rows={1}
            placeholder="Insurance notes..."
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
            defaultValue={bond.insuranceNotes || ''}
            onBlur={(e) => updateField('bondInsurance', 'insuranceNotes', e.target.value)}
          />
        </div>
      </div>

      {/* Wage Determination */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Wage Determination</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={wage.required || false} onChange={() => toggleBool('wageDetermination', 'required')} />
            SCA/DBA Required
          </label>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Schedule Ref</label>
            <input
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              defaultValue={wage.wageScheduleRef || ''}
              onBlur={(e) => updateField('wageDetermination', 'wageScheduleRef', e.target.value)}
              placeholder="e.g. SCA WD 2015-4281"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <input
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              defaultValue={wage.notes || ''}
              onBlur={(e) => updateField('wageDetermination', 'notes', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tax & Escalation */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Tax & Escalation</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tax.taxExempt || false} onChange={() => toggleBool('taxEscalation', 'taxExempt')} />
            Tax Exempt
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tax.escalationClause || false} onChange={() => toggleBool('taxEscalation', 'escalationClause')} />
            Escalation Clause
          </label>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Escalation Cap %</label>
            <input
              type="number" step="0.1" min="0"
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              defaultValue={tax.escalationCapPct ?? ''}
              onBlur={(e) => updateField('taxEscalation', 'escalationCapPct', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <input
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              defaultValue={tax.escalationNotes || ''}
              onBlur={(e) => updateField('taxEscalation', 'escalationNotes', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pricing Constraints */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Line-Item Pricing Constraints</h4>
          <button
            onClick={addConstraint}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Add Constraint
          </button>
        </div>
        {constraints.length === 0 ? (
          <p className="text-sm text-gray-500">No pricing constraints defined yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Line Item</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Threshold</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {constraints.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <input className="w-full border-0 bg-transparent text-sm p-0" defaultValue={c.lineItem} onBlur={(e) => updateConstraint(c.id, 'lineItem', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <select className="border-0 bg-transparent text-sm p-0" value={c.constraintType} onChange={(e) => updateConstraint(c.id, 'constraintType', e.target.value)}>
                        {CONSTRAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" className="w-20 border-0 bg-transparent text-sm p-0" defaultValue={c.threshold ?? ''} onBlur={(e) => updateConstraint(c.id, 'threshold', e.target.value === '' ? null : Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-16 border-0 bg-transparent text-sm p-0" defaultValue={c.unit} onBlur={(e) => updateConstraint(c.id, 'unit', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-full border-0 bg-transparent text-sm p-0" defaultValue={c.source} onBlur={(e) => updateConstraint(c.id, 'source', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <select className="border-0 bg-transparent text-sm p-0" value={c.status} onChange={(e) => updateConstraint(c.id, 'status', e.target.value)}>
                        <option value="open">open</option>
                        <option value="met">met</option>
                        <option value="violated">violated</option>
                        <option value="waived">waived</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeConstraint(c.id)} className="text-red-400 hover:text-red-600 text-xs">x</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assumptions */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Assumptions Needing Validation</h4>
          <button
            onClick={addAssumption}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Add Assumption
          </button>
        </div>
        {assumptions.length === 0 ? (
          <p className="text-sm text-gray-500">No pricing assumptions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {assumptions.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded border border-gray-100 bg-gray-50 p-3">
                <input
                  type="checkbox"
                  checked={a.validated}
                  onChange={() => updateAssumption(a.id, 'validated', !a.validated)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <input
                    className="w-full bg-transparent text-sm font-medium p-0 border-0"
                    defaultValue={a.text}
                    onBlur={(e) => updateAssumption(a.id, 'text', e.target.value)}
                    placeholder="Describe the assumption..."
                  />
                  {a.validated && a.validatedBy && (
                    <span className="text-xs text-green-600 mt-1 block">Validated by {a.validatedBy}</span>
                  )}
                </div>
                <button onClick={() => removeAssumption(a.id)} className="text-red-400 hover:text-red-600 text-xs mt-1">x</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General notes */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing Governance Notes</label>
        <textarea
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          defaultValue={pg.notes || ''}
          onBlur={(e) => {
            if (e.target.value !== (pg.notes || '')) save({ notes: e.target.value });
          }}
          placeholder="Additional pricing governance notes, rationale, or review comments..."
        />
      </div>
    </div>
  );
}
