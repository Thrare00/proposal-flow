import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Persist state to localStorage
const usePersistedState = <T,>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [key, state]);

  return [state, setState];
};

type ExpandedState = {
  [key: string]: boolean | ExpandedState;
};

interface ContentItem {
  title: string;
  content: string | string[] | ContentItem[];
}

interface Phase {
  id: string;
  title: string;
  items: ContentItem[];
}

const Guide = () => {
  const [expandedState, setExpandedState] = usePersistedState<ExpandedState>('guideExpandedState', {});
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const contentRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Set loading to false after initial render
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const toggleSection = useCallback((path: string[], isExpanding?: boolean) => {
    setExpandedState((prev: ExpandedState) => {
      const newState = { ...prev } as ExpandedState;
      let current = newState;
      
      // Navigate to the parent level
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {} as ExpandedState;
        }
        current = current[path[i]] as ExpandedState;
      }
      
      // Toggle or set the target section
      const lastKey = path[path.length - 1];
      current[lastKey] = isExpanding !== undefined ? isExpanding : !current[lastKey];
      
      return newState;
    });
  }, [setExpandedState]);

  const toggleAllSections = useCallback(() => {
    const newState = !isAllExpanded;
    setIsAllExpanded(newState);
    
    // This will be implemented after phases is defined
    console.log('Toggle all sections:', newState);
  }, [isAllExpanded]);

  const isSectionExpanded = useCallback((path: string[]): boolean => {
    let current: ExpandedState | boolean | undefined = expandedState;
    
    for (const key of path) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return path.length === 0; // Only expand root by default
      }
      current = current[key] as ExpandedState | boolean | undefined;
    }
    
    // If we have a boolean value, return it
    if (typeof current === 'boolean') {
      return current;
    }
    
    // For non-root sections, default to collapsed
    return false;
  }, [expandedState]);

  const isSectionHeader = (text: string): boolean => {
    return text.trim().startsWith('## ');
  };

  const isSubsectionHeader = (text: string): boolean => {
    return text.trim().startsWith('### ');
  };

  const parseMarkdown = (text: string): string => {
    if (!text) return '';
    
    // Handle code blocks
    let result = text.replace(/```([\s\S]*?)```/g, (_match, code: string) => {
      return `<pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto"><code class="font-mono text-sm">${code}</code></pre>`;
    });
    
    // Handle inline code
    result = result.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Handle bold and italic
    result = result
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Handle line breaks
    result = result.replace(/\n/g, '<br />');
    
    return result;
  };

  const renderContent = (content: string | string[], path: string[] = [], level: number = 0) => {
    if (Array.isArray(content)) {
      return (
        <div className="space-y-2">
          {content.map((item, index) => {
            const itemPath = [...path, `item-${index}`];
            const itemKey = itemPath.join('_');
            
            return (
              <div 
                key={index} 
                className={`${level > 0 ? 'ml-4' : ''} transition-colors duration-200`}
                ref={el => {
                  if (el && typeof item === 'string' && (isSectionHeader(item) || isSubsectionHeader(item))) {
                    contentRefs.current[itemKey] = el;
                  }
                }}
              >
                {renderContent(item, itemPath, level + 1)}
              </div>
            );
          })}
        </div>
      );
    }

    // Check if this is a section header
    if (isSectionHeader(content) || isSubsectionHeader(content)) {
      const headerText = content.replace(/^#+\s*/, '').trim();
      const headerLevel = isSubsectionHeader(content) ? 3 : 2;
      const isExpanded = isSectionExpanded([...path]);
      const hasNestedContent = Array.isArray(content) && content.length > 0;
      
      return (
        <div 
          className={`${level > 0 ? 'border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} mb-2`}
        >
          <div 
            className={`flex items-center cursor-pointer p-1 rounded-md transition-colors ${
              isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            role="button"
            tabIndex={0}
            onClick={() => toggleSection(path)}
            onKeyDown={(e) => handleKeyDown(e, path)}
            aria-expanded={isExpanded}
            aria-controls={`content-${path.join('-')}`}
          >
            <span className={`flex-1 ${headerLevel === 2 ? 'font-semibold text-lg' : 'font-medium'}`}>
              {headerText}
            </span>
            {hasNestedContent && (
              <span className="text-gray-500">
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </span>
            )}
          </div>
          
          {hasNestedContent && (
            <div 
              id={`content-${path.join('-')}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
              aria-hidden={!isExpanded}
            >
              <div className="py-1">
                {typeof content === 'string' ? (
                  <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
                  />
                ) : (
                  renderContent(content, path, level + 1)
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Regular content
    return (
      <div 
        className="prose dark:prose-invert max-w-none mb-3"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      />
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, path: string[]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleSection(path);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      
      const allSections = Object.entries(contentRefs.current)
        .filter((entry): entry is [string, HTMLElement] => entry[1] !== null)
        .sort(([a], [b]) => {
          const aDepth = a.split('_').length;
          const bDepth = b.split('_').length;
          if (aDepth !== bDepth) return aDepth - bDepth;
          return a.localeCompare(b);
        });
      
      const currentIndex = allSections.findIndex(([key]) => key === path.join('_'));
      
      if (currentIndex !== -1) {
        const nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < allSections.length) {
          const nextElement = allSections[nextIndex][1];
          if (nextElement) {
            nextElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            nextElement.focus();
          }
        }
      }
    }
  };
  
  // scrollToSection function has been removed as it's not being used
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading guide...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Proposal Guide
            </h1>
            <button
              onClick={toggleAllSections}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
              aria-label={isAllExpanded ? 'Collapse all sections' : 'Expand all sections'}
            >
              {isAllExpanded ? (
                <>
                  <ChevronUpIcon className="h-4 w-4" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4" />
                  <span>Expand All</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading guide content...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Proposal Development Guide</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    This guide will walk you through the complete proposal development process, from initial opportunity identification to final submission.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">1. Opportunity Identification</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Research and identify potential opportunities that align with your organization's capabilities.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 py-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">2. Capture Planning</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Develop win strategies, identify key personnel, and prepare for the proposal process.
                    </p>
                  </div>


                  <div className="border-l-4 border-purple-500 pl-4 py-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">3. Proposal Development</h3>
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-4">
                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Step 1: Research Agency Goals</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Use ChatGPT to research the <span className="font-semibold">[Agency]</span>'s strategic goals</li>
                          <li>Extract key priorities (e.g., sustainability, cost efficiency, innovation)</li>
                          <li>Ensure the proposal directly addresses these priorities</li>
                          <li><span className="font-semibold">Documentation:</span> Save all research outputs to the shared repository with proper version control</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Step 2: Team Discussion on Value Alignment</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Collaborate with agents to answer key questions:</li>
                          <ul className="list-[circle] pl-5 mt-1 space-y-1">
                            <li>"How can we increase our value proposition for this requirement?"</li>
                            <li>"What specific objectives is the <span className="font-semibold">[Agency]</span> prioritizing?"</li>
                          </ul>
                          <li className="italic">Example: If the <span className="font-semibold">[Agency]</span> is the DoD, emphasize sustainability goals</li>
                          <li><span className="font-semibold">Documentation:</span> Record meeting minutes and decisions in the shared repository</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Step 3: Create Evaluation-Aligned TOC</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Draft a TOC that mirrors the solicitation's <span className="font-semibold">evaluation criteria</span></li>
                          <li>Create a <span className="font-semibold">master checklist</span> of all agency-requested elements</li>
                          <li>Ensure each section is airtight and competitive</li>
                          <li>Tailor content to the bid's scoring rubric</li>
                          <li><span className="font-semibold">Compliance Check:</span> Verify TOC alignment with solicitation requirements</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Step 4: Apply Formatting & Alignment</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Format all content in MLA style</li>
                          <li>Align <span className="font-semibold">RARE EARTH LTD</span>'s capabilities with requirements</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Step 5: Adhere to Government Requirements</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Partner with <span className="font-semibold">[Name of Company]</span> (include website if available)</li>
                          <li>Use <span className="font-semibold">exact</span> language, section labels, and formatting from the solicitation</li>
                          <li className="italic">Example: If the solicitation says "Section 3.1: Technical Approach," replicate it verbatim</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Step 6: Review & Optimize with AI</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Upload evaluation criteria to Claude AI</li>
                          <li>For each section:
                            <ul className="list-[circle] pl-5 mt-1 space-y-1">
                              <li>Transform negative language into positive framing</li>
                              <li>Use formal, active voice</li>
                            </ul>
                          </li>
                          <li>Generate compliance matrix for cross-verification</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mt-6">Step 6.5: Peer Review Process</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Assign peer reviewers for each section</li>
                          <li>Conduct <span className="font-semibold">red team review</span> for critical sections</li>
                          <li>Document all feedback and required changes</li>
                          <li>Update compliance matrix with review outcomes</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Step 7: Quality Control & Finalization</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Conduct <span className="font-semibold">final compliance verification</span> against all solicitation requirements</li>
                          <li>Execute <span className="font-semibold">quality control checklist</span>:
                            <ul className="list-[circle] pl-5 mt-1 space-y-1">
                              <li>Verify all agency-requested elements are addressed</li>
                              <li>Confirm MLA formatting compliance</li>
                              <li>Check section numbering and references</li>
                              <li>Validate all hyperlinks and cross-references</li>
                            </ul>
                          </li>
                          <li>Identify section-by-section weaknesses</li>
                          <li>Brainstorm improvements with agents</li>
                          <li>Revise with persuasive language to maximize scores</li>
                          <li><span className="font-semibold">Final Verification:</span> Conduct pre-submission review against master checklist</li>
                        </ul>
                      </div>
                    </div>
                  </div>


                  <div className="border-l-4 border-yellow-500 pl-4 py-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">4. Submission</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Ensure all requirements are met and submit your proposal before the deadline.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Pro Tip</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Use the expand/collapse buttons to navigate through different sections of the guide. Each section contains detailed information and best practices.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
