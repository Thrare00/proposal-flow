import { useState, useEffect } from 'react';
import { 
  FileText,
  Download,
  FileSpreadsheet,
  Check,
  Upload,
  Search,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DocumentSection, KeyTerm, SubmissionRequirements, ComplianceRequirement, SOWAnalysis, Documents } from '../types/sow';

// Type definitions
interface Milestone {
  name: string;
  date: string;
  deliverable: string;
  dependencies: string[];
  criticalPath: boolean;
}

interface Deadline {
  description: string;
  date: string;
  type: 'proposal' | 'award';
  critical: boolean;
}

// Sample data
const milestones: Milestone[] = [
  { name: 'Kickoff Meeting', date: '2024-06-01', deliverable: 'Project Charter', dependencies: [], criticalPath: true },
  { name: 'System Design Review', date: '2024-07-15', deliverable: 'System Design Document', dependencies: ['Kickoff Meeting'], criticalPath: true },
  { name: 'Security Assessment', date: '2024-08-15', deliverable: 'Security Assessment Report', dependencies: ['System Design Review'], criticalPath: false },
  { name: 'Final Delivery', date: '2024-12-31', deliverable: 'Final System Delivery', dependencies: ['Security Assessment'], criticalPath: true }
];

const deadlines: Deadline[] = [
  { description: 'Proposal Due Date', date: '2024-05-15', type: 'proposal', critical: true },
  { description: 'Award Notification', date: '2024-05-30', type: 'award', critical: true }
];

// Sample analysis data
const sampleAnalysis: SOWAnalysis = {
  scopeOfWork: {
    summary: 'Scope of Work Overview',
    details: [
      'Provide comprehensive IT services',
      'Deliver quality solutions',
      'Maintain system integrity'
    ],
    complianceStatus: 'needs-review',
    notes: 'Review scope alignment with project goals'
  },
  technicalRequirements: {
    summary: 'Technical Requirements',
    details: [
      'Use modern development frameworks',
      'Implement security best practices',
      'Ensure system scalability'
    ],
    complianceStatus: 'compliant',
    notes: 'All technical requirements met'
  },
  contractRequirements: {
    typeOfContract: ['Firm Fixed Price'],
    optionPeriods: ['1 year'],
    periodOfPerformance: ['24 months'],
    placeOfPerformance: ['Remote']
  },
  keyTerms: {
    must: [
      { term: 'must comply', context: 'with security protocols', section: 'Section 4.2.1' },
      { term: 'must deliver', context: 'within timeline', section: 'Section 5.1.2' }
    ],
    shall: [
      { term: 'shall provide', context: 'regular updates', section: 'Section 6.3.4' },
      { term: 'shall maintain', context: 'system documentation', section: 'Section 7.2.5' }
    ],
    will: [
      { term: 'will ensure', context: 'quality assurance', section: 'Section 8.1.6' },
      { term: 'will support', context: 'post-deployment', section: 'Section 9.4.7' }
    ],
    otherCritical: [
      { term: 'critical dependencies', context: 'must be documented', section: 'Section 2.3.8' },
      { term: 'critical assets', context: 'must be protected', section: 'Section 3.1.9' }
    ]
  },
  performanceWorkStatement: {
    summary: 'Performance Work Statement',
    details: [
      'Deliverables must be documented',
      'Performance metrics defined',
      'Quality assurance plan included'
    ],
    complianceStatus: 'compliant',
    notes: 'All performance metrics defined'
  },
  submissionRequirements: {
    details: [
      'Submit detailed documentation',
      'Include test results',
      'Provide system architecture'
    ],
    notes: ['Submit in PDF format', 'Include version history']
  },
  complianceRequirements: [
    {
      clause: 'Security Compliance',
      description: 'Must comply with security protocols',
      proposalSection: 'Security',
      pageNumber: '12',
      isCompliant: true
    },
    {
      clause: 'Performance Metrics',
      description: 'Must meet performance targets',
      proposalSection: 'Performance',
      pageNumber: '15',
      isCompliant: true
    }
  ]
};

const SOWAnalyzer = () => {
  const [documents, setDocuments] = useState<Documents | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SOWAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pws' | 'instructions' | 'analysis' | 'compliance'>('analysis');
  const [error, setError] = useState<string | null>(null);

  // ... rest of component code ...

    notes: ['Performance metrics may need adjustment based on final requirements']
  },
  contractRequirements: {
    typeOfContract: ['Firm Fixed Price (FFP)'],
    optionPeriods: ['1 year base + 4 option years'],
    periodOfPerformance: ['Base period: 1 year', 'Option years: 4 x 1 year'],
    placeOfPerformance: ['Primary: Washington, DC', 'Remote work authorized up to 80%']
  },
  submissionRequirements: {
    summary: 'These are the submission requirements',
    details: [
      'Technical Volume (50 pages max, excluding resumes and certifications)',
      'Cost Volume (separate sealed envelope)',
      'Small Business Subcontracting Plan (if applicable)',
      'Representations and Certifications (completed in SAM.gov)'
    ],
    complianceStatus: 'compliant',
    notes: ['Standard submission requirements for IT services']
  },
  evaluationFactors: {
    summary: 'These are the evaluation factors',
    details: [
      'Technical Approach (40%): Demonstrated understanding of requirements and proposed solution',
      'Corporate Experience (15%): Relevant past performance on similar projects',
      'Key Personnel (15%): Qualifications and experience of proposed staff',
      'Small Business Participation (5%): Extent of small business subcontracting',
      'Price (10%): Total evaluated price (lower price may result in higher score)'
    ],
    complianceStatus: 'compliant',
    notes: ['Standard evaluation factors for IT services']
  },
  keyTerms: {
    must: [
      { 
        term: 'must provide', 
        context: 'Contractor must provide monthly status reports',
        section: 'Section 4.5.1'
      },
      { 
        term: 'must maintain', 
        context: 'Contractor must maintain all required documentation',
        section: 'Section 5.2.1'
      }
    ],
    shall: [
      { 
        term: 'shall deliver', 
        context: 'Contractor shall deliver all deliverables according to the schedule',
        section: 'Section 5.2.3'
      },
      { 
        term: 'shall maintain', 
        context: 'Contractor shall maintain documentation for all system changes',
        section: 'Section 6.1.4'
      }
    ],
    will: [
      { 
        term: 'will review', 
        context: 'Government will review all deliverables within 10 business days',
        section: 'Section 7.3.2'
      },
      { 
        term: 'will provide', 
        context: 'Government will provide access to necessary systems',
        section: 'Section 2.1.5'
      }
    ],
    otherCritical: [
      { 
        term: 'critical', 
        context: 'This is a critical requirement for mission success',
        section: 'Section 1.2.1'
      }
    ],
      { 
        term: 'essential', 
        context: 'Essential personnel must be identified and available 24/7',
        section: 'Section 3.4.2'
      }
    ]
  },

        type: 'proposal',
        critical: true
      },
      { 
        description: 'Award Notification', 
        date: '2024-05-30',
        type: 'award',
        critical: true
      },
      { 
        description: 'Period of Performance Start', 
        date: '2024-06-01',
        type: 'other',
        critical: true
      }
    ],
    optionPeriods: [
      { 
        period: 'Base Period', 
        startDate: '2024-06-01', 
        endDate: '2025-05-31'
      },
      { 
        period: 'Option Year 1', 
        startDate: '2025-06-01', 
        endDate: '2026-05-31'
      },
      { 
        period: 'Option Year 2', 
        startDate: '2026-06-01', 
        endDate: '2027-05-31'
      },
      { 
        period: 'Option Year 3', 
        startDate: '2027-06-01', 
        endDate: '2028-05-31'
      },
      { 
        period: 'Option Year 4', 
        startDate: '2028-06-01', 
        endDate: '2029-05-31'
      }
    ]
  },
  risks: [
    {
      risk: 'Insufficient staffing resources',
      impact: 'high',
      probability: 'medium',
      mitigation: 'Pre-identify qualified personnel and obtain letters of intent'
    },
    {
      risk: 'Security clearance processing delays',
      impact: 'high',
      probability: 'high',
      mitigation: 'Submit clearance requests immediately after award and identify alternates'
    },
    {
      risk: 'Supply chain disruptions',
      impact: 'medium',
      probability: 'medium',
      mitigation: 'Identify multiple qualified suppliers and maintain safety stock'
    }
  ],
  complianceRequirements: [
    {
      clause: 'FAR 52.203-19',
      description: 'Prohibition on Contracting with Entities that Require Certain Internal Confidentiality Agreements',
      reference: 'FAR 3.909-3',
      isCompliant: true,
      notes: 'Standard FAR clause, no issues identified'
    },
    {
      clause: 'FAR 52.204-21',
      description: 'Basic Safeguarding of Covered Contractor Information Systems',
      reference: 'FAR 4.1903',
      isCompliant: true,
      notes: 'Basic security requirements met'
    }
  ],
  winProbability: 70,
  bidNoBidFactors: [
    'Strong past performance in this domain',
    'Available qualified personnel',
    'Favorable evaluation criteria',
    'Adequate time for proposal preparation'
  ],
  keyPersonnel: [
    'Project Manager: Jane Doe (PMP, CISSP)',
    'Technical Lead: Mike Johnson (AWS Solutions Architect)',
    'Security Lead: Robert Chen (CISSP, CISM)'
  ]
};

