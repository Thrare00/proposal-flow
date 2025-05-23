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
  status: 'intake' | 'outline' | 'drafting' | 'internal_review' | 'final_review' | 'submitted';
  tasks: Task[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type CalendarEventType = 'proposal' | 'task' | 'custom';

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