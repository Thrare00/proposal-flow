import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Radar, Target, Users, Shield, BookOpen, Plus, Trash2,
  CheckCircle, Circle, ChevronRight, AlertTriangle, FileText,
  Archive, TrendingUp, Edit2, X, Save,
} from 'lucide-react';
import { createCaptureRecord, createBidNoBidScore } from '../types.js';
import { getCaptureRecords, createCaptureRecordApi, updateCaptureRecordApi, deleteCaptureRecordApi, getKnowledgeItems, createKnowledgeItemApi, deleteKnowledgeItemApi } from '../lib/api.js';

// ── Local-storage helpers (primary store; server synced when available) ────────
const CR_KEY = 'pf:capture-records';
const KI_KEY = 'pf:knowledge-items';
function loadLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* no-op */ }
}

// ── Constants ─────────────────────────────────────────────────────────────────
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

// ── Scoring helpers ───────────────────────────────────────────────────────────
function calcTotal(s) {
  return SCORE_DIMS.reduce((sum, d) => sum + (Number(s[d.key]) || 3), 0);
}
function calcPwin(s) {
  // competitive factors (higher = better) minus incumbent penalty
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

function stageInfo(val) { return STAGES.find((s) => s.value === val) || STAGES[0]; }

// ── Small UI helpers ──────────────────────────────────────────────────────────
function StagePill({ stage }) {
  const s = stageInfo(stage);
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}
function RecPill({ rec }) {
  if (!rec) return null;
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${REC_CLS[rec] || ''}`}>{REC_LABELS[rec] || rec}</span>;
}
function NoSelection() {
  return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-600">
      <Target size={40} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">Select a capture record from the <strong>Pipeline</strong> tab first.</p>
    </div>
  );
}
function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-4">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        {Icon && <Icon size={16} className="text-blue-500" />}
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
const inputCls = 'w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const smBtnCls = 'px-2 py-1 text-xs rounded font-medium';

// ── Pipeline Tab ──────────────────────────────────────────────────────────────
function PipelineTab({ records, selectedId, setSelectedId, onAdd, onDelete, onUpdateStage }) {
  const [stageFilter, setStageFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', agency: '', dueDate: '', rfpDate: '',
    solicitationNumber: '', setAside: '', sourceUrl: '',
    naicsCodes: '', pscCodes: '', stage: 'detected', notes: '',
  });

  const filtered = useMemo(() => {
    if (stageFilter === 'all') return records;
    return records.filter((r) => r.stage === stageFilter);
  }, [records, stageFilter]);

  function handleAdd(e) {
    e.preventDefault();
    onAdd({
      ...form,
      naicsCodes: form.naicsCodes ? form.naicsCodes.split(',').map((s) => s.trim()).filter(Boolean) : [],
      pscCodes: form.pscCodes ? form.pscCodes.split(',').map((s) => s.trim()).filter(Boolean) : [],
    });
    setForm({ title: '', agency: '', dueDate: '', rfpDate: '', solicitationNumber: '', setAside: '', sourceUrl: '', naicsCodes: '', pscCodes: '', stage: 'detected', notes: '' });
    setShowForm(false);
  }

  const counts = useMemo(() => {
    const c = { all: records.length };
    STAGES.forEach((s) => { c[s.value] = records.filter((r) => r.stage === s.value).length; });
    return c;
  }, [records]);

  return (
    <div className="space-y-4">
      {/* Stage filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => setStageFilter('all')} className={`${smBtnCls} ${stageFilter === 'all' ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          All ({counts.all})
        </button>
        {STAGES.map((s) => (
          <button key={s.value} onClick={() => setStageFilter(s.value)} className={`${smBtnCls} ${stageFilter === s.value ? s.cls + ' font-bold' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
            {s.label} ({counts[s.value] || 0})
          </button>
        ))}
        <button onClick={() => setShowForm(!showForm)} className="ml-auto btn btn-primary flex items-center gap-1 text-sm">
          <Plus size={15} /> New Record
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
          <h3 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-200">New Capture Record</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Opportunity Title *">
              <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Environmental Services Support BPA" />
            </Field>
            <Field label="Agency">
              <input className={inputCls} value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} placeholder="e.g. EPA, DoD, GSA" />
            </Field>
            <Field label="Solicitation Number">
              <input className={inputCls} value={form.solicitationNumber} onChange={(e) => setForm({ ...form, solicitationNumber: e.target.value })} placeholder="e.g. W912HV-25-R-0012" />
            </Field>
            <Field label="Set-Aside">
              <input className={inputCls} value={form.setAside} onChange={(e) => setForm({ ...form, setAside: e.target.value })} placeholder="e.g. 8(a), SDVOSB, WOSB, SB, None" />
            </Field>
            <Field label="Submission Due Date">
              <input className={inputCls} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <Field label="Expected RFP Date">
              <input className={inputCls} type="date" value={form.rfpDate} onChange={(e) => setForm({ ...form, rfpDate: e.target.value })} />
            </Field>
            <Field label="NAICS Codes (comma-separated)">
              <input className={inputCls} value={form.naicsCodes} onChange={(e) => setForm({ ...form, naicsCodes: e.target.value })} placeholder="e.g. 562910, 611430" />
            </Field>
            <Field label="PSC Codes (comma-separated)">
              <input className={inputCls} value={form.pscCodes} onChange={(e) => setForm({ ...form, pscCodes: e.target.value })} placeholder="e.g. F999, U099" />
            </Field>
            <Field label="Source URL">
              <input className={inputCls} value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="SAM.gov link or agency portal URL" />
            </Field>
            <Field label="Stage">
              <select className={inputCls} value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes">
                <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Initial notes, source, detection context…" />
              </Field>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn btn-primary text-sm">Add Record</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Records table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <Radar size={36} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No capture records. Add one above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Stage</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Title</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Agency</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Due</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Bid</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Pwin</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isSelected = r.id === selectedId;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                    className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <td className="px-3 py-2">
                      <select
                        value={r.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); onUpdateStage(r.id, e.target.value); }}
                        className="text-xs rounded border border-gray-200 dark:border-gray-600 bg-transparent dark:text-gray-300 py-0.5 px-1"
                      >
                        {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200 max-w-xs">
                      <span className="line-clamp-1">{r.title || r.opportunityId || 'Untitled'}</span>
                      {r.solicitationNumber && <span className="block text-xs text-gray-400 dark:text-gray-500">{r.solicitationNumber}</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{r.agency || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.dueDate || '—'}</td>
                    <td className="px-3 py-2"><RecPill rec={r.bidNoBid?.recommendation} /></td>
                    <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{r.bidNoBid?.pwin != null ? `${r.bidNoBid.pwin}%` : '—'}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onDelete(r.id)} className="text-red-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedId && (
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <ChevronRight size={12} /> Record selected — view Scorecard, Dossier, and Compliance tabs for details.
        </p>
      )}
    </div>
  );
}

// ── Scorecard Tab ─────────────────────────────────────────────────────────────
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
    <div className="max-w-2xl">
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
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 w-6 text-right">{scores[dim.key] || 3}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{dim.help}</p>
              <input
                type="range" min="1" max="5" step="1"
                value={scores[dim.key] || 3}
                onChange={(e) => setDim(dim.key, e.target.value)}
                className="w-full accent-blue-600"
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
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{scores.pwin != null ? scores.pwin : autoPwin}%</div>
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

// ── Dossier Tab ───────────────────────────────────────────────────────────────
function DossierTab({ record, onUpdate }) {
  const [localRec, setLocalRec] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (record) { setLocalRec({ ...record }); setDirty(false); }
  }, [record?.id]);

  if (!record || !localRec) return <NoSelection />;

  function set(path, value) {
    setLocalRec((prev) => ({ ...prev, [path]: value }));
    setDirty(true);
  }

  function save() {
    onUpdate(record.id, localRec);
    setDirty(false);
  }

  // Stakeholders
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

  // Array field helper (winThemes, ghostingTargets, teamingGaps)
  function addToList(key) {
    set(key, [...(localRec[key] || []), '']);
  }
  function updateListItem(key, i, val) {
    const arr = [...(localRec[key] || [])];
    arr[i] = val;
    set(key, arr);
  }
  function removeListItem(key, i) {
    set(key, (localRec[key] || []).filter((_, idx) => idx !== i));
  }

  return (
    <div className="max-w-3xl space-y-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">{localRec.title || localRec.opportunityId}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{localRec.agency}</p>
        </div>
        <button onClick={save} disabled={!dirty} className="btn btn-primary text-sm flex items-center gap-1 disabled:opacity-50">
          <Save size={13} /> {dirty ? 'Save Dossier' : 'Saved'}
        </button>
      </div>

      {/* Incumbent */}
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

      {/* Stakeholders */}
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

      {/* Win Themes */}
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

      {/* Ghosting Targets */}
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

      {/* Teaming Gaps */}
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

      {/* OCI / Pricing */}
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

// ── Compliance Tab ────────────────────────────────────────────────────────────
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

  // Compliance matrix
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
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">{localRec.title || localRec.opportunityId}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{localRec.agency}</p>
        </div>
        <button onClick={save} disabled={!dirty} className="btn btn-primary text-sm flex items-center gap-1 disabled:opacity-50">
          <Save size={13} /> {dirty ? 'Save Compliance' : 'Saved'}
        </button>
      </div>

      {/* Section L/M */}
      <Section title="Section L / M Extraction Notes" icon={FileText}>
        <Field label="Key Evaluation Factors & Subfactors">
          <textarea className={inputCls} rows={4} value={localRec.sectionLMNotes || ''} onChange={(e) => set('sectionLMNotes', e.target.value)} placeholder="Paste or summarize Section L instructions and Section M evaluation criteria…" />
        </Field>
        <Field label="Submission Risk Notes">
          <textarea className={inputCls} rows={3} value={localRec.submissionRiskNotes || ''} onChange={(e) => set('submissionRiskNotes', e.target.value)} placeholder="Page limits, file format requirements, portal-specific risks, late-submission history…" />
        </Field>
      </Section>

      {/* Compliance Matrix */}
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

      {/* Portal Readiness */}
      <Section title="Portal Readiness" icon={Shield}>
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(portalScore / 3) * 100}%` }} />
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
                {portal[key] ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} className="text-gray-300 dark:text-gray-600" />}
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

// ── Knowledge Tab ─────────────────────────────────────────────────────────────
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
      {/* Type filter */}
      <div className="flex items-center gap-2">
        {KI_TYPES.map((t) => (
          <button key={t} onClick={() => setKiType(t)} className={`${smBtnCls} ${kiType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {KI_TYPE_LABELS[t]} ({items.filter((k) => k.type === t).length})
          </button>
        ))}
        <button onClick={() => setShowForm(!showForm)} className="ml-auto btn btn-primary flex items-center gap-1 text-sm">
          <Plus size={15} /> Add {KI_TYPE_LABELS[kiType]}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
          <h3 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-200">New {KI_TYPE_LABELS[kiType]} Record</h3>
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

      {/* Items table */}
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

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'pipeline',   label: 'Pipeline',   icon: Radar },
  { id: 'scorecard',  label: 'Scorecard',  icon: TrendingUp },
  { id: 'dossier',    label: 'Dossier',    icon: Users },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'knowledge',  label: 'Knowledge',  icon: BookOpen },
];

export default function CaptureBoardTabs() {
  const [tab, setTab] = useState('pipeline');
  const [records, setRecords] = useState(() => loadLS(CR_KEY, []));
  const [knowledgeItems, setKnowledgeItems] = useState(() => loadLS(KI_KEY, []));
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => records.find((r) => r.id === selectedId) || null, [records, selectedId]);

  // Try to sync from server on mount
  useEffect(() => {
    getCaptureRecords().then((serverRecords) => {
      if (serverRecords.length > 0) {
        setRecords(serverRecords);
        saveLS(CR_KEY, serverRecords);
      }
    });
    getKnowledgeItems().then((serverItems) => {
      if (serverItems.length > 0) {
        setKnowledgeItems(serverItems);
        saveLS(KI_KEY, serverItems);
      }
    });
  }, []);

  // Capture record CRUD (localStorage-primary, server best-effort)
  const addRecord = useCallback((data) => {
    const now = new Date().toISOString();
    const base = createCaptureRecord(data.solicitationNumber || `opp-${Date.now()}`);
    const rec = { ...base, ...data, id: base.id, createdAt: now, updatedAt: now };
    setRecords((prev) => {
      const next = [rec, ...prev];
      saveLS(CR_KEY, next);
      createCaptureRecordApi(rec).catch(() => {});
      return next;
    });
    setSelectedId(rec.id);
  }, []);

  const updateRecord = useCallback((id, patch) => {
    setRecords((prev) => {
      const next = prev.map((r) => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r);
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

  const updateStage = useCallback((id, stage) => {
    updateRecord(id, { stage });
  }, [updateRecord]);

  // Knowledge item CRUD
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

  // Summary stats
  const stats = useMemo(() => ({
    total: records.length,
    bid: records.filter((r) => r.bidNoBid?.recommendation === 'bid').length,
    noBid: records.filter((r) => r.bidNoBid?.recommendation === 'no_bid').length,
    active: records.filter((r) => r.stage === 'capture_active').length,
  }), [records]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Capture Board</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pre-solicitation intelligence, bid/no-bid, dossiers, compliance, and knowledge library.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Tracked', value: stats.total, color: 'text-gray-800 dark:text-gray-200' },
          { label: 'Bid Decisions', value: stats.bid, color: 'text-green-600 dark:text-green-400' },
          { label: 'No Bid', value: stats.noBid, color: 'text-red-500 dark:text-red-400' },
          { label: 'Capture Active', value: stats.active, color: 'text-blue-600 dark:text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={15} />
              {label}
              {id === 'scorecard' || id === 'dossier' || id === 'compliance' ? (
                selected
                  ? <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 rounded-full">{selected.title?.slice(0, 12) || 'Selected'}</span>
                  : <span className="ml-1 text-xs text-gray-400 dark:text-gray-600">— none</span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'pipeline' && (
        <PipelineTab
          records={records}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onAdd={addRecord}
          onDelete={deleteRecord}
          onUpdateStage={updateStage}
        />
      )}
      {tab === 'scorecard' && (
        <ScorecardTab record={selected} onUpdate={updateRecord} />
      )}
      {tab === 'dossier' && (
        <DossierTab record={selected} onUpdate={updateRecord} />
      )}
      {tab === 'compliance' && (
        <ComplianceTab record={selected} onUpdate={updateRecord} />
      )}
      {tab === 'knowledge' && (
        <KnowledgeTab items={knowledgeItems} onAdd={addKnowledgeItem} onDelete={deleteKnowledgeItem} />
      )}
    </div>
  );
}