const milestones: Milestone[] = [
  { name: 'Kickoff Meeting', date: '2024-06-01', deliverable: 'Project Charter', dependencies: [], criticalPath: true },
  { name: 'System Design Review', date: '2024-07-15', deliverable: 'System Design Document', dependencies: ['Kickoff Meeting'], criticalPath: true },
  { name: 'Security Assessment', date: '2024-08-15', deliverable: 'Security Assessment Report', dependencies: ['System Design Review'], criticalPath: false },
  { name: 'Final Delivery', date: '2024-12-31', deliverable: 'Final System Delivery', dependencies: ['Security Assessment'], criticalPath: true }
];

const deadlines: Deadline[] = [
  { description: 'Proposal Due Date', date: '2024-05-15', type: 'proposal', critical: true },
  { description: 'Award Notification', date: '2024-05-30', type: 'award', critical: true },
];

const renderKeyTerms = (terms: KeyTerm[] | null, title: string, colorClass: string) => {
  if (!terms?.length) return null;
  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-medium ${colorClass}`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{title}</h3>
      <div className="space-y-2">
        {terms.map((term, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className={`text-sm font-medium ${colorClass}`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{term.term}</span>
            <span className="text-sm text-gray-600">{term.context}</span>
            <span className="text-sm text-gray-500">({term.section})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderDocumentSection = (section: DocumentSection | null) => {
  if (!section) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{section.summary}</h3>
      <div className="space-y-2">
        {section.details && Array.isArray(section.details) && section.details.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {section.details.map((detail, index) => (
              <li key={index} className="text-gray-600">{detail}</li>
            ))}
          </ul>
        )}
        {section.notes && (
          <div className="mt-2 text-sm text-gray-600">
            {typeof section.notes === 'string' ? section.notes : section.notes.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

const renderComplianceRequirements = (requirements: ComplianceRequirement[] | null) => {
  if (!requirements || requirements.length === 0) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Compliance Requirements</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clause</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requirements.map((req, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.clause}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.proposalSection}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.pageNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    req.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {req.isCompliant ? 'Compliant' : 'Not Compliant'}
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

const SOWAnalyzer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Documents>({
    pws: null,
    instructions: null
  });
  const [analysis, setAnalysis] = useState<SOWAnalysis | null>(null);

  const handleFileUpload = (type: 'pws' | 'instructions') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setDocuments(prev => ({
        ...prev,
        [type]: content
      }));
      toast.success(`Successfully uploaded ${type === 'pws' ? 'PWS' : 'Instructions'}`);
    };
    reader.readAsText(file);
  };

  const analyzeDocuments = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAnalysis(sampleAnalysis);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysis(sampleAnalysis);
      setIsLoading(false);
    };
    loadAnalysis();
  }, []);

  const exportToExcel = () => {
    toast.success('Exported to Excel');
  };

  const generateComplianceMatrix = () => {
    toast.success('Generated compliance matrix');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Analyzing documents...</span>
          </div>
        </div>
      )}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-2 text-blue-600" />
              SOW & Proposal Analyzer
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </button>
              <button
                onClick={generateComplianceMatrix}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Generate Compliance Matrix
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              documents.pws ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              <FileText className="mr-1 h-4 w-4" />
              {documents.pws ? 'SOW Uploaded' : 'SOW Required'}
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              documents.instructions ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              <FileText className="mr-1 h-4 w-4" />
              {documents.instructions ? 'Instructions Uploaded' : 'Instructions Required'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="border-b border-gray-200 pb-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Upload Documents</h3>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Upload the Statement of Work (SOW) and Instructions to Offerors documents to begin analysis.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">Statement of Work (SOW)</h4>
              <p className="mt-1 text-xs text-gray-500">PDF, DOCX, or TXT (Max 10MB)</p>
              <div className="mt-4">
                <button
                  onClick={() => document.getElementById('sow-upload')?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {documents.pws ? 'Replace SOW' : 'Upload SOW'}
                </button>
                <input
                  id="sow-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileUpload('pws')(e)}
                />
              </div>
              {documents.pws && (
                <p className="mt-2 text-xs text-green-600">
                  <Check className="inline h-3 w-3" /> Document uploaded successfully
                </p>
              )}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">Instructions to Offerors</h4>
              <p className="mt-1 text-xs text-gray-500">PDF, DOCX, or TXT (Max 10MB)</p>
              <div className="mt-4">
                <button
                  onClick={() => document.getElementById('instructions-upload')?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {documents.instructions ? 'Replace Instructions' : 'Upload Instructions'}
                </button>
                <input
                  id="instructions-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileUpload('instructions')(e)}
                />
              </div>
              {documents.instructions && (
                <p className="mt-2 text-xs text-green-600">
                  <Check className="inline h-3 w-3" /> Document uploaded successfully
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={analyzeDocuments}
              disabled={isLoading || !documents.pws || !documents.instructions}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                (isLoading || !documents.pws || !documents.instructions)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Analyze Documents
                </>
              )}
            </button>
          </div>
        </div>

        {analysis && Object.keys(analysis).length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-3">Scope of Work</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Summary</h4>
                  <p className="text-sm text-gray-600">{analysis.scopeOfWork.summary}</p>
                </div>
                <div>
                  <h4 className="font-medium">Details</h4>
                  <ul className="list-disc pl-5">
                    {analysis.scopeOfWork.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-gray-600">{detail}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Compliance Status</h4>
                  <p className="text-sm text-gray-600">{analysis.scopeOfWork.complianceStatus}</p>
                </div>
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-gray-600">{analysis.scopeOfWork.notes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-3">Technical Requirements</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Summary</h4>
                  <p className="text-sm text-gray-600">{analysis.technicalRequirements.summary}</p>
                </div>
                <div>
                  <h4 className="font-medium">Details</h4>
                  <ul className="list-disc pl-5">
                    {analysis.technicalRequirements.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-gray-600">{detail}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Compliance Status</h4>
                  <p className="text-sm text-gray-600">{analysis.technicalRequirements.complianceStatus}</p>
                </div>
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-gray-600">{analysis.technicalRequirements.notes}</p>
                </div>
              </div>
            </div>
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
<span>Analyzing documents...</span>
</div>
</div>
)}
{/* Header */}
<header className="bg-white shadow">
<div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
<div className="flex justify-between items-center">
<h1 className="text-3xl font-bold text-gray-900 flex items-center">
<FileText className="mr-2 text-blue-600" />
SOW & Proposal Analyzer
</h1>
<div className="flex space-x-4">
<button
onClick={exportToExcel}
className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
>
<Download className="mr-2 h-4 w-4" />
Export to Excel
</button>
<button
onClick={generateComplianceMatrix}
className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>
<FileSpreadsheet className="mr-2 h-4 w-4" />
Generate Compliance Matrix
</button>
</div>
</div>
{/* Document Status */}
<div className="mt-4 flex items-center space-x-4">
<div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
documents.pws ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
}`}>
<FileText className="mr-1 h-4 w-4" />
{documents.pws ? 'SOW Uploaded' : 'SOW Required'}
</div>
<div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
documents.instructions ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
}`}>
<FileText className="mr-1 h-4 w-4" />
{documents.instructions ? 'Instructions Uploaded' : 'Instructions Required'}
</div>
</div>
</div>
</header>

<main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
{/* Document Upload Section */}
<div className="bg-white shadow rounded-lg p-6 mb-6">
<div className="border-b border-gray-200 pb-5">
<h3 className="text-lg font-medium leading-6 text-gray-900">Upload Documents</h3>
<p className="mt-2 max-w-4xl text-sm text-gray-500">
Upload the Statement of Work (SOW) and Instructions to Offerors documents to begin analysis.
</p>
</div>
<div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
{/* SOW Upload */}
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
<FileText className="mx-auto h-12 w-12 text-gray-400" />
<h4 className="mt-2 text-sm font-medium text-gray-900">Statement of Work (SOW)</h4>
<p className="mt-1 text-xs text-gray-500">PDF, DOCX, or TXT (Max 10MB)</p>
<div className="mt-4">
<button
onClick={() => document.getElementById('sow-upload')?.click()}
className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>
<Upload className="mr-2 h-4 w-4" />
{documents.sow ? 'Replace SOW' : 'Upload SOW'}
</button>
<input
id="sow-upload"
type="file"
className="hidden"
accept=".pdf,.docx,.txt"
onChange={(e) => handleFileUpload(e, 'sow')}
/>
</div>
{documents.sow && (
<p className="mt-2 text-xs text-green-600">
<Check className="inline h-3 w-3" /> Document uploaded successfully
</p>
)}
</div>
{/* Instructions Upload */}
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
<FileText className="mx-auto h-12 w-12 text-gray-400" />
<h4 className="mt-2 text-sm font-medium text-gray-900">Instructions to Offerors</h4>
<p className="mt-1 text-xs text-gray-500">PDF, DOCX, or TXT (Max 10MB)</p>
<div className="mt-4">
<button
onClick={() => document.getElementById('instructions-upload')?.click()}
className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>
<Upload className="mr-2 h-4 w-4" />
{documents.instructions ? 'Replace Instructions' : 'Upload Instructions'}
</button>
<input
id="instructions-upload"
type="file"
className="hidden"
accept=".pdf,.docx,.txt"
onChange={(e) => handleFileUpload(e, 'instructions')}
/>
</div>
{documents.instructions && (
<p className="mt-2 text-xs text-green-600">
<Check className="inline h-3 w-3" /> Document uploaded successfully
</p>
)}
</div>
</div>

{/* Analyze Button */}
<div className="mt-6 text-center">
<button
onClick={analyzeDocuments}
disabled={isLoading || !documents.sow || !documents.instructions}
className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
(isLoading || !documents.sow || !documents.instructions)
? 'bg-gray-400 cursor-not-allowed'
: 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
}`}
>
{isLoading ? (
<>
<svg
className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
xmlns="http://www.w3.org/2000/svg"
fill="none"
viewBox="0 0 24 24"
>
<circle
className="opacity-25"
cx="12"
cy="12"
r="10"
stroke="currentColor"
strokeWidth="4"
></circle>
<path
className="opacity-75"
fill="currentColor"
d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
></path>
</svg>
Analyzing...
</>
) : (
<>
<Search className="mr-2 h-5 w-5" />
Analyze Documents
</>
)}
</button>
<button
onClick={() => setActiveTab('pws')}
className={`px-4 py-2 rounded-md ${
activeTab === 'pws' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
}`}
>
PWS
</button>
<button
onClick={() => setActiveTab('instructions')}
className={`px-4 py-2 rounded-md ${
activeTab === 'instructions' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
}`}
>
Instructions
</button>
<button
onClick={() => setActiveTab('compliance')}
className={`px-4 py-2 rounded-md ${
activeTab === 'compliance' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
}`}
>
Compliance
</button>
</div>

