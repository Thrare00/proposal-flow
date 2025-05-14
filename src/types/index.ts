export type ProposalStatus = 
  | 'intake' 
  | 'outline' 
  | 'drafting' 
  | 'internal_review' 
  | 'final_review' 
  | 'submitted';

export type UrgencyLevel = 
  | 'low'    // > 2 weeks
  | 'medium' // 1-2 weeks
  | 'high'   // < 1 week
  | 'critical'; // < 2 days

export interface Task {
  id: string;
  proposalId: string;
  title: string;
  description?: string;
  owner: string;
  dueDate: string; // ISO string
  completed: boolean;
  createdAt: string; // ISO string
}

export interface Proposal {
  id: string;
  title: string;
  agency: string;
  dueDate: string; // ISO string
  notes?: string;
  status: ProposalStatus;
  tasks: Task[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  type: 'proposal' | 'task';
  relatedId: string; // proposalId or taskId
  proposalId: string;
}