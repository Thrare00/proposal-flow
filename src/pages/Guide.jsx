import { useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const GUIDE_STORAGE_KEY = 'proposalGuideExpandedSections';

const GUIDE_SECTIONS = [
  {
    id: 'pre-solicitation',
    title: 'Pre-Solicitation Foundation',
    summary: 'Keep the minimal capture groundwork in place before a live solicitation arrives.',
    accent: 'border-sky-500',
    checklist: [
      'Track target agencies, contract vehicles, incumbent context, and partner posture in one place.',
      'Record a simple bid/no-bid signal with owner, rationale, and the date it was last reviewed.',
      'Capture reusable artifacts early: past performance references, key differentiators, resumes, and compliance notes.',
      'Treat pre-solicitation notes as optional support data so intake can start cleanly when the opportunity becomes active.',
    ],
  },
  {
    id: 'opportunity-identification',
    title: 'Opportunity Identification',
    summary: 'Confirm that the opportunity is real, aligned, and worth pushing into intake.',
    accent: 'border-blue-500',
    checklist: [
      'Validate the customer, acquisition path, and expected due date before the team starts drafting.',
      'Check fit against capabilities, contract access, likely teaming needs, and rough revenue value.',
      'Capture the source material that justified pursuit so downstream reviewers are not reconstructing context later.',
    ],
  },
  {
    id: 'capture-planning',
    title: 'Capture Planning',
    summary: 'Translate the opportunity into a practical pursuit posture before outline and writing work begins.',
    accent: 'border-emerald-500',
    checklist: [
      'Define likely win themes, discriminators, risks, and competitor assumptions.',
      'Identify required contributors, external partners, and any long-lead compliance inputs.',
      'Decide what must be ready by intake versus what can wait until outline or drafting.',
    ],
  },
  {
    id: 'proposal-development',
    title: 'Proposal Development',
    summary: 'Move from outline to draft with direct traceability to the solicitation and evaluation criteria.',
    accent: 'border-violet-500',
    checklist: [
      'Mirror solicitation structure and scoring language in the working outline.',
      'Maintain a compliance matrix as sections evolve instead of treating it as an end-of-cycle artifact.',
      'Use review passes to improve clarity, responsiveness, and evidence rather than rewriting blindly.',
      'Keep the draft overview, workflow steps, and section tasks synchronized so the board reflects actual progress.',
    ],
  },
  {
    id: 'submission-readiness',
    title: 'Submission Readiness',
    summary: 'Close the loop on compliance, packaging, and final risk before submission.',
    accent: 'border-amber-500',
    checklist: [
      'Run a final requirement-by-requirement verification against the solicitation package.',
      'Confirm file names, forms, signatures, page limits, and upload instructions.',
      'Document remaining risks and final owner signoff instead of relying on tribal knowledge.',
    ],
  },
];

function loadExpandedSections() {
  try {
    const saved = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function Guide() {
  const [expandedSections, setExpandedSections] = useState(() => loadExpandedSections());

  useEffect(() => {
    localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(expandedSections));
  }, [expandedSections]);

  const allExpanded = useMemo(
    () => GUIDE_SECTIONS.every((section) => expandedSections[section.id]),
    [expandedSections]
  );

  const toggleSection = (sectionId) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const toggleAllSections = () => {
    const nextValue = !allExpanded;
    setExpandedSections(
      GUIDE_SECTIONS.reduce((nextState, section) => {
        nextState[section.id] = nextValue;
        return nextState;
      }, {})
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proposal Guide</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
              Phase 1 guide content is organized around the handoff from pre-solicitation context to active proposal execution.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAllSections}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {allExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
          The pre-solicitation section is intentionally minimal: it establishes capture-ready fields and artifacts without forcing the rest of the system into a full capture-management buildout yet.
        </div>

        <div className="space-y-4">
          {GUIDE_SECTIONS.map((section) => {
            const isExpanded = !!expandedSections[section.id];

            return (
              <section
                key={section.id}
                className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800 ${section.accent} border-l-4`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isExpanded}
                  aria-controls={`guide-section-${section.id}`}
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{section.summary}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="mt-1 h-5 w-5 shrink-0 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="mt-1 h-5 w-5 shrink-0 text-gray-500" />
                  )}
                </button>

                {isExpanded && (
                  <div id={`guide-section-${section.id}`} className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                    <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-200">
                      {section.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
