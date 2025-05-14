import { useState } from 'react';
import { 
  ExternalLink, 
  Search, 
  FileText, 
  MessageSquare 
} from 'lucide-react';

const MarketResearch = () => {
  const [showGPTGuide, setShowGPTGuide] = useState(false);

  const marketResearchSteps = [
    {
      title: 'Preliminary Research',
      description: 'Start with a broad search to understand the market landscape and identify potential opportunities.',
      tools: [
        {
          name: 'FPDS (Federal Procurement Data System)',
          url: 'https://www.fpds.gov/fpdsng/contract_award/index.action',
          description: 'Search for federal contract awards to identify patterns and trends in government spending.',
        },
        {
          name: 'USASpending.gov',
          url: 'https://www.usaspending.gov/',
          description: 'Explore federal spending data to identify potential opportunities and market trends.',
        },
      ],
    },
    {
      title: 'Market Analysis',
      description: 'Analyze the market to understand your competition and identify your unique value proposition.',
      tools: [
        {
          name: 'NAICS Code Lookup',
          url: 'https://www.naics.com/naics-code-description/',
          description: 'Find the correct NAICS code for your business to properly categorize your services.',
        },
        {
          name: 'SBA Size Standards',
          url: 'https://www.sba.gov/document/support--table-size-standards',
          description: 'Check if your business qualifies as a small business for government contracting.',
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Market Research Guide</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Getting Started with Market Research</h2>
        <p className="mb-4">
          Market research is a crucial step in the proposal process. This guide will help you navigate the key resources
          and tools available to conduct effective market research for government contracts.
        </p>
        
        <button
          onClick={() => setShowGPTGuide(!showGPTGuide)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <MessageSquare size={20} />
          <span>Toggle AI Research Assistant</span>
        </button>
      </div>

      {showGPTGuide && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">AI Research Assistant</h3>
          <p className="mb-4">
            Use AI to enhance your market research process:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Generate research questions based on your business needs</li>
            <li>Summarize market trends from FPDS and USASpending data</li>
            <li>Identify potential competitors and market gaps</li>
            <li>Create detailed market analysis reports</li>
          </ul>
        </div>
      )}

      <div className="space-y-8">
        {marketResearchSteps.map((step, index) => (
          <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>
            
            <div className="space-y-4">
              {step.tools.map((tool, toolIndex) => (
                <div key={toolIndex} className="flex items-start space-x-4">
                  <ExternalLink className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  <div>
                    <h4 className="font-medium mb-1">{tool.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{tool.description}</p>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Visit {tool.name} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketResearch;
