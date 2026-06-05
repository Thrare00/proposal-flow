import { useState } from 'react';
import {
  Radar,
  Target,
  FileSearch,
  Shield,
  Users,
  CheckSquare,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Globe,
  ClipboardCheck,
  Send,
  MessageSquare,
} from 'lucide-react';

// ─── Phase data ──────────────────────────────────────────────────────────────
const PHASES = [
  {
    id: 'pre-sol',
    label: 'Pre-Solicitation',
    color: 'blue',
    description: 'Intelligence-first capture work before the RFP drops. Win here or not at all.',
    sections: [
      {
        id: 'opp-intel',
        title: 'Opportunity Intelligence',
        icon: Radar,
        items: [
          'Monitor SAM.gov saved searches (NAICS / PSC / agency / set-aside filters)',
          'Review agency procurement forecasts, acquisition portals, and OSDBU pipelines',
          'Track RFIs, Sources Sought, pre-solicitation notices, amendments, and Q&A windows',
          'Match opportunities to your NAICS codes, PSC codes, certifications, and service lanes',
          'Set deadline and portal alerts early — never first-touch in deadline week',
          'Log the opportunity in Proposal Flow immediately on detection',
        ],
        sources: ['SAM.gov', 'FPDS', 'USASpending.gov', 'Agency portals', 'SBA DSBS'],
      },
      {
        id: 'comp-intel',
        title: 'Competitive & Incumbent Intelligence',
        icon: Target,
        items: [
          'Look up incumbent via FPDS / USASpending by agency + NAICS + location',
          'Map likely competitors: contract history, vehicle usage, award sizes',
          'Review public award notices, spending patterns, and task order activity',
          'Search GAO protest decisions for this agency, vehicle, or requirement type',
          'Build buyer pattern notes: CO preferences, evaluation history, agency culture',
          'Review congressional budget justifications and IG / audit reports for context',
        ],
        sources: ['FPDS', 'USASpending.gov', 'GAO.gov decisions', 'COFC decisions', 'Public award notices'],
      },
      {
        id: 'qualification',
        title: 'Bid / No-Bid Qualification',
        icon: TrendingUp,
        items: [
          'Score the opportunity: incumbent strength, competitive set, fit to capabilities, risk',
          'Estimate Pwin — be honest, not optimistic; document your reasoning',
          'Identify teaming gaps: technical, past performance, key personnel, certifications',
          'Check OCI / affiliation / limitations-on-subcontracting risks before committing',
          'Make a documented bid / no-bid decision and commit to it',
        ],
        note: 'Pwin below 20% with a strong incumbent and no differentiator = no-bid unless strategic.',
      },
      {
        id: 'capture-plan',
        title: 'Capture Plan',
        icon: Briefcase,
        items: [
          'Build stakeholder map: CO, COR, PM, program office, small business office, incumbent',
          'Develop win themes and discriminators against expected competitors',
          'Identify ghosting targets: incumbent weaknesses to contrast implicitly',
          'Track customer pain hypotheses — gather evidence, not assumptions',
          'Identify teaming / mentor-protégé / JV / subcontract paths and initiate early',
          'Set price-to-win framing based on incumbent ceiling and market data',
        ],
      },
    ],
  },
  {
    id: 'solicitation',
    label: 'Solicitation Analysis',
    color: 'purple',
    description: 'Dissect the RFP before writing a single word. The RFP is the answer key.',
    sections: [
      {
        id: 'section-lm',
        title: 'Section L / M Extraction',
        icon: FileSearch,
        items: [
          'Read Section L (instructions) and Section M (evaluation criteria) fully before anything else',
          'Extract every shall, must, and will — these are compliance requirements, not suggestions',
          'Note volume limits: page counts, font size, margins, file type, naming conventions',
          'Identify evaluation factors and subfactors — these drive section priority and page budget',
          'Flag ambiguities — prepare clarifying questions for the Q&A window',
          'Map RFP section structure to compliance matrix columns immediately',
        ],
      },
      {
        id: 'compliance-matrix',
        title: 'Compliance Matrix',
        icon: CheckSquare,
        items: [
          'Map each Section L requirement to a proposal section and owner',
          'Map each Section M evaluation factor to win themes and supporting evidence',
          'Track columns: Requirement | RFP Reference | Proposal Section | Status | Owner',
          'Use the matrix as a daily checkpoint throughout development — never defer',
          'Red = missing / not addressed, Yellow = draft, Green = complete and reviewed',
        ],
      },
      {
        id: 'portal-readiness',
        title: 'Portal & Submission Readiness',
        icon: Globe,
        items: [
          'Identify submission portal before week 1 (SAM.gov, Grants.gov, agency-specific)',
          'Verify SAM.gov registration is active and not expiring near the due date',
          'Confirm required reps/certs, certifications, and entity registration are current',
          'Identify required forms: SF-33, SF-1449, SF-330, representations, attachments',
          'Test portal upload at least 48 hours before deadline — never same-day',
          'Confirm portal login credentials are known to more than one person',
        ],
        note: 'Portal credential problems have killed otherwise strong proposals. Own this in week 1.',
      },
    ],
  },
  {
    id: 'development',
    label: 'Proposal Development',
    color: 'green',
    description: 'Write to the evaluation criteria, not to your capabilities.',
    sections: [
      {
        id: 'outline',
        title: 'Annotated Outline',
        icon: ClipboardCheck,
        items: [
          'Build outline that mirrors the evaluation factor structure exactly',
          'Annotate each section: what it must say, win themes to reinforce, page budget',
          'Assign section owners and due dates before writing starts',
          'Include storyboard or mockup placeholder for every graphics-heavy section',
          'Lock the outline before writing — mid-draft restructuring costs double',
        ],
      },
      {
        id: 'technical',
        title: 'Technical Volume',
        icon: BookOpen,
        items: [
          'Open every major section by addressing the evaluation criterion by name',
          'Lead with win themes — the evaluator should see your discriminators in the first paragraph',
          'Use Section M language verbatim or near-verbatim in headings and topic sentences',
          'Every technical claim needs a proof point: metric, contract number, or past performance ref',
          'Avoid features — write benefits framed in terms of agency mission and program outcomes',
          'Use active voice and present tense throughout',
        ],
      },
      {
        id: 'past-perf',
        title: 'Past Performance & Key Personnel',
        icon: Award,
        items: [
          'Select past performance that maps to evaluation criteria — relevance over recency',
          'For each reference: contract #, agency, scope, dollar value, period, point of contact',
          'Pre-call references before submission — confirm they will respond positively',
          'Key personnel resumes must address required qualifications point-by-point',
          'Get commitment letters early — do not assume availability',
        ],
      },
      {
        id: 'price',
        title: 'Price / Cost Volume',
        icon: TrendingUp,
        items: [
          'Align price architecture to the CLIN structure in Section B exactly',
          'Support every cost element with a defensible basis of estimate (BOE)',
          'Model price-to-win range before finalizing — do not price in a vacuum',
          'Check for unbalanced pricing across CLINs if cost-plus or T&M',
          'Identify cost realism exposure: if LPTA, understand the allowable cost floor',
        ],
      },
    ],
  },
  {
    id: 'review',
    label: 'Review & Submit',
    color: 'amber',
    description: 'Structured reviews catch what individual writers miss every time.',
    sections: [
      {
        id: 'color-teams',
        title: 'Color Team Reviews',
        icon: Users,
        items: [
          'Pink Team (outline review): structure, coverage, win theme placement — run before drafting',
          'Red Team (mock evaluation): simulate evaluator scoring against Section M — run mid-draft',
          'Gold Team (final review): quality and compliance check — run 72+ hours before submission',
          'Assign reviewers who were not section authors — fresh eyes catch gaps',
          'Document every Red Team finding and track every item to closure',
        ],
      },
      {
        id: 'compliance-final',
        title: 'Final Compliance Check',
        icon: Shield,
        items: [
          'Walk the compliance matrix top to bottom — every row must be Green before submission',
          'Verify page counts, font size, and margins against Section L limits on final PDF',
          'Check all cross-references, figure numbers, and table of contents entries',
          'Confirm all required forms and attachments are included and complete',
          'Verify file naming convention matches solicitation requirements exactly',
        ],
        note: 'A technically outstanding proposal can be rejected for a font violation. Compliance is not optional.',
      },
      {
        id: 'submission',
        title: 'Submission',
        icon: Send,
        items: [
          'Upload to portal at least 24 hours before deadline',
          'Retain confirmation number, timestamp, and submission receipt',
          'Verify all uploaded files are readable and complete after upload',
          'Notify key stakeholders of confirmed submission immediately',
          'Archive complete submission package with version control',
        ],
      },
    ],
  },
  {
    id: 'post-award',
    label: 'Post-Award',
    color: 'rose',
    description: 'Win or lose — close the loop and build the knowledge base.',
    sections: [
      {
        id: 'debrief',
        title: 'Debrief & Lessons Learned',
        icon: MessageSquare,
        items: [
          'Request a debrief within the FAR window (typically 3 business days after award notice)',
          'Prepare specific questions: evaluation scores, strengths, weaknesses, discriminators',
          'Document debrief notes immediately — full capture, not a summary',
          'Classify loss reasons: competitive position, price, compliance, past performance, capture timing',
          'Update win/loss tracker and convert lessons into prevent-repeat rules',
        ],
      },
      {
        id: 'protest',
        title: 'Protest Assessment',
        icon: AlertTriangle,
        items: [
          'Assess protest viability within 10 days of award (GAO) or 12 days (COFC) if applicable',
          'Review: evaluation rationality, disparate treatment, documentation inconsistencies',
          'Consult counsel before filing — frivolous protests damage agency relationships',
          'Track all protest decisions for this agency as competitive intelligence',
        ],
        note: 'Protest is a strategic decision, not a reflexive one. Use debrief findings to assess merit first.',
      },
      {
        id: 'knowledge-base',
        title: 'Knowledge Base Update',
        icon: BookOpen,
        items: [
          'Archive final proposal with full version history',
          'Extract reusable past performance writeups, boilerplate, and graphics',
          'Update resume library with any key personnel used',
          'Log agency / buyer patterns: preferences, evaluation tendencies, culture notes',
          'Update capture templates with any new discriminators or win themes proven effective',
        ],
      },
    ],
  },
];

// ─── Color map (all class names are static strings for Tailwind JIT) ─────────
const COLOR_MAP = {
  blue: {
    activeTab: 'bg-blue-600 text-white',
    border: 'border-blue-500',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    iconWrap: 'text-blue-500',
    bullet: 'bg-blue-500',
    note: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  },
  purple: {
    activeTab: 'bg-purple-600 text-white',
    border: 'border-purple-500',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    iconWrap: 'text-purple-500',
    bullet: 'bg-purple-500',
    note: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
  },
  green: {
    activeTab: 'bg-green-600 text-white',
    border: 'border-green-500',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    iconWrap: 'text-green-500',
    bullet: 'bg-green-500',
    note: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  },
  amber: {
    activeTab: 'bg-amber-600 text-white',
    border: 'border-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
    iconWrap: 'text-amber-500',
    bullet: 'bg-amber-500',
    note: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200',
  },
  rose: {
    activeTab: 'bg-rose-600 text-white',
    border: 'border-rose-500',
    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200',
    iconWrap: 'text-rose-500',
    bullet: 'bg-rose-500',
    note: 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
const FederalProposalGuide = () => {
  const [activePhase, setActivePhase] = useState('pre-sol');
  // default: all sections open; toggle to close
  const [collapsed, setCollapsed] = useState({});

  const phase = PHASES.find((p) => p.id === activePhase);
  const c = COLOR_MAP[phase.color];

  const toggle = (id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  const isOpen = (id) => !collapsed[id];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Federal Proposal Development Guide
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Intelligence-first capture through post-award — full federal proposal lifecycle reference.
        </p>
      </div>

      {/* Phase tab bar */}
      <div className="flex flex-wrap gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {PHASES.map((p) => {
          const isActive = p.id === activePhase;
          return (
            <button
              key={p.id}
              onClick={() => {
                setActivePhase(p.id);
                setCollapsed({});
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? COLOR_MAP[p.color].activeTab
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Phase description */}
      <div className={`mb-5 p-3 rounded-lg border-l-4 ${c.border} bg-gray-50 dark:bg-gray-800/50`}>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{phase.description}</p>
      </div>

      {/* Accordion sections */}
      <div className="space-y-3">
        {phase.sections.map((section) => {
          const Icon = section.icon;
          const open = isOpen(section.id);
          return (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => toggle(section.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={c.iconWrap}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {section.title}
                  </span>
                  {section.sources && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>
                      {section.sources.length} sources
                    </span>
                  )}
                </div>
                {open ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Section body */}
              {open && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.bullet}`} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {section.sources && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {section.sources.map((s) => (
                        <span key={s} className={`text-xs px-2 py-0.5 rounded ${c.badge}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {section.note && (
                    <div className={`p-2 rounded border-l-2 text-xs ${c.note}`}>
                      {section.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Operating principle */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono text-center tracking-wide">
          Intelligence first → capture second → compliance third → writing fourth
        </p>
      </div>
    </div>
  );
};

export default FederalProposalGuide;
