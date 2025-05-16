import React, { useState } from 'react';
import { FileText, Upload, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SOWAnalysis, DocumentSection, SubmissionRequirements, ComplianceRequirement, KeyTerm, Documents } from '@/types/sow';

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
    // This would typically make API calls to analyze the documents
    // For now, we'll just return sample data
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
              {section.details.map((detail, index) => (
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
              {section.notes.map((note, index) => (
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
          {requirements.details.map((detail, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded">
              <p className="text-gray-600">{detail}</p>
            </div>
          ))}
        </div>
        {Array.isArray(requirements.notes) ? (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <ul className="list-disc list-inside text-gray-500">
              {requirements.notes.map((note, index) => (
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clause</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliant</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requirements.map((req, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.clause}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{req.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.proposalSection}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.pageNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      req.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {req.isCompliant ? 'Yes' : 'No'}
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
                {termsArray.map((term, index) => (
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">SOW Analyzer</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">Upload Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sow-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Statement of Work (SOW)
              </label>
              <input
                id="sow-upload"
                type="file"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label htmlFor="instructions-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <input
                id="instructions-upload"
                type="file"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !documents.pws || !documents.instructions}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Analyzing...
              </>
            ) : (
              'Analyze Documents'
            )}
          </button>
        </div>

        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Scope of Work</h3>
              {renderSection(analysis.scopeOfWork)}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Technical Requirements</h3>
              {renderSection(analysis.technicalRequirements)}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Contract Requirements</h3>
              <div className="space-y-4">
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
  );
};

export default SOWAnalyzer;
