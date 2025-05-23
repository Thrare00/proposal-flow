export type ProposalType = 'commercial' | 'local_state' | 'federal';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export type ProposalStatus = 'intake' | 'outline' | 'drafting' | 'internal_review' | 'final_review' | 'submitted';

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
