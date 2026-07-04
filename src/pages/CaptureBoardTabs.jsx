import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target, Users, Shield, BookOpen, Plus, Trash2,
  CheckCircle, Circle, ChevronRight, AlertTriangle, FileText,
  Archive, TrendingUp, X, Save,
} from 'lucide-react';
import { createCaptureRecord, createBidNoBidScore } from '../types.js';
import {
  getCaptureRecords, createCaptureRecordApi, updateCaptureRecordApi, deleteCaptureRecordApi,
  getKnowledgeItems, createKnowledgeItemApi, deleteKnowledgeItemApi,
} from '../lib/api.js';
import { buildApiUrl } from '../lib/runtimeApi.js';
import { getDaysUntilDue } from '../utils/dateUtils.js';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import FunnelHeader from '../components/capture/FunnelHeader.jsx';
import IntakePoolGrid from '../components/capture/IntakePoolGrid.jsx';
import DoNextQueue from '../components/capture/DoNextQueue.jsx';
import BlockedQueue from '../components/capture/BlockedQueue.jsx';

// ── Local-storage helpers (capture-record store; server synced when available) ─
const CR_KEY = 'pf:capture-records';
const KI_KEY = 'pf:knowledge-items';
function loadLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* no-op */ }
}

// ── Pool lanes (pre-award, selectable) ─────────────────────────────────────────
const POOL_LANES = ['watchlist', 'review_queue', 'active_pursuit'];

// ── Scoring / capture-record constants (preserved) ─────────────────────────────
const STAGES = [
  { value: 'detected',      label: 'Detected',      cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  { value: 'qualifying',    label: 'Qualifying',     cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'bid_review',    label: 'Bid Review',     cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'capture_active',label: 'Capture Active', cls: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'no_bid',        label: 'No Bid',         cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'awaiting_rfp',  label: 'Awaiting RFP',   cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
];

const SCORE_DIMS = [
  { key: 'competitiveFit',    label: 'Competitive Fit',    help: 'Alignment to our capabilities and service lanes' },
  { key: 'pastPerformanceFit',label: 'Past Performance Fit',help: 'Depth of relevant past performance' },
  { key: 'teamingReadiness',  label: 'Teaming Readiness',  help: 'Ability to field a complete team (1=major gaps)' },
  { key: 'pricingConfidence', label: 'Pricing Confidence', help: 'Confidence in PTW and margin (1=unknown)' },
  { key: 'strategicValue',    label: 'Strategic Value',    help: 'Pipeline / relationship / growth value' },
  { key: 'incumbentStrength', label: 'Incumbent Strength', help: 'Incumbent entrenchment — lower is better for us (1=none, 5=entrenched)' },
];

const REC_LABELS = { bid: 'BID', no_bid: 'NO BID', conditional: 'CONDITIONAL' };
const REC_CLS = {
  bid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  no_bid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  conditional: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const STAKEHOLDER_ROLES = ['CO', 'COR', 'PM', 'OSDBU', 'SBA Rep', 'Program Director', 'Budget Officer', 'End User', 'Other'];
const KI_TYPES = ['foia', 'protest', 'debrief', 'prior_proposal'];
const KI_TYPE_LABELS = { foia: 'FOIA', protest: 'Protest', debrief: 'Debrief', prior_proposal: 'Prior Proposal' };
const COMPLIANCE_STATUSES = ['open', 'addressed', 'waived', 'na'];

function calcTotal(s) {
  return SCORE_DIMS.reduce((sum, d) => sum + (Number(s[d.key]) || 3), 0);
}
function calcPwin(s) {
  const pos = (s.competitiveFit || 3) + (s.pastPerformanceFit || 3) + (s.teamingReadiness || 3) + (s.pricingConfidence || 3) + (s.strategicValue || 3);
  const raw = Math.round(((pos - 5) / 20) * 90 + 5 - (((s.incumbentStrength || 3) - 1) / 4) * 30);
  return Math.max(5, Math.min(95, raw));
}
function calcRec(s) {
  const adj = calcTotal(s) - (s.incumbentStrength || 3);
  if (adj >= 19) return 'bid';
  if (adj >= 13) return 'conditional';
  return 'no_bid';
}

function RecPill({ rec }) {
  if (!rec) return null;
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${REC_CLS[rec] || ''}`}>{REC_LABELS[rec] || rec}</span>;
}
function NoSelection() {
  return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-600">
      <Target size={40} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">Capture an opportunity from the Intake Pool to open its dossier.</p>
    </div>
  );
}
function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-4">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        {Icon && <Icon size={16} className="text-rare-crimson" />}
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = 'w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rare-crimson/40';
const smBtnCls = 'px-2 py-1 text-xs rounded font-medium';

// ── Scorecard Tab (drawer) ─────────────────────────────────────────────────────
function ScorecardTab({ record, onUpdate }) {
  const base = record?.bidNoBid || createBidNoBidScore();
  const [scores, setScores] = useState({ ...base });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (record) {
      setScores(record.bidNoBid ? { ...record.bidNoBid } : createBidNoBidScore());
      setDirty(false);
    }
  }, [record?.id]);

  if (!record) return <NoSelection />;

  const total = calcTotal(scores);
  const autoRec = calcRec(scores);
  const autoPwin = calcPwin(scores);

  function setDim(key, val) {
    setScores((prev) => ({ ...prev, [key]: Number(val) }));
    setDirty(true);
  }
  function save() {
    const updated = { ...scores, total, recommendation: autoRec, pwin: autoPwin };
    onUpdate(record.id, { bidNoBid: updated });
    setScores(updated);
    setDirty(false);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">{record.title || record.opportunityId}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{record.agency}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{total}<span className="text-sm text-gray-400">/30</span></div>
          <RecPill rec={autoRec} />
        </div>
      </div>

      <Section title="Bid / No-Bid Scoring Dimensions" icon={TrendingUp}>
        <div className="space-y-4">
          {SCORE_DIMS.map((dim) => (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dim.label}</span>
                <span className="text-sm font-bold text-rare-crimson w-6 text-right">{scores[dim.key] || 3}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{dim.help}</p>
              <input
                type="range" min="1" max="5" step="1"
                value={scores[dim.key] || 3}
                onChange={(e) => setDim(dim.key, e.target.value)}
                className="w-full accent-rare-crimson"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>1 — Weak</span><span>3 — Moderate</span><span>5 — Strong</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pwin Estimate & Recommendation" icon={Target}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 text-center">
            <div className="text-3xl font-bold text-rare-crimson">{scores.pwin != null ? scores.pwin : autoPwin}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pwin Estimate</div>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 text-center">
            <div className="mt-1"><RecPill rec={autoRec} /></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Auto-Recommendation</div>
          </div>
        </div>
        <Field label="Override Pwin (0–100)">
          <input
            type="number" min="0" max="100" className={inputCls}
            value={scores.pwin != null ? scores.pwin : autoPwin}
            onChange={(e) => { setScores((p) => ({ ...p, pwin: Number(e.target.value) })); setDirty(true); }}
          />
        </Field>
        <Field label="Rationale / Notes">
          <textarea
            className={inputCls} rows={3}
            value={scores.rationale || ''}
            onChange={(e) => { setScores((p) => ({ ...p, rationale: e.target.value })); setDirty(true); }}
            placeholder="Key factors driving this recommendation…"
          />
        </Field>
      </Section>

      <button onClick={save} disabled={!dirty} className="btn btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
        <Save size={14} /> {dirty ? 'Save Scorecard' : 'Saved'}
      </button>
    </div>
  );
}

// ── Dossier Tab (drawer) ────────────────────────────────────────────────────────
function DossierTab({ record, onUpdate }) {
  const [localRec, setLocalRec] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (record) { setLocalRec({ ...record }); setDirty(false); }
  }, [record?.id]);

  if (!record || !localRec) return <NoSelection />;

  function set(path, value) { setLocalRec((prev) => ({ ...prev, [path]: value })); setDirty(true); }
  function save() { onUpdate(record.id, localRec); setDirty(false); }

  function addStakeholder() {
    set('stakeholders', [...(localRec.stakeholders || []), { role: 'CO', name: '', agency: '', notes: '' }]);
  }
  function updateStakeholder(i, patch) {
    const arr = [...(localRec.stakeholders || [])];
    arr[i] = { ...arr[i], ...patch };
    set('stakeholders', arr);
  }
  function removeStakeholder(i) {
    set('stakeholders', (localRec.stakeholders || []).filter((_, idx) => idx !== i));
  }
  function addToList(key) { set(key, [...(localRec[key] || []), '']); }
  function updateListItem(key, i, val) {
    const arr = [...(localRec[key] || [])];
    arr[i] = val;
    set(key, arr);
  }
  function removeListItem(key, i) {
    set(key, (localRec[key] || []).filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">{localRec.title || localRec.opportunityId}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{localRec.agency}</p>
        </div>
        <button onClick={save} disabled={!dirty} className="btn btn-primary text-sm flex items-center gap-1 disabled:opacity-50">
          <Save size={13} /> {dirty ? 'Save Dossier' : 'Saved'}
        </button>
      </div>

      <Section title="Incumbent / Competitor" icon={AlertTriangle}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Incumbent Name">
            <input className={inputCls} value={localRec.incumbentName || ''} onChange={(e) => set('incumbentName', e.target.value)} placeholder="Company name or 'Unknown'" />
          </Field>
          <Field label="Incumbent Contract #">
            <input className={inputCls} value={localRec.incumbentContractNumber || ''} onChange={(e) => set('incumbentContractNumber', e.target.value)} placeholder="FPDS / USASpending contract number" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Incumbent & Competitor Notes">
              <textarea className={inputCls} rows={3} value={localRec.incumbentNotes || ''} onChange={(e) => set('incumbentNotes', e.target.value)} placeholder="Award history, vehicle usage, known weaknesses, pricing patterns, FPDS data…" />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Stakeholder Map" icon={Users}>
        {(localRec.stakeholders || []).length === 0
          ? <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">No stakeholders added.</p>
          : (
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-1 pr-2">Role</th><th className="pb-1 pr-2">Name</th><th className="pb-1 pr-2">Agency</th><th className="pb-1 pr-2">Notes</th><th />
                </tr>
              </thead>
              <tbody>
                {(localRec.stakeholders || []).map((sh, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                    <td className="pr-2 py-1">
                      <select className="text-xs rounded border border-gray-200 dark:border-gray-600 bg-transparent dark:text-gray-300 px-1 py-0.5" value={sh.role} onChange={(e) => updateStakeholder(i, { role: e.target.value })}>
                        {STAKEHOLDER_ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="pr-2 py-1"><input className="text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5 w-full" value={sh.name || ''} onChange={(e) => updateStakeholder(i, { name: e.target.value })} placeholder="Name" /></td>
                    <td className="pr-2 py-1"><input className="text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5 w-full" value={sh.agency || ''} onChange={(e) => updateStakeholder(i, { agency: e.target.value })} placeholder="Agency / Office" /></td>
                    <td className="pr-2 py-1"><input className="text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5 w-full" value={sh.notes || ''} onChange={(e) => updateStakeholder(i, { notes: e.target.value })} placeholder="Notes" /></td>
                    <td className="py-1"><button onClick={() => removeStakeholder(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
        <button onClick={addStakeholder} className="btn btn-secondary text-xs flex items-center gap-1"><Plus size={12} /> Add Stakeholder</button>
      </Section>

      <Section title="Win Themes" icon={Target}>
        <div className="space-y-2 mb-3">
          {(localRec.winThemes || []).map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={inputCls + ' flex-1'} value={t} onChange={(e) => updateListItem('winThemes', i, e.target.value)} placeholder={`Win theme ${i + 1}…`} />
              <button onClick={() => removeListItem('winThemes', i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
            </div>
          ))}
          {(localRec.winThemes || []).length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No win themes yet.</p>}
        </div>
        <button onClick={() => addToList('winThemes')} className="btn btn-secondary text-xs flex items-center gap-1"><Plus size={12} /> Add Win Theme</button>
      </Section>

      <Section title="Ghosting Targets (Incumbent Weaknesses to Contrast)" icon={ChevronRight}>
        <div className="space-y-2 mb-3">
          {(localRec.ghostingTargets || []).map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={inputCls + ' flex-1'} value={t} onChange={(e) => updateListItem('ghostingTargets', i, e.target.value)} placeholder="Incumbent weakness or gap to contrast…" />
              <button onClick={() => removeListItem('ghostingTargets', i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
            </div>
          ))}
          {(localRec.ghostingTargets || []).length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No ghosting targets yet.</p>}
        </div>
        <button onClick={() => addToList('ghostingTargets')} className="btn btn-secondary text-xs flex items-center gap-1"><Plus size={12} /> Add Target</button>
      </Section>

      <Section title="Teaming Gaps" icon={Users}>
        <div className="space-y-2 mb-3">
          {(localRec.teamingGaps || []).map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={inputCls + ' flex-1'} value={t} onChange={(e) => updateListItem('teamingGaps', i, e.target.value)} placeholder="Capability gap needing a teaming partner…" />
              <button onClick={() => removeListItem('teamingGaps', i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
            </div>
          ))}
          {(localRec.teamingGaps || []).length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No teaming gaps identified.</p>}
        </div>
        <button onClick={() => addToList('teamingGaps')} className="btn btn-secondary text-xs flex items-center gap-1"><Plus size={12} /> Add Gap</button>
      </Section>

      <Section title="OCI, Affiliation & Pricing Notes" icon={Shield}>
        <Field label="OCI / Affiliation / Subcontracting Risks">
          <textarea className={inputCls} rows={3} value={localRec.ociNotes || ''} onChange={(e) => set('ociNotes', e.target.value)} placeholder="OCI risks, SBA affiliation considerations, limitations-on-subcontracting check…" />
        </Field>
        <Field label="Price-to-Win / Pricing Notes">
          <textarea className={inputCls} rows={3} value={localRec.pricingNotes || ''} onChange={(e) => set('pricingNotes', e.target.value)} placeholder="PTW estimate, CLIN structure hypotheses, pricing strategy…" />
        </Field>
      </Section>
    </div>
  );
}

// ── Compliance Tab (drawer) ─────────────────────────────────────────────────────
function ComplianceTab({ record, onUpdate }) {
  const [localRec, setLocalRec] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (record) { setLocalRec({ ...record }); setDirty(false); }
  }, [record?.id]);

  if (!record || !localRec) return <NoSelection />;

  function set(key, value) { setLocalRec((p) => ({ ...p, [key]: value })); setDirty(true); }
  function setPortal(key, value) { set('portalReadiness', { ...(localRec.portalReadiness || {}), [key]: value }); }
  function save() { onUpdate(record.id, localRec); setDirty(false); }

  function addCompItem() {
    set('complianceItems', [...(localRec.complianceItems || []), { id: `ci-${Date.now()}`, section: '', requirement: '', owner: '', status: 'open', notes: '' }]);
  }
  function updateCompItem(i, patch) {
    const arr = [...(localRec.complianceItems || [])];
    arr[i] = { ...arr[i], ...patch };
    set('complianceItems', arr);
  }
  function removeCompItem(i) {
    set('complianceItems', (localRec.complianceItems || []).filter((_, idx) => idx !== i));
  }

  const portal = localRec.portalReadiness || {};
  const portalScore = [portal.samActive, portal.portalIdentified, portal.credentialsConfirmed].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">{localRec.title || localRec.opportunityId}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{localRec.agency}</p>
        </div>
        <button onClick={save} disabled={!dirty} className="btn btn-primary text-sm flex items-center gap-1 disabled:opacity-50">
          <Save size={13} /> {dirty ? 'Save Compliance' : 'Saved'}
        </button>
      </div>

      <Section title="Section L / M Extraction Notes" icon={FileText}>
        <Field label="Key Evaluation Factors & Subfactors">
          <textarea className={inputCls} rows={4} value={localRec.sectionLMNotes || ''} onChange={(e) => set('sectionLMNotes', e.target.value)} placeholder="Paste or summarize Section L instructions and Section M evaluation criteria…" />
        </Field>
        <Field label="Submission Risk Notes">
          <textarea className={inputCls} rows={3} value={localRec.submissionRiskNotes || ''} onChange={(e) => set('submissionRiskNotes', e.target.value)} placeholder="Page limits, file format requirements, portal-specific risks, late-submission history…" />
        </Field>
      </Section>

      <Section title="Compliance Matrix Starter" icon={CheckCircle}>
        <div className="overflow-x-auto mb-3">
          {(localRec.complianceItems || []).length === 0
            ? <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">No compliance items yet. Add from Section L/M.</p>
            : (
              <table className="min-w-full text-xs mb-2">
                <thead>
                  <tr className="text-left text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-1 pr-2">Section Ref</th>
                    <th className="pb-1 pr-2">Requirement</th>
                    <th className="pb-1 pr-2">Owner</th>
                    <th className="pb-1 pr-2">Status</th>
                    <th className="pb-1 pr-2">Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(localRec.complianceItems || []).map((ci, i) => (
                    <tr key={ci.id || i} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="pr-2 py-1 w-20"><input className="w-full text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-1 py-0.5" value={ci.section} onChange={(e) => updateCompItem(i, { section: e.target.value })} placeholder="L-1" /></td>
                      <td className="pr-2 py-1"><input className="w-full text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-1 py-0.5" value={ci.requirement} onChange={(e) => updateCompItem(i, { requirement: e.target.value })} placeholder="Requirement text" /></td>
                      <td className="pr-2 py-1 w-24"><input className="w-full text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-1 py-0.5" value={ci.owner} onChange={(e) => updateCompItem(i, { owner: e.target.value })} placeholder="Owner" /></td>
                      <td className="pr-2 py-1 w-24">
                        <select className="text-xs rounded border border-gray-200 dark:border-gray-600 bg-transparent dark:text-gray-300 px-1 py-0.5" value={ci.status} onChange={(e) => updateCompItem(i, { status: e.target.value })}>
                          {COMPLIANCE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="pr-2 py-1"><input className="w-full text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-1 py-0.5" value={ci.notes} onChange={(e) => updateCompItem(i, { notes: e.target.value })} placeholder="Notes" /></td>
                      <td className="py-1"><button onClick={() => removeCompItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
        <button onClick={addCompItem} className="btn btn-secondary text-xs flex items-center gap-1"><Plus size={12} /> Add Requirement</button>
      </Section>

      <Section title="Portal Readiness" icon={Shield}>
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-rare-lime h-2 rounded-full transition-all" style={{ width: `${(portalScore / 3) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{portalScore}/3</span>
          </div>
          {[
            { key: 'samActive', label: 'SAM.gov registration active and current' },
            { key: 'portalIdentified', label: 'Submission portal identified (SAM, agency-specific, etc.)' },
            { key: 'credentialsConfirmed', label: 'Portal credentials confirmed and tested' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 mb-2 cursor-pointer">
              <button onClick={() => setPortal(key, !portal[key])} className="focus:outline-none">
                {portal[key] ? <CheckCircle size={18} className="text-rare-lime" /> : <Circle size={18} className="text-gray-300 dark:text-gray-600" />}
              </button>
              <span className={`text-sm ${portal[key] ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
            </label>
          ))}
        </div>
        <Field label="Portal Notes">
          <textarea className={inputCls} rows={2} value={portal.notes || ''} onChange={(e) => setPortal('notes', e.target.value)} placeholder="Portal-specific instructions, login notes, file format requirements…" />
        </Field>
      </Section>
    </div>
  );
}

// ── Knowledge Library (standalone slide-over) ───────────────────────────────────
function KnowledgeTab({ items, onAdd, onDelete }) {
  const [kiType, setKiType] = useState('foia');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', agency: '', date: '', status: '', outcome: '', notes: '' });

  const filtered = items.filter((k) => k.type === kiType);

  function handleAdd(e) {
    e.preventDefault();
    onAdd({ ...form, type: kiType });
    setForm({ title: '', agency: '', date: '', status: '', outcome: '', notes: '' });
    setShowForm(false);
  }

  const fieldsByType = {
    foia: ['Submitted', 'Pending', 'Received', 'Denied'],
    protest: ['Filed', 'Active', 'Sustained', 'Denied', 'Withdrawn'],
    debrief: ['Requested', 'Scheduled', 'Completed'],
    prior_proposal: ['Won', 'Lost', 'No Award', 'Withdrawn'],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {KI_TYPES.map((t) => (
          <button key={t} onClick={() => setKiType(t)} className={`${smBtnCls} ${kiType === t ? 'bg-rare-crimson text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {KI_TYPE_LABELS[t]} ({items.filter((k) => k.type === t).length})
          </button>
        ))}
        <button onClick={() => setShowForm(!showForm)} className="ml-auto btn btn-primary flex items-center gap-1 text-sm">
          <Plus size={15} /> Add {KI_TYPE_LABELS[kiType]}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-rare-crimson/20 bg-rare-cream dark:bg-white/5 p-4">
          <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-gray-200">New {KI_TYPE_LABELS[kiType]} Record</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label={kiType === 'prior_proposal' ? 'Proposal Title *' : kiType === 'protest' ? 'Case / Docket #' : kiType === 'debrief' ? 'Opportunity Title *' : 'FOIA Request Subject *'}>
              <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Agency">
              <input className={inputCls} value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} />
            </Field>
            <Field label={kiType === 'foia' ? 'Submitted Date' : kiType === 'protest' ? 'Filed Date' : kiType === 'debrief' ? 'Debrief Date' : 'Proposal Date'}>
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="">— Select —</option>
                {(fieldsByType[kiType] || []).map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            {kiType !== 'foia' && (
              <Field label="Outcome">
                <input className={inputCls} value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} placeholder="Result or final outcome" />
              </Field>
            )}
            <div className={kiType !== 'foia' ? '' : 'md:col-span-2'}>
              <Field label={kiType === 'debrief' ? 'Key Findings / Lessons' : kiType === 'protest' ? 'Lessons Learned' : kiType === 'prior_proposal' ? 'Lessons / Reference Path' : 'Notes'}>
                <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn btn-primary text-sm">Add</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0
        ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-600">
            <Archive size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No {KI_TYPE_LABELS[kiType]} records yet.</p>
          </div>
        )
        : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Title / Subject</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Agency</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Outcome / Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <tr key={k.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{k.title}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{k.agency || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-500 whitespace-nowrap">{k.date || '—'}</td>
                    <td className="px-3 py-2">
                      {k.status && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{k.status}</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-xs">
                      <span className="line-clamp-2">{k.outcome || k.notes || '—'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => onDelete(k.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

// ── Slide-over drawer shell ─────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative z-50 h-full w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} overflow-y-auto bg-white shadow-modal dark:bg-rare-dark`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rare-gray-light bg-white px-5 py-3 dark:border-white/10 dark:bg-rare-dark">
          <h2 className="font-rare-serif text-lg font-bold text-rare-ink dark:text-white">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-rare-gray hover:text-rare-ink dark:text-white/50 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const DRAWER_TABS = [
  { id: 'scorecard', label: 'Scorecard', icon: TrendingUp },
  { id: 'dossier', label: 'Dossier', icon: Users },
  { id: 'compliance', label: 'Compliance', icon: Shield },
];

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function CaptureBoardTabs() {
  const { proposals, fetchProposals, isLoading } = useProposalContext();

  // Capture-record store (localStorage-primary, server best-effort)
  const [records, setRecords] = useState(() => loadLS(CR_KEY, []));
  const [knowledgeItems, setKnowledgeItems] = useState(() => loadLS(KI_KEY, []));
  const [selectedId, setSelectedId] = useState(null);
  const [drawerTab, setDrawerTab] = useState('scorecard');
  const [showKnowledge, setShowKnowledge] = useState(false);

  const selected = useMemo(() => records.find((r) => r.id === selectedId) || null, [records, selectedId]);

  useEffect(() => {
    getCaptureRecords().then((serverRecords) => {
      if (serverRecords.length > 0) { setRecords(serverRecords); saveLS(CR_KEY, serverRecords); }
    });
    getKnowledgeItems().then((serverItems) => {
      if (serverItems.length > 0) { setKnowledgeItems(serverItems); saveLS(KI_KEY, serverItems); }
    });
  }, []);

  // ── Capture-record CRUD ─────────────────────────────────────────────────────
  const updateRecord = useCallback((id, patch) => {
    setRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r));
      saveLS(CR_KEY, next);
      updateCaptureRecordApi(id, patch).catch(() => {});
      return next;
    });
  }, []);

  const deleteRecord = useCallback((id) => {
    setRecords((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveLS(CR_KEY, next);
      deleteCaptureRecordApi(id).catch(() => {});
      return next;
    });
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const addKnowledgeItem = useCallback((data) => {
    const now = new Date().toISOString();
    const item = { id: `ki-${Date.now()}`, ...data, createdAt: now, updatedAt: now };
    setKnowledgeItems((prev) => {
      const next = [item, ...prev];
      saveLS(KI_KEY, next);
      createKnowledgeItemApi(item).catch(() => {});
      return next;
    });
  }, []);

  const deleteKnowledgeItem = useCallback((id) => {
    setKnowledgeItems((prev) => {
      const next = prev.filter((k) => k.id !== id);
      saveLS(KI_KEY, next);
      deleteKnowledgeItemApi(id).catch(() => {});
      return next;
    });
  }, []);

  // ── Lane mutation + capture promotion ───────────────────────────────────────
  const handleMoveLane = useCallback(async (proposalId, targetLane) => {
    try {
      const res = await fetch(buildApiUrl(`/proposals/${proposalId}/lane`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeLane: targetLane }),
      });
      if (!res.ok) return false;
      await fetchProposals();
      return true;
    } catch {
      return false;
    }
  }, [fetchProposals]);

  const handleCapture = useCallback(async (proposalId) => {
    const proposal = proposals.find((p) => p.id === proposalId);
    // 1) promote lane to active_pursuit
    await handleMoveLane(proposalId, 'active_pursuit');
    // 2) create a linked capture record
    const now = new Date().toISOString();
    const base = createCaptureRecord(proposal?.solicitationNumber || proposalId);
    const rec = {
      ...base,
      id: base.id,
      opportunityId: proposalId,
      title: proposal?.title || 'Untitled',
      agency: proposal?.agency && proposal.agency !== 'Unknown Agency' ? proposal.agency : '',
      dueDate: proposal?.dueDate || '',
      solicitationNumber: proposal?.solicitationNumber || '',
      naicsCodes: proposal?.naics ? [String(proposal.naics)] : [],
      stage: 'capture_active',
      createdAt: now,
      updatedAt: now,
    };
    setRecords((prev) => {
      const next = [rec, ...prev];
      saveLS(CR_KEY, next);
      createCaptureRecordApi(rec).catch(() => {});
      return next;
    });
    setSelectedId(rec.id);
    setDrawerTab('scorecard');
  }, [proposals, handleMoveLane]);

  // ── Derivations from real proposal data ─────────────────────────────────────
  // Intake pool: pre-award lanes with an ACTIVE due date (exclude past-due,
  // today, and tomorrow — owner rule). fitScore/NAICS filtering lives in the grid.
  const pool = useMemo(() => {
    return (proposals || []).filter((p) => {
      if (!POOL_LANES.includes(p.intakeLane)) return false;
      const days = getDaysUntilDue(p.dueDate);
      return typeof days === 'number' && days >= 2;
    });
  }, [proposals]);

  const naicsOptions = useMemo(() => {
    const set = new Set();
    pool.forEach((p) => {
      const codes = [p.naics, ...(p.metadata?.naics ? [p.metadata.naics] : [])].filter(Boolean);
      codes.forEach((c) => set.add(String(c)));
    });
    return Array.from(set).sort();
  }, [pool]);

  const laneCounts = useMemo(() => {
    const c = { watchlist: 0, review_queue: 0, active_pursuit: 0 };
    (proposals || []).forEach((p) => {
      if (c[p.intakeLane] != null) c[p.intakeLane] += 1;
    });
    return c;
  }, [proposals]);

  // Do-Next: incomplete tasks across active_pursuit proposals, sorted by dueDate.
  const doNext = useMemo(() => {
    const items = [];
    (proposals || []).forEach((p) => {
      if (p.intakeLane !== 'active_pursuit') return;
      (Array.isArray(p.tasks) ? p.tasks : []).forEach((t) => {
        if (t.completed) return;
        items.push({
          proposalId: p.id,
          proposalTitle: p.title || 'Untitled',
          taskId: t.id,
          taskTitle: t.title || 'Task',
          owner: t.owner || null,
          dueDate: t.dueDate || null,
          stage: p.workflow?.currentStage || p.status || null,
        });
      });
    });
    items.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    return items;
  }, [proposals]);

  // Blocked: derived (metadata.blockers is never populated).
  const blocked = useMemo(() => {
    const out = [];
    (proposals || []).forEach((p) => {
      if (p.status === 'closed' || p.intakeLane === 'archive') return;
      const reasons = [];

      // Dirty stage handoffs
      (Array.isArray(p.stageHandoffs) ? p.stageHandoffs : []).forEach((h) => {
        if (h.signal && h.signal !== 'clean') {
          reasons.push({ type: 'handoff', label: `Handoff ${h.from || '?'}→${h.to || '?'}: ${h.signal}` });
        } else if (Array.isArray(h.outputsMissing) && h.outputsMissing.length > 0) {
          reasons.push({ type: 'handoff', label: `Missing outputs at ${h.to || 'stage'}: ${h.outputsMissing.join(', ')}` });
        }
      });

      // Overdue incomplete tasks
      (Array.isArray(p.tasks) ? p.tasks : []).forEach((t) => {
        if (t.completed || !t.dueDate) return;
        const days = getDaysUntilDue(t.dueDate);
        if (typeof days === 'number' && days < 0) {
          reasons.push({ type: 'overdue_task', label: `Overdue: ${t.taskTitle || t.title || 'task'}` });
        }
      });

      // Compliance gaps
      const cs = p.complianceStatus || {};
      if (cs.blockedRequirementCount > 0) reasons.push({ type: 'compliance', label: `${cs.blockedRequirementCount} blocked requirement(s)` });
      if (cs.disqualifyingOmissionCount > 0) reasons.push({ type: 'compliance', label: `${cs.disqualifyingOmissionCount} disqualifying omission(s)` });
      if (cs.unresolvedGapCount > 0) reasons.push({ type: 'compliance', label: `${cs.unresolvedGapCount} unresolved gap(s)` });

      // Explicit blockers (if ever populated)
      (Array.isArray(p.metadata?.blockers) ? p.metadata.blockers : []).forEach((b) => {
        reasons.push({ type: 'blocker', label: typeof b === 'string' ? b : (b.label || 'Blocked') });
      });

      if (reasons.length > 0) {
        out.push({
          proposalId: p.id,
          proposalTitle: p.title || 'Untitled',
          reasons,
          since: p.updatedAt || null,
        });
      }
    });
    return out;
  }, [proposals]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        title="Capture Board"
        subtitle="What to pursue, what to do next, what's blocked"
        actions={
          <button
            onClick={() => setShowKnowledge(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rare-gray-light bg-white px-3 py-1.5 text-sm font-medium text-rare-ink hover:bg-rare-cream dark:border-white/10 dark:bg-rare-ink dark:text-white dark:hover:bg-white/5"
          >
            <BookOpen size={15} /> Knowledge Library
          </button>
        }
      />

      {isLoading && (proposals || []).length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rare-crimson" />
        </div>
      ) : (
        <div className="space-y-6">
          <FunnelHeader counts={laneCounts} filteredOut={laneCounts.watchlist + laneCounts.review_queue + laneCounts.active_pursuit - pool.length} />

          {/* Intake Pool */}
          <IntakePoolGrid
            proposals={pool}
            onCapture={handleCapture}
            onMoveLane={handleMoveLane}
            naicsOptions={naicsOptions}
          />

          {/* Do-Next + Blocked */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DoNextQueue items={doNext} />
            <BlockedQueue items={blocked} />
          </div>
        </div>
      )}

      {/* Capture record detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.title || 'Capture Record'}
        wide
      >
        {selected && (
          <>
            <div className="mb-4 flex items-center gap-1 border-b border-rare-gray-light dark:border-white/10">
              {DRAWER_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setDrawerTab(id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 font-rare-sans text-xs font-semibold uppercase tracking-wide transition-colors ${
                    drawerTab === id
                      ? 'border-rare-crimson text-rare-crimson'
                      : 'border-transparent text-rare-gray hover:text-rare-ink dark:text-white/50 dark:hover:text-white'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
              <button
                onClick={() => deleteRecord(selected.id)}
                className="ml-auto flex items-center gap-1 px-2 py-2 text-xs text-rare-crimson hover:underline"
                title="Delete capture record"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
            {drawerTab === 'scorecard' && <ScorecardTab record={selected} onUpdate={updateRecord} />}
            {drawerTab === 'dossier' && <DossierTab record={selected} onUpdate={updateRecord} />}
            {drawerTab === 'compliance' && <ComplianceTab record={selected} onUpdate={updateRecord} />}
          </>
        )}
      </Drawer>

      {/* Knowledge library drawer */}
      <Drawer open={showKnowledge} onClose={() => setShowKnowledge(false)} title="Knowledge Library" wide>
        <KnowledgeTab items={knowledgeItems} onAdd={addKnowledgeItem} onDelete={deleteKnowledgeItem} />
      </Drawer>
    </div>
  );
}
