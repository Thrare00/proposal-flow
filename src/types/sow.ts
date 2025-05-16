export interface DocumentSection {
  summary: string;
  details: string | string[];
  complianceStatus: 'compliant' | 'non-compliant' | 'needs-review';
  notes: string | string[];
}

export interface KeyTerm {
  term: string;
  context: string;
  section: string;
}

export interface SubmissionRequirements {
  details: string[];
  notes?: string[];
}

export interface ComplianceRequirement {
  clause: string;
  description: string;
  proposalSection: string;
  pageNumber: string;
  isCompliant: boolean;
}

export interface SOWAnalysis {
  scopeOfWork: DocumentSection;
  technicalRequirements: DocumentSection;
  contractRequirements: {
    typeOfContract: string[];
    optionPeriods: string[];
    periodOfPerformance: string[];
    placeOfPerformance: string[];
  };
  keyTerms: {
    must: KeyTerm[];
    shall: KeyTerm[];
    will: KeyTerm[];
    otherCritical: KeyTerm[];
  };
  performanceWorkStatement: DocumentSection;
  submissionRequirements: SubmissionRequirements;
  evaluationFactors: DocumentSection;
  complianceRequirements: ComplianceRequirement[];
}

export interface Documents {
  pws: File | null;
  instructions: File | null;
}
