export type ProposalStatus =
  | 'intake'
  | 'outline'
  | 'drafting'
  | 'internal_review'
  | 'final_review'
  | 'submitted';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
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
}

export interface FileMeta {
  id: string;
  filename: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
}