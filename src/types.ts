export type ProposalType = {
  type: 'commercial' | 'local_state' | 'federal';
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
  local_state: {
    type: 'local_state',
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
  Intake = 'intake',
  Outline = 'outline',
  Drafting = 'drafting',
  InternalReview = 'internal_review',
  FinalReview = 'final_review',
  Submitted = 'submitted'
}

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
}
