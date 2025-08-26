// Urgency levels for proposal deadlines
export const URGENCY_LEVELS = {
  critical: {
    days: 2,
    color: 'red',
    label: 'Critical',
  },
  high: {
    days: 5,
    color: 'orange',
    label: 'High',
  },
  medium: {
    days: 10,
    color: 'yellow',
    label: 'Medium',
  },
  low: {
    days: 30,
    color: 'green',
    label: 'Low',
  },
  none: {
    days: 1000, // Arbitrarily large number
    color: 'gray',
    label: 'No Deadline',
  },
};

// Proposal status types
export const PROPOSAL_STATUS = {
  INTAKE: 'intake',
  OUTLINE: 'outline',
  DRAFTING: 'drafting',
  INTERNAL_REVIEW: 'internal_review',
  FINAL_REVIEW: 'final_review',
  SUBMITTED: 'submitted',
};

// Task status types
export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
};

// Urgency level types
export const URGENCY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none',
};
