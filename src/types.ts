export enum ProposalType {
  COMMERCIAL = 'commercial',
  LOCAL_STATE = 'local_state',
  FEDERAL = 'federal'
}

export enum UrgencyLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum ProposalStatus {
  INTAKE = 'intake',
  OUTLINE = 'outline',
  DRAFTING = 'drafting',
  INTERNAL_REVIEW = 'internal_review',
  FINAL_REVIEW = 'final_review',
  SUBMITTED = 'submitted'
}

export interface FileMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64 or text
  uploadedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  proposalId: string;
  owner?: string;
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
  files?: FileMeta[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  proposalId: string;
  pushNotification?: boolean;
  notificationTime?: string;
  type?: 'proposal' | 'task' | 'custom';
  relatedId?: string;
}
