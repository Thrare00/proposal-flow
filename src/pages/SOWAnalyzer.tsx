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

// Types
type TabType = 'overview' | 'pws' | 'instructions' | 'analysis' | 'compliance';

interface KeyTerm {
  term: string;
  context: string;
  section: string;
}

interface Deadline {
  description: string;
  date: string;
  type: string;
  critical: boolean;
}

interface Milestone {
  name: string;
  date: string;
  deliverable: string;
  dependencies: string[];
  criticalPath: boolean;
}

interface DocumentSection {
  summary: string;
  details: string | string[];
  complianceStatus: 'compliant' | 'non-compliant' | 'needs-review';
  notes: string | string[];
}

interface ComplianceItem {
  reference: string;
  requirement: string;
  proposalSection: string;
  pageNumber: string;
}

interface ComplianceRequirement {
  clause: string;
  description: string;
  reference: string;
  isCompliant: boolean;
  notes: string;
}

interface RiskAssessment {
  risk: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
}

interface SOWAnalysis {
  scopeOfWork: DocumentSection;
  technicalRequirements: DocumentSection;
  performanceWorkStatement: DocumentSection;
  contractRequirements: {
    typeOfContract: string[];
    optionPeriods: string[];
    periodOfPerformance: string[];
    placeOfPerformance: string[];
  };
  submissionRequirements: DocumentSection;
  evaluationFactors: DocumentSection;
  keyTerms: {
    must: KeyTerm[];
    shall: KeyTerm[];
    will: KeyTerm[];
    otherCritical: KeyTerm[];
  };
  schedule: {
    deadlines: Deadline[];
    milestones: Milestone[];
    optionPeriods: Array<{ period: string; startDate: string; endDate: string }>;
  };
  risks: RiskAssessment[];
  complianceRequirements: ComplianceRequirement[];
  winProbability: number;
  bidNoBidFactors: string[];
  keyPersonnel: string[];
  specialRequirements: string[];
  complianceItems: ComplianceItem[];
}

// Sample data for demonstration
const sampleAnalysis: Omit<SOWAnalysis, 'complianceItems' | 'keyTerms' | 'schedule' | 'risks' | 'complianceRequirements' | 'winProbability' | 'bidNoBidFactors' | 'keyPersonnel' | 'specialRequirements'> & {
  keyTerms: SOWAnalysis['keyTerms'];
  schedule: SOWAnalysis['schedule'];
  risks: SOWAnalysis['risks'];
  complianceRequirements: SOWAnalysis['complianceRequirements'];
  winProbability: number;
  bidNoBidFactors: string[];
  keyPersonnel: string[];
  specialRequirements: string[];
  complianceItems: ComplianceItem[];
} = {
  scopeOfWork: {
    summary: 'This is the scope of work',
    details: [
      'Provide enterprise IT support services for 10,000+ users',
      'Maintain 99.9% system availability for all critical systems',
      'Implement and maintain security controls in accordance with NIST SP 800-53',
      'Provide 24/7/365 help desk support',
      'Manage network infrastructure and cloud services'
    ],
    complianceStatus: 'compliant' as const,
    notes: ['Standard scope of work for IT services']
  },
  technicalRequirements: {
    summary: 'These are the technical requirements',
    details: [
      'Comply with NIST SP 800-171 and CMMC 2.0 Level 2 requirements',
      'Implement Zero Trust Architecture (ZTA) across all systems',
      'Maintain FedRAMP Moderate ATO for all cloud services',
    ],
    complianceStatus: 'compliant',
    notes: ['Standard technical requirements for IT services']
  },
  performanceWorkStatement: {
    summary: 'This is the performance work statement',
    details: [
      'Response time for critical incidents: 30 minutes',
      'Resolution time for high-priority tickets: 4 hours',
      'System availability: 99.9% uptime'
    ],
    complianceStatus: 'needs-review',
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
      },
      { 
        term: 'essential', 
        context: 'Essential personnel must be identified and available 24/7',
        section: 'Section 3.4.2'
      }
    ]
  },
  schedule: {
    milestones: [
      { 
        name: 'Kickoff Meeting', 
        date: '2024-06-01', 
        deliverable: 'Project Charter',
        dependencies: [],
        criticalPath: true
      },
      { 
        name: 'System Design Review', 
        date: '2024-07-15', 
        deliverable: 'System Design Document',
        dependencies: ['Kickoff Meeting'],
        criticalPath: true
      },
      { 
        name: 'Security Assessment', 
        date: '2024-08-15', 
        deliverable: 'Security Assessment Report',
        dependencies: ['System Design Review'],
        criticalPath: false
      },
      { 
        name: 'Final Delivery', 
        date: '2024-12-31', 
        deliverable: 'Final System Delivery',
        dependencies: ['Security Assessment'],
        criticalPath: true
      }
    ],
    deadlines: [
      { 
        description: 'Proposal Due Date', 
        date: '2024-05-15',
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
    'Security Lead: Robert Chen (CISSP, CISM)',
    'Program Director: Susan Williams (PMP, ITIL)'
  ],
  specialRequirements: [
    'Top Secret facility clearance required',
    '24/7 on-call support',
    'Rapid response time (1 hour for critical incidents)'
  ],
  complianceItems: []
};

const complianceRequirements = [
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
];

const winProbability = 70;
const bidNoBidFactors = [
  'Strong past performance in this domain',
  'Available qualified personnel',
  'Favorable evaluation criteria',
  'Adequate time for proposal preparation'
];

const keyPersonnel = [
  'Project Manager: Jane Doe (PMP, CISSP)',
  'Technical Lead: Mike Johnson (AWS Solutions Architect)',
  'Security Lead: Robert Chen (CISSP, CISM)',
  'Program Director: Susan Williams (PMP, ITIL)'
];

const specialRequirements = [
  'Top Secret facility clearance required',
  '24/7 on-call support',
  'Rapid response time (1 hour for critical incidents)'
];

import { useParams } from 'react-router-dom';
import { useProposalContext } from '../contexts/ProposalContext';

const SOWAnalyzer = () => {
  const { id } = useParams<{ id: string }>();
  const { getProposal, updateProposal } = useProposalContext();
  const proposal = id ? getProposal(id) : undefined;

  // Document types
  const requiredDocs = [
    { key: 'sow', label: 'Statement of Work (SOW)' },
    { key: 'instructions', label: 'Instructions' },
  ];
  const optionalDocs = [
    { key: 'cost', label: 'Cost Proposal / Bid Schedule' },
    { key: 'scoring', label: 'Proposal Scoring' },
    { key: 'past', label: 'Past Performance' },
  ];

  // Helper to get file by type
  const getFile = (type: string) => proposal?.files?.find(f => f.type === type);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !proposal) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        type,
        size: file.size,
        content,
        uploadedAt: new Date().toISOString(),
      };
      const updatedFiles = [...(proposal.files || []).filter(f => f.type !== type), newFile];
      updateProposal(proposal.id, { files: updatedFiles });
    };
    reader.readAsText(file);
  };

  // UI for required and optional documents
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">SOW Analyzer</h1>
      {!proposal ? (
        <div className="text-error-600">Proposal not found.</div>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-2">Required Documents</h2>
          <div className="space-y-4 mb-6">
            {requiredDocs.map(doc => {
              const file = getFile(doc.key);
              return (
                <div key={doc.key} className="flex items-center space-x-4">
                  <span className="font-medium w-56">{doc.label} <span className="text-error-600">*</span></span>
                  {file ? (
                    <>
                      <span className="text-green-700">{file.name}</span>
                      <a
                        href={`data:application/octet-stream;base64,${btoa(file.content)}`}
                        download={file.name}
                        className="btn btn-xs btn-outline-primary ml-2"
                      >Download</a>
                    </>
                  ) : (
                    <>
                      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => handleFileUpload(e, doc.key)} />
                      <span className="text-error-500 text-sm ml-2">Required</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="text-lg font-semibold mb-2">Optional Documents</h2>
          <div className="space-y-4 mb-6">
            {optionalDocs.map(doc => {
              const file = getFile(doc.key);
              return (
                <div key={doc.key} className="flex items-center space-x-4">
                  <span className="font-medium w-56">{doc.label}</span>
                  {file ? (
                    <>
                      <span className="text-green-700">{file.name}</span>
                      <a
                        href={`data:application/octet-stream;base64,${btoa(file.content)}`}
                        download={file.name}
                        className="btn btn-xs btn-outline-primary ml-2"
                      >Download</a>
                    </>
                  ) : (
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => handleFileUpload(e, doc.key)} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Enforce required docs before analysis */}
          {requiredDocs.every(doc => getFile(doc.key)) ? (
            <button className="btn btn-primary" /*onClick={analyzeDocuments}*/>
              Analyze Documents
            </button>
          ) : (
            <div className="text-error-600 font-medium">Please upload all required documents to enable analysis.</div>
          )}
        </>
      )}
    </div>
  );
}

  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SOWAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [documents, setDocuments] = useState<{
    solicitation: string | null;
    pws: string | null;
    instructions: string | null;
    attachments: string[];
  }>({
    solicitation: null,
    pws: null,
    instructions: null,
    attachments: []
  });

  // Initialize sample data
  useEffect(() => {
    const loadSampleData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Use the sampleAnalysis data that's already defined
        setAnalysis({
          ...sampleAnalysis,
          complianceItems: []
        } as SOWAnalysis);
      } catch (error) {
        console.error('Error loading sample data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSampleData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'solicitation' | 'pws' | 'instructions') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDocuments((prev: any) => ({ ...prev, [type]: content }));
    };
    reader.readAsText(file);
  };

  const analyzeDocuments = async () => {
    if (!documents.solicitation || !documents.pws || !documents.instructions) {
      alert('Please upload all required documents before analyzing');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use the sampleAnalysis data with proper type assertion
      setAnalysis({
        ...sampleAnalysis,
        complianceItems: []
      } as SOWAnalysis);
    } catch (error) {
      console.error('Error analyzing documents:', error);
      alert('Failed to analyze documents. Please try again.');
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

  const renderSection = (section: DocumentSection, sectionName: string) => {
    if (!section) return null;

    const details = Array.isArray(section.details) ? section.details : [section.details];
    const notes = Array.isArray(section.notes) ? section.notes : [];

    return (
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        <h3 className="text-lg font-medium mb-3">{sectionName}</h3>
        <p className="text-gray-700 mb-2">{section.summary}</p>
        <div className="mt-2">
          <h4 className="font-medium mb-1">Details:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {details.map((detail, idx) => (
              <li key={idx} className="text-gray-700">
                {detail}
              </li>
            ))}
          </ul>
        </div>
        {notes.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-1">Notes:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {notes.map((note, idx) => (
                <li key={idx} className="text-yellow-700">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderSubmissionRequirements = (requirements: DocumentSection) => {
    if (!requirements) {
      return <p className="text-gray-500">No submission requirements found.</p>;
    }

    const details = Array.isArray(requirements.details) 
      ? requirements.details 
      : [requirements.details];
    
    return (
      <div className="space-y-4">
        <p className="text-gray-700">{requirements.summary}</p>
        <ul className="space-y-2 list-disc pl-5">
          {details.map((detail, idx) => (
            <li key={idx} className="text-gray-700">{detail}</li>
          ))}
        </ul>
        {requirements.notes && (
          <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Note:</span> {requirements.notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderKeyTerms = (terms: KeyTerm[] | undefined, title?: string, colorClass = 'bg-blue-50 text-blue-800') => {
    if (!terms || terms.length === 0) {
      return <p className="text-gray-500">No key terms found.</p>;
    }

    return (
      <div className="space-y-2">
        {title && <h3 className="font-medium text-gray-700">{title}</h3>}
        <ul className="space-y-2">
          {terms.map((term, idx) => (
            <li key={idx} className={`p-3 border rounded-md ${colorClass}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-medium">{term.term}</span>
                  {term.section && (
                    <span className="ml-2 text-xs text-gray-500">(Section {term.section})</span>
                  )}
                </div>
              </div>
              {term.context && (
                <p className="mt-1 text-sm text-gray-600">{term.context}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const exportToExcel = () => {
    // Implementation for exporting to Excel
    console.log('Exporting to Excel...');
    // This would typically use a library like xlsx to export data
    alert('Export to Excel functionality will be implemented here');
  };

  const generateComplianceMatrix = () => {
    // Implementation for generating compliance matrix
    console.log('Generating compliance matrix...');
    // This would generate a compliance matrix based on the analysis
    alert('Compliance matrix generation will be implemented here');
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
                  onClick={() => document.getElementById('pws-upload')?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {documents.pws ? 'Replace SOW' : 'Upload SOW'}
                </button>
                <input
                  id="pws-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileUpload(e, 'pws')}
                />
              </div>
              {documents.pws && (
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
              disabled={isLoading || (!documents.pws && (!documents.attachments || documents.attachments.length === 0))}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                (isLoading || (!documents.pws && (!documents.attachments || documents.attachments.length === 0)))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          
          {isLoading && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing documents...
              </div>
            </div>
          )}
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
                {analysis.schedule?.deadlines && analysis.schedule.deadlines.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Key Deadlines</h3>
                    <ul className="space-y-3">
                      {analysis.schedule.deadlines.map((deadline, idx) => (
                        <li key={idx} className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p>{deadline.description}</p>
                            <p className="text-sm text-gray-500">
                              Due: {new Date(deadline.date).toLocaleDateString()}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.schedule?.milestones && analysis.schedule.milestones.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Project Milestones</h3>
                    <div className="space-y-4">
                      {analysis.schedule.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-start">
                          <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-1">
                            {idx + 1}
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">{milestone.name}</p>
                            <p className="text-sm text-gray-500">
                              Due: {new Date(milestone.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm mt-1">Deliverable: {milestone.deliverable}</p>
                          </div>
                        </div>
                      ))}
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
      </main>
    </div>
  );
};

export default SOWAnalyzer;
