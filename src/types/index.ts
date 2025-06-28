export type ProposalStatus =
  | 'intake'
  | 'outline'
  | 'drafting'
  | 'internal_review'
  | 'final_review'
  | 'submitted';

export type ProposalStatusType = ProposalStatus;

export const URGENCY_LEVELS = ['critical', 'high', 'medium', 'low'] as const;
export type UrgencyLevel = typeof URGENCY_LEVELS[number];

export interface Proposal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  agency: string;
  notes: string;
  type: 'commercial' | 'local_state' | 'federal';
  tasks: Task[];
  files: FileMeta[];
}

export interface Task {
  id: string;
  proposalId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  owner: string;
  completed: boolean;
}

export interface FileMeta {
  id: string;
  filename: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string;
  type: 'proposal' | 'task' | 'meeting';
  proposalId?: string;
  taskId?: string;
}