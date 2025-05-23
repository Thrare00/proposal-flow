import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SOWAnalysis, Documents, DocumentSection, SubmissionRequirements, ComplianceRequirement, KeyTerm } from '../types/sow';
import { useProposalContext } from '../contexts/ProposalContext';


const sampleAnalysis: SOWAnalysis = {
  scopeOfWork: {
    summary: 'Overview',
    details: 'This is a sample overview text',
    complianceStatus: 'compliant',
    notes: 'These are sample notes'
  },
  technicalRequirements: {
    summary: 'Technical Requirements',
    details: 'These are sample technical requirements',
    complianceStatus: 'compliant',
    notes: 'These are sample technical notes'
  },
  contractRequirements: {
    typeOfContract: ['Fixed Price'],
    optionPeriods: ['1 year'],
    periodOfPerformance: ['12 months'],
    placeOfPerformance: ['Client Site']
  },
  keyTerms: {
    must: [
      {
        term: 'Must Term',
        context: 'This term must be met',
        section: 'Technical Requirements'
      }
    ],
    shall: [
      {
        term: 'Shall Term',
        context: 'This term shall be followed',
        section: 'Contract Requirements'
      }
    ],
    will: [
      {
        term: 'Will Term',
        context: 'This term will be implemented',
        section: 'Scope of Work'
      }
    ],
    otherCritical: [
      {
        term: 'Critical Term',
        context: 'This is a critical term',
        section: 'Compliance'
      }
    ]
  },
  performanceWorkStatement: {
    summary: 'Performance Work Statement',
    details: 'This is a sample performance work statement',
    complianceStatus: 'compliant',
    notes: 'These are sample PWS notes'
  },
  submissionRequirements: {
    details: ['Submit proposal by deadline', 'Include all required documentation'],
    notes: ['Follow submission format', 'Provide detailed responses']
  },
  evaluationFactors: {
    summary: 'Evaluation Factors',
    details: 'These are sample evaluation factors',
    complianceStatus: 'compliant',
    notes: 'These are sample evaluation notes'
  },
  complianceRequirements: [
    {
      clause: '1.1',
      description: 'Description of requirement 1',
      proposalSection: 'Scope of Work',
      pageNumber: '5',
      isCompliant: true
    },
    {
      clause: '2.3',
      description: 'Description of requirement 2',
      proposalSection: 'Technical Requirements',
      pageNumber: '8',
      isCompliant: false
    }
  ]
};

const SOWAnalyzer = () => {
  const { proposals } = useProposalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Documents>({
    pws: null,
    instructions: null
  });
  const [analysis, setAnalysis] = useState<SOWAnalysis | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    const fileId = e.target.id;
    if (fileId === 'sow-upload') {
      setDocuments(prev => ({ ...prev, pws: file }));
    } else if (fileId === 'instructions-upload') {
      setDocuments(prev => ({ ...prev, instructions: file }));
    } else {
      toast.error('Invalid file input');
      return;
    }

    toast.success('File uploaded successfully');
  };

  const handleAnalyze = async () => {
    if (!documents.pws || !documents.instructions) {
      toast.error('Please upload both documents first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeDocuments();
      setAnalysis(result);
      toast.success('Analysis complete');
    } catch (error) {
      toast.error('Error analyzing documents');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDocuments = async (): Promise<SOWAnalysis> => {
    return sampleAnalysis;
  };

  const renderSection = (section: DocumentSection | null) => {
    if (!section) return null;
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">{section.summary}</h3>
        <div className="space-y-4">
          {Array.isArray(section.details) ? (
            <ul className="list-disc list-inside text-gray-600">
              {section.details.map((detail: string, index: number) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">{section.details}</p>
          )}
        </div>
        {Array.isArray(section.notes) ? (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <ul className="list-disc list-inside text-gray-500">
              {section.notes.map((note: string, index: number) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        ) : section.notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">{section.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSubmissionRequirements = (requirements: SubmissionRequirements | null) => {
    if (!requirements) return null;
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Submission Requirements</h3>
        <div className="space-y-4">
          {requirements.details.map((detail: string, index: number) => (
            <div key={index} className="p-4 bg-gray-50 rounded">
              <p className="text-gray-600">{detail}</p>
            </div>
          ))}
        </div>
        {Array.isArray(requirements.notes) ? (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <ul className="list-disc list-inside text-gray-500">
              {requirements.notes.map((note: string, index: number) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        ) : requirements.notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">{requirements.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderComplianceMatrix = (requirements: ComplianceRequirement[]) => {
    if (!requirements?.length) return null;
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Compliance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clause
                </th>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proposal Section
                </th>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Number
                </th>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requirements.map((requirement: ComplianceRequirement, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.clause}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.proposalSection}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.pageNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      requirement.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {requirement.isCompliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderKeyTerms = (terms: { must: KeyTerm[]; shall: KeyTerm[]; will: KeyTerm[]; otherCritical: KeyTerm[] } | null) => {
    if (!terms) return null;
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Key Terms</h3>
        <div className="space-y-4">
          {Object.entries(terms).map(([type, termsArray]) => (
            <div key={type}>
              <h4 className="text-base font-medium mb-2">{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
              <div className="space-y-4">
                {termsArray.map((term: KeyTerm, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded">
                    <h5 className="font-medium text-gray-900">{term.term}</h5>
                    <p className="mt-2 text-gray-600">{term.context}</p>
                    <p className="mt-1 text-sm text-gray-500">Section: {term.section}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">SOW Analyzer</h1>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sow-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload SOW
                </label>
                <input
                  id="sow-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label htmlFor="instructions-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Instructions
                </label>
                <input
                  id="instructions-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin mr-2 h-5 w-5 text-white" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5 text-white" />
                Analyze Documents
              </>
            )}
          </button>

          {analysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  {renderSection(analysis.scopeOfWork)}
                </div>
                <div>
                  {renderSection(analysis.technicalRequirements)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Contract Requirements</h3>
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-base font-medium mb-4">Type of Contract</h4>
                    <div className="space-y-2">
                      {analysis.contractRequirements.typeOfContract.map((type, index) => (
                        <p key={index} className="text-gray-600">{type}</p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-base font-medium mb-4">Option Periods</h4>
                    <div className="space-y-2">
                      {analysis.contractRequirements.optionPeriods.map((period, index) => (
                        <p key={index} className="text-gray-600">{period}</p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-base font-medium mb-4">Period of Performance</h4>
                    <div className="space-y-2">
                      {analysis.contractRequirements.periodOfPerformance.map((period, index) => (
                        <p key={index} className="text-gray-600">{period}</p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-base font-medium mb-4">Place of Performance</h4>
                    <div className="space-y-2">
                      {analysis.contractRequirements.placeOfPerformance.map((place, index) => (
                        <p key={index} className="text-gray-600">{place}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Key Terms</h3>
                {renderKeyTerms(analysis.keyTerms)}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Submission Requirements</h3>
                {renderSubmissionRequirements(analysis.submissionRequirements)}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Evaluation Factors</h3>
                {renderSection(analysis.evaluationFactors)}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Compliance Requirements</h3>
                {renderComplianceMatrix(analysis.complianceRequirements)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOWAnalyzer;
