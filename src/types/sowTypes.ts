export interface Milestone {
  name: string;
  date: string;
  deliverable: string;
}

export interface Deadline {
  description: string;
  date: string;
}

export interface OptionPeriod {
  period: string;
  startDate: string;
  endDate: string;
}

export interface KeyTerm {
  term: string;
  context: string;
  section: string;
}

export interface ComplianceItem {
  reference: string;
  requirement: string;
  proposalSection: string;
  pageNumber: string;
}

export interface SOWAnalysis {
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
    milestones: Milestone[];
    deadlines: Deadline[];
    optionPeriods: OptionPeriod[];
  };
  risks: {
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
  complianceRequirements: {
    clause: string;
    description: string;
    reference: string;
    isCompliant: boolean;
    notes: string;
  }[];
  winProbability: number;
  bidNoBidFactors: string[];
  keyPersonnel: string[];
  specialRequirements: string[];
  complianceItems: ComplianceItem[];
}

export interface DocumentSection {
  title?: string;
  summary: string;
  details: string | string[];
  complianceStatus: 'compliant' | 'non-compliant' | 'needs-review';
  notes?: string | string[];
}
