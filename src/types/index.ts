import { ProposalStatus } from '../types';

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