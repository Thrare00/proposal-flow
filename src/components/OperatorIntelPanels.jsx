import { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Crown,
  FileCheck,
  Layers,
  Shield,
  Swords,
  Target,
  XCircle,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, color, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className={`flex items-center gap-2 border-b border-gray-200 px-5 py-3 ${color}`}>
        {Icon && <Icon className="h-5 w-5" />}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, value, tone }) {
  const tones = {
    good: 'text-emerald-700',
    warn: 'text-amber-700',
    danger: 'text-red-700',
    muted: 'text-gray-400 italic',
  };
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium text-right ${tones[tone] || 'text-gray-900'}`}>
        {value ?? <span className="text-gray-400 italic">--</span>}
      </span>
    </div>
  );
}

function ScoreBar({ label, value, max = 5 }) {
  if (value == null) return null;
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="py-1">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TagList({ items, empty, color = 'bg-gray-100 text-gray-700' }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400 italic">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Indicator({ ok, label }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {ok
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        : <XCircle className="h-4 w-4 text-gray-300 shrink-0" />}
      <span className={`text-sm ${ok ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

// ── 1. Mission-Critical Items ────────────────────────────────────────────────

function MissionCriticalPanel({ proposal }) {
  const capture = proposal.capture || {};
  const bnb = capture.bidNoBid || proposal.bidNoBid || {};
  const timing = proposal.metadata?.captureTiming || {};
  const scoring = proposal.scoring || {};
  const compliance = proposal.complianceStatus || {};
  const redFlags = (proposal.redTeamFindings || []).filter((f) => f.status !== 'resolved');

  const criticalItems = useMemo(() => {
    const items = [];

    // Overdue or very close due date
    if (proposal.dueDate) {
      const days = Math.ceil((new Date(proposal.dueDate) - new Date()) / 86400000);
      if (days < 0) items.push({ severity: 'critical', text: `${Math.abs(days)} days overdue` });
      else if (days <= 3) items.push({ severity: 'critical', text: `Only ${days} day(s) until due` });
      else if (days <= 7) items.push({ severity: 'high', text: `${days} days until due` });
    }

    // Low Pwin
    if (bnb.pwin != null && bnb.pwin < 30) {
      items.push({ severity: 'critical', text: `Pwin is ${bnb.pwin}% — below 30% threshold` });
    }

    // Unresolved red-team findings
    if (redFlags.length > 0) {
      items.push({ severity: 'high', text: `${redFlags.length} unresolved red-team finding(s)` });
    }

    // Missing compliance evidence
    if ((compliance.missingEvidenceCount || 0) > 0) {
      items.push({ severity: 'high', text: `${compliance.missingEvidenceCount} missing compliance evidence item(s)` });
    }

    // Open gaps
    if ((scoring.unresolved_gap_count || 0) > 0) {
      items.push({ severity: 'high', text: `${scoring.unresolved_gap_count} unresolved gap(s)` });
    }

    // Teaming not confirmed but outreach window open
    if (timing.primeOutreachStartDate && !timing.teamingConfirmed) {
      const start = new Date(timing.primeOutreachStartDate);
      if (start <= new Date()) {
        items.push({ severity: 'warn', text: 'Teaming outreach window is open but not confirmed' });
      }
    }

    // Low draft readiness when close to due date
    if (proposal.dueDate) {
      const days = Math.ceil((new Date(proposal.dueDate) - new Date()) / 86400000);
      if (days <= 14 && (scoring.draft_readiness_percent || 0) < 50) {
        items.push({ severity: 'high', text: `Draft readiness only ${scoring.draft_readiness_percent || 0}% with ${days}d left` });
      }
    }

    // No bid recommendation flagged
    if (bnb.recommendation === 'no_bid') {
      items.push({ severity: 'critical', text: 'Bid/no-bid recommendation is NO BID' });
    }

    return items;
  }, [proposal, bnb, timing, scoring, compliance, redFlags]);

  const severityIcon = (s) => {
    if (s === 'critical') return <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />;
    if (s === 'high') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <Circle className="h-3 w-3 text-yellow-400 shrink-0 mt-0.5" />;
  };

  const severityBg = (s) => {
    if (s === 'critical') return 'bg-red-50 border-red-200';
    if (s === 'high') return 'bg-amber-50 border-amber-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <Section title="Mission-Critical Items" icon={Target} color="text-red-800 bg-red-50">
      {criticalItems.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          No critical items detected. Proposal appears healthy.
        </div>
      ) : (
        <div className="space-y-2">
          {criticalItems.map((item, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-lg border p-3 ${severityBg(item.severity)}`}>
              {severityIcon(item.severity)}
              <span className="text-sm font-medium text-gray-900">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── 2. Competitive Exclusion ─────────────────────────────────────────────────

function CompetitiveExclusionPanel({ proposal }) {
  const capture = proposal.capture || {};
  const bnb = capture.bidNoBid || proposal.bidNoBid || {};

  return (
    <Section title="Competitive Exclusion" icon={Swords} color="text-indigo-800 bg-indigo-50">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Incumbent</p>
          <Row label="Incumbent" value={capture.incumbentName || proposal.incumbentName} tone={capture.incumbentName ? undefined : 'muted'} />
          <Row label="Contract #" value={capture.incumbentContractNumber || proposal.incumbentContractNumber} tone={capture.incumbentContractNumber ? undefined : 'muted'} />
          <ScoreBar label="Incumbent Strength" value={bnb.incumbentStrength} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Ghosting Targets</p>
          <p className="text-xs text-gray-500 mb-1.5">Incumbent weaknesses to contrast against in proposal</p>
          <TagList
            items={capture.ghostingTargets || proposal.ghostingTargets}
            empty="No ghosting targets identified yet"
            color="bg-rose-100 text-rose-800"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Win Themes</p>
          <TagList
            items={capture.winThemes || proposal.winThemes}
            empty="No win themes defined yet"
            color="bg-emerald-100 text-emerald-800"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Bid/No-Bid Scores</p>
          <div className="space-y-1">
            <ScoreBar label="Competitive Fit" value={bnb.competitiveFit} />
            <ScoreBar label="Past Performance Fit" value={bnb.pastPerformanceFit} />
            <ScoreBar label="Teaming Readiness" value={bnb.teamingReadiness} />
            <ScoreBar label="Pricing Confidence" value={bnb.pricingConfidence} />
            <ScoreBar label="Strategic Value" value={bnb.strategicValue} />
          </div>
          {bnb.total != null && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm font-semibold text-gray-700">Total Score</span>
              <span className="text-lg font-bold text-gray-900">{bnb.total}/30</span>
            </div>
          )}
          {bnb.recommendation && (
            <Row
              label="Recommendation"
              value={bnb.recommendation.replace(/_/g, ' ').toUpperCase()}
              tone={bnb.recommendation === 'bid' ? 'good' : bnb.recommendation === 'no_bid' ? 'danger' : 'warn'}
            />
          )}
          {bnb.pwin != null && (
            <Row
              label="Pwin Estimate"
              value={`${bnb.pwin}%`}
              tone={bnb.pwin >= 50 ? 'good' : bnb.pwin >= 30 ? 'warn' : 'danger'}
            />
          )}
        </div>
      </div>
    </Section>
  );
}

// ── 3. Compliance Evidence (Paper Trail) ─────────────────────────────────────

function ComplianceEvidencePanel({ proposal }) {
  const capture = proposal.capture || {};
  const portal = capture.portalReadiness || proposal.portalReadiness || {};
  const compliance = proposal.complianceStatus || {};
  const files = proposal.files || [];
  const pg = proposal.pricingGovernance || {};
  const constraints = pg.constraints || [];
  const assumptions = pg.assumptions || [];
  const validatedAssumptions = assumptions.filter((a) => a.validated).length;

  return (
    <Section title="Compliance Evidence & Paper Trail" icon={FileCheck} color="text-emerald-800 bg-emerald-50">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Portal & Registration</p>
          <Indicator ok={portal.samActive} label="SAM.gov registration active" />
          <Indicator ok={portal.portalIdentified} label="Submission portal identified" />
          <Indicator ok={portal.credentialsConfirmed} label="Portal credentials confirmed" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Compliance Posture</p>
          <Row
            label="Compliance completeness"
            value={compliance.completenessPercent != null ? `${compliance.completenessPercent}%` : null}
            tone={compliance.completenessPercent >= 80 ? 'good' : compliance.completenessPercent >= 50 ? 'warn' : 'danger'}
          />
          <Row
            label="Missing evidence items"
            value={compliance.missingEvidenceCount ?? 0}
            tone={(compliance.missingEvidenceCount || 0) === 0 ? 'good' : 'danger'}
          />
          <Row label="Documents attached" value={files.length} tone={files.length > 0 ? 'good' : 'muted'} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Pricing Governance</p>
          <Row
            label="Review status"
            value={pg.reviewStatus ? pg.reviewStatus.replace(/_/g, ' ') : null}
            tone={pg.reviewStatus === 'approved' ? 'good' : pg.reviewStatus === 'flagged' ? 'danger' : undefined}
          />
          <Row label="Constraints defined" value={constraints.length} tone={constraints.length > 0 ? 'good' : 'muted'} />
          <Row
            label="Violated constraints"
            value={constraints.filter((c) => c.status === 'violated').length}
            tone={constraints.filter((c) => c.status === 'violated').length === 0 ? 'good' : 'danger'}
          />
          <Row
            label="Assumptions validated"
            value={assumptions.length > 0 ? `${validatedAssumptions}/${assumptions.length}` : null}
            tone={assumptions.length > 0 && validatedAssumptions === assumptions.length ? 'good' : validatedAssumptions > 0 ? 'warn' : 'muted'}
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Set-Aside & NAICS</p>
          <Row label="Set-aside" value={capture.setAside || proposal.setAside} tone={capture.setAside ? undefined : 'muted'} />
          <div className="mt-1">
            <TagList
              items={capture.naicsCodes || proposal.naicsCodes}
              empty="No NAICS codes"
              color="bg-blue-100 text-blue-800"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ── 4. Structural Advantage / Risk ───────────────────────────────────────────

function StructuralAdvantagePanel({ proposal }) {
  const capture = proposal.capture || {};
  const timing = proposal.metadata?.captureTiming || {};
  const preSol = proposal.metadata?.preSolicitation || {};
  const teamingGaps = capture.teamingGaps || proposal.teamingGaps || [];
  const stakeholders = capture.stakeholders || [];

  const postureLabel = (p) => {
    const labels = {
      prime: 'Prime contractor',
      subcontract: 'Subcontractor',
      watch: 'Watch only',
      pre_position: 'Pre-positioning',
      no_bid: 'No bid',
      either: 'Prime or sub',
    };
    return labels[p] || p || null;
  };

  return (
    <Section title="Structural Advantage & Risk" icon={Layers} color="text-violet-800 bg-violet-50">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Pursuit Posture</p>
          <Row label="Posture" value={postureLabel(timing.pursuitPosture)} tone={timing.pursuitPosture === 'no_bid' ? 'danger' : undefined} />
          <Row label="Pursuit bucket" value={timing.pursuitBucket} />
          <Row label="Timing bucket" value={timing.timingBucket} />
          <Row
            label="Teaming confirmed"
            value={timing.teamingConfirmed ? 'Yes' : 'No'}
            tone={timing.teamingConfirmed ? 'good' : 'warn'}
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Teaming Gaps</p>
          <p className="text-xs text-gray-500 mb-1.5">Capability gaps requiring partners</p>
          <TagList
            items={teamingGaps}
            empty="No teaming gaps identified"
            color="bg-orange-100 text-orange-800"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Strategic Posture</p>
          <Row label="Subcontracting posture" value={preSol.subcontractingPosture} />
          <Row label="Teaming posture" value={preSol.teamingPosture} />
          <Row label="Pricing posture" value={preSol.pricingPosture} />
        </div>

        {(preSol.riskNotes || []).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Risk Notes</p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-0.5">
              {preSol.riskNotes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </div>
        )}

        {(preSol.positioningNotes || []).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Positioning Notes</p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-0.5">
              {preSol.positioningNotes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </div>
        )}

        {stakeholders.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Key Stakeholders</p>
            <div className="space-y-1.5">
              {stakeholders.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Crown className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                  <span className="font-medium text-gray-900">{s.role}</span>
                  {s.name && <span className="text-gray-600">- {s.name}</span>}
                  {s.agency && <span className="text-gray-400">({s.agency})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function OperatorIntelPanels({ proposal }) {
  if (!proposal) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <MissionCriticalPanel proposal={proposal} />
      <CompetitiveExclusionPanel proposal={proposal} />
      <ComplianceEvidencePanel proposal={proposal} />
      <StructuralAdvantagePanel proposal={proposal} />
    </div>
  );
}
