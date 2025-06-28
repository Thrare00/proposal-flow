export type ProposalStatus =
  | 'intake'
  | 'outline'
  | 'drafting'
  | 'internal_review'
  | 'final_review'
  | 'submitted';

export type ProposalStatusType = ProposalStatus;

export interface Proposal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  agency: string;
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