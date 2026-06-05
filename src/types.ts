export type ProposalType = {
  type: 'commercial' | 'state_local' | 'federal';
  description: string;
  requirements: string[];
  validation: (data: any) => boolean;
};

export const PROPOSAL_TYPES: Record<string, ProposalType> = {
  commercial: {
    type: 'commercial',
    description: 'Commercial business proposals',
    requirements: ['business_plan', 'financials', 'market_analysis'],
    validation: (data) => data.business_plan && data.financials,
  },
  state_local: {
    type: 'state_local',
    description: 'State and local government proposals',
    requirements: ['regulatory_compliance', 'community_impact'],
    validation: (data) => data.regulatory_compliance,
  },
  federal: {
    type: 'federal',
    description: 'Federal government proposals',
    requirements: ['federal_regulations', 'security_clearance'],
    validation: (data) => data.security_clearance,
  },
};

export type UrgencyLevel = {
  level: 'critical' | 'high' | 'medium' | 'low';
  priority: number;
  sla: number; // Service Level Agreement in hours
  color: string;
};

export const URGENCY_LEVELS: Record<string, UrgencyLevel> = {
  critical: {
    level: 'critical',
    priority: 1,
    sla: 24,
    color: '#ff4444',
  },
  high: {
    level: 'high',
    priority: 2,
    sla: 48,
    color: '#ff8800',
  },
  medium: {
    level: 'medium',
    priority: 3,
    sla: 72,
    color: '#ffff00',
  },
  low: {
    level: 'low',
    priority: 4,
    sla: 168,
    color: '#00cc00',
  },
};

export enum ProposalStatus {
  // Canonical workflow stages (shared/proposalWorkflow.js)
  Ingestion = 'ingestion',
  Compliance = 'compliance',
  Strategy = 'strategy',
  Outline = 'outline',
  PricingStrategy = 'pricing_strategy',
  Drafting = 'drafting',
  RedTeam = 'red_team',
  FinalReview = 'final_review',
  // Terminal
  Submitted = 'submitted',
  Closed = 'closed',
  // Legacy aliases (still appear in stored data)
  Intake = 'intake',
  Qualification = 'qualification',
  PreSolicitation = 'pre_solicitation',
  Research = 'research',
  TechnicalCompliance = 'technical_compliance',
  PricingPackaging = 'pricing_packaging',
  Review = 'review',
  GoogleDocsFinal = 'google_docs_final',
  InternalReview = 'internal_review',
}

export type ProposalStatusOrNull = ProposalStatus | null;

export interface FileMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64 or text
  uploadedAt: string;
  metadata?: {
    [key: string]: any;
  };
  validationStatus?: {
    isValid: boolean;
    errors?: string[];
  };
}

export interface Task {
  id: string;
  proposalId: string;
  title: string;
  description?: string;
  owner?: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  priority: number;
  dependencies?: string[];
  status: {
    current: string;
    progress: number;
    lastUpdated: string;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface Proposal {
  id: string;
  title: string;
  agency: string;
  dueDate: string;
  status: ProposalStatus;
  type: ProposalType;
  notes?: string;
  tasks: Task[];
  files: FileMeta[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    urgency: UrgencyLevel;
    complexity: number;
    estimatedHours: number;
    teamMembers: string[];
    riskLevel: number;
  };
  validationStatus: {
    overall: boolean;
    errors: string[];
    warnings: string[];
  };
}

// ── Pursuit Posture & Timing ─────────────────────────────────────────────────

export type PursuitPosture =
  | 'prime'
  | 'subcontract'
  | 'watch'
  | 'pre_position'
  | 'no_bid'
  | 'either';

export type TimingBucket =
  | 'now'
  | 'this_week'
  | 'next_week'
  | '30_days'
  | '60_days'
  | '90_180'
  | 'beyond'
  | 'overdue';

export interface CaptureTiming {
  pursuitPosture: PursuitPosture;
  /** PURSUIT_BUCKETS id (urgent, active, etc.) */
  pursuitBucket: string;
  /** Dashboard-oriented timing horizon */
  timingBucket: TimingBucket;
  daysOut: number | null;
  intentToBidDate: string | null;
  teamingStartDate: string | null;
  primeOutreachStartDate: string | null;
  primeOutreachEndDate: string | null;
  recommendedWindow: Record<string, any>;
}

// ── Pre-Solicitation / Capture Foundation ────────────────────────────────────

export type OpportunityStage =
  | 'detected'
  | 'qualifying'
  | 'bid_review'
  | 'capture_active'
  | 'no_bid'
  | 'awaiting_rfp';

export interface BidNoBidScore {
  /** 1–5: how entrenched is the incumbent (5 = very strong) */
  incumbentStrength: number;
  /** 1–5: fit to our capabilities / service lanes */
  competitiveFit: number;
  /** 1–5: past performance relevance */
  pastPerformanceFit: number;
  /** 1–5: teaming readiness (0 = major gaps) */
  teamingReadiness: number;
  /** 1–5: pricing / PTW confidence */
  pricingConfidence: number;
  /** 1–5: strategic / pipeline value */
  strategicValue: number;
  /** Computed sum (6–30) */
  total: number;
  /** 0–100 Pwin estimate */
  pwin: number;
  recommendation: 'bid' | 'no_bid' | 'conditional';
  rationale?: string;
}

export interface CaptureStakeholder {
  role: string; // e.g. CO, COR, PM, OSDBU
  name?: string;
  agency?: string;
  notes?: string;
}

export interface PortalReadiness {
  samActive: boolean;
  portalIdentified: boolean;
  credentialsConfirmed: boolean;
  notes?: string;
}

export interface CaptureRecord {
  id: string;
  /** SAM.gov notice ID or similar external identifier */
  opportunityId: string;
  /** Set when a full Proposal is created from this capture record */
  proposalId?: string;
  stage: OpportunityStage;
  solicitationNumber?: string;
  naicsCodes: string[];
  pscCodes: string[];
  setAside?: string;
  /** Incumbent company name */
  incumbentName?: string;
  /** FPDS / USASpending contract number for incumbent */
  incumbentContractNumber?: string;
  bidNoBid?: BidNoBidScore;
  winThemes: string[];
  /** Incumbent weaknesses to contrast implicitly */
  ghostingTargets: string[];
  /** Capability or personnel gaps needing teaming partners */
  teamingGaps: string[];
  stakeholders: CaptureStakeholder[];
  portalReadiness: PortalReadiness;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'proposal' | 'task' | 'meeting' | 'deadline' | 'custom';
  proposalId?: string;
  taskId?: string;
  metadata?: {
    [key: string]: any;
  };
  status: {
    completed: boolean;
    progress: number;
  };
  notificationTime?: string;
  relatedId?: string;
  description?: string;
  pushNotification?: boolean;
  notificationSent?: boolean;
}