{/* Analysis Results */}
{analysis && Object.keys(analysis).length > 0 && (
<div className="space-y-6">
{/* Tabs */}
<div className="border-b border-gray-200">
<nav className="-mb-px flex space-x-8">
<button
onClick={() => setActiveTab('analysis')}
className={`px-4 py-2 rounded-md ${
activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
}`}
>
Analysis
</button>
<button
onClick={() => setActiveTab('pws')}
className={`px-4 py-2 rounded-md ${
activeTab === 'pws' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
}`}
>
PWS
</button>
<button
onClick={() => setActiveTab('instructions')}
className={`px-4 py-2 rounded-md ${
activeTab === 'instructions' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
}`}
>
Instructions
</button>
<button
onClick={() => setActiveTab('compliance')}
className={`px-4 py-2 rounded-md ${
activeTab === 'compliance' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
}`}
>
Compliance
</button>
</nav>
</div>

{/* Analysis Tab */}
{activeTab === 'analysis' && (
<div className="space-y-6">
{analysis.keyTerms && (
<div className="space-y-6">
{renderKeyTerms(analysis.keyTerms.must, 'Must Terms', 'text-red-600')}
{renderKeyTerms(analysis.keyTerms.shall, 'Shall Terms', 'text-blue-600')}
{renderKeyTerms(analysis.keyTerms.will, 'Will Terms', 'text-green-600')}
{renderKeyTerms(analysis.keyTerms.otherCritical, 'Other Critical Terms', 'text-yellow-600')}
</div>
)}
{analysis.complianceRequirements && (
<div className="bg-white p-6 rounded-lg shadow">
<h2 className="text-xl font-semibold text-gray-900 mb-6">Compliance Requirements</h2>
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Clause
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Description
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Proposal Section
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Page Number
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Status
</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{analysis.complianceRequirements.map((req, idx) => (
<tr key={idx}>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
{req.clause}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
{req.description}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
{req.proposalSection}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
{req.pageNumber}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
{req.isCompliant ? (
<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
Compliant
</span>
) : (
<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
Non-Compliant
</span>
)}
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)}
</div>
)}

{/* PWS Analysis Tab */}
{activeTab === 'pws' && analysis?.performanceWorkStatement && (
<div>
<h2 className="text-2xl font-bold mb-6">Performance Work Statement</h2>
{renderSection(analysis.performanceWorkStatement, 'Performance Work Statement')}
</div>
)}

{/* Instructions to Offerors Tab */}
{activeTab === 'instructions' && (
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
<div className="space-y-4">
<h2 className="text-xl font-semibold text-gray-900">Submission Requirements</h2>
{renderSubmissionRequirements(analysis.submissionRequirements)}
  
<h2 className="text-xl font-semibold text-gray-900 mt-8">Evaluation Factors</h2>
{renderSection(analysis.evaluationFactors, 'evaluationFactors')}
</div>
  
<div className="space-y-4">
<h2 className="text-xl font-semibold text-gray-900">Key Terms</h2>
<div className="bg-white p-6 rounded-lg shadow space-y-6">
{renderKeyTerms(analysis.keyTerms.must, 'Must', 'text-red-600')}
{renderKeyTerms(analysis.keyTerms.shall, 'Shall', 'text-blue-600')}
{renderKeyTerms(analysis.keyTerms.will, 'Will', 'text-green-600')}
{renderKeyTerms(analysis.keyTerms.otherCritical, 'Other Critical Terms', 'text-yellow-600')}
</div>
</div>
</div>
)}

{/* Compliance Matrix Tab */}
{activeTab === 'compliance' && (
<div className="bg-white p-6 rounded-lg shadow">
<h2 className="text-xl font-semibold text-gray-900 mb-6">Compliance Matrix</h2>
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page #</th>
<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliant</th>
<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
<tr>
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SOW 1.1</td>
<td className="px-6 py-4 text-sm text-gray-500">Provide IT support services</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5</td>
<td className="px-6 py-4 whitespace-nowrap">
<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
Yes
</span>
</td>
<td className="px-6 py-4 text-sm text-gray-500">Standard support services</td>
</tr>
<tr>
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SOW 2.3</td>
<td className="px-6 py-4 text-sm text-gray-500">Monthly performance reports</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8</td>
<td className="px-6 py-4 whitespace-nowrap">
<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
Partial
</span>
</td>
<td className="px-6 py-4 text-sm text-gray-500">Need additional details on format</td>
</tr>
<tr>
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">INSTR 4.2</td>
<td className="px-6 py-4 text-sm text-gray-500">Submit past performance references</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
<td className="px-6 py-4 whitespace-nowrap">
<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
Yes
</span>
</td>
<td className="px-6 py-4 text-sm text-gray-500">Three references available</td>
</tr>
</tbody>
</table>
</div>
</div>
)}
</div>
)}
</div>
</main>
</div>
);
};

interface Deadline {
