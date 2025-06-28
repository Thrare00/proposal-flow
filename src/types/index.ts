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

export const ProposalStatus = {
  INTAKE: 'intake' as const,
  OUTLINE: 'outline' as const,
  DRAFTING: 'drafting' as const,
  INTERNAL_REVIEW: 'internal_review' as const,
  FINAL_REVIEW: 'final_review' as const,
  SUBMITTED: 'submitted' as const
} as const;

export type ProposalStatusType = typeof ProposalStatus[keyof typeof ProposalStatus];

export interface Proposal {
  id: string;
  title: string;
  agency: string;
  dueDate: string; // ISO string
  notes?: string;
  status: ProposalStatusType;
  tasks: Task[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export const URGENCY_LEVELS = {
  Critical: 'critical' as const,
  High: 'high' as const,
  Medium: 'medium' as const,
  Low: 'low' as const
} as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];

export type CalendarEventType = 'proposal' | 'task' | 'custom';

export type ProposalType = 'federal' | 'state' | 'local' | 'commercial';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  type: CalendarEventType;
  relatedId: string; // proposalId, taskId, or customEventId
  proposalId: string;
}

export interface CustomCalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  description?: string;
  proposalId: string;
  pushNotification?: boolean;
  notificationTime?: string; // ISO string
  type: CalendarEventType;
  relatedId: string;
}