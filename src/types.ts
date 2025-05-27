export type ProposalType = 'commercial' | 'local_state' | 'federal';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

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
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  proposalId: string;
  pushNotification?: boolean;
  notificationTime?: string;
  type: 'proposal' | 'task' | 'custom';
  relatedId?: string;
}
