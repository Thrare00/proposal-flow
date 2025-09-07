/**
 * @typedef {Object} ProposalType
 * @property {'commercial'|'local_state'|'federal'} type
 * @property {string} description
 * @property {string[]} requirements
 * @property {(data: any) => boolean} validation
 */

export const PROPOSAL_TYPES = {
  commercial: {
    type: 'commercial',
    description: 'Commercial business proposals',
    requirements: ['business_plan', 'financials', 'market_analysis'],
    validation: (data) => data.business_plan && data.financials,
  },
  local_state: {
    type: 'local_state',
    description: 'State and local government proposals',
    requirements: ['regulatory_compliance', 'community_impact'],
    validation: (data) => data.regulatory_compliance,
  },
  federal: {
    type: 'federal',
    description: 'Federal government proposals',
    requirements: ['security_clearance', 'government_forms'],
    validation: (data) => data.security_clearance && data.government_forms,
  }
};

/**
 * @typedef {Object} UrgencyLevel
 * @property {'critical'|'high'|'medium'|'low'} level
 * @property {number} priority
 * @property {number} sla
 * @property {string} color
 */

export const URGENCY_LEVELS = {
  critical: {
    level: 'critical',
    priority: 1,
    sla: 24, // hours
    color: 'red',
  },
  high: {
    level: 'high',
    priority: 2,
    sla: 48,
    color: 'orange',
  },
  medium: {
    level: 'medium',
    priority: 3,
    sla: 72,
    color: 'yellow',
  },
  low: {
    level: 'low',
    priority: 4,
    sla: 168, // 1 week
    color: 'green',
  },
};

/**
 * @typedef {Object} FileMeta
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} size
 * @property {string} content
 * @property {string} uploadedAt
 * @property {Object.<string, any>} [metadata]
 * @property {{isValid: boolean, errors?: string[]}} [validationStatus]
 * @property {boolean} [isValid]
 * @property {string[]} [errors]
 */

/**
 * @typedef {Object} TaskStatus
 * @property {string} current
 * @property {number} progress
 * @property {string} lastUpdated
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} proposalId
 * @property {string} title
 * @property {string} [description]
 * @property {string} [owner]
 * @property {string} dueDate
 * @property {boolean} completed
 * @property {string} createdAt
 * @property {number} priority
 * @property {string[]} [dependencies]
 * @property {TaskStatus} status
 * @property {Object.<string, any>} [metadata]
 */

/**
 * @typedef {Object} ProposalStatus
 * @property {string} current
 * @property {number} progress
 * @property {string} lastUpdated
 */

/**
 * @typedef {Object} ProposalMetadata
 * @property {UrgencyLevel} urgency
 * @property {number} complexity
 * @property {number} estimatedHours
 * @property {string[]} teamMembers
 * @property {number} riskLevel
 */

/**
 * @typedef {Object} ValidationStatus
 * @property {boolean} overall
 * @property {string[]} errors
 * @property {string[]} warnings
 */

/**
 * @typedef {Object} Proposal
 * @property {string} id
 * @property {string} title
 * @property {string} agency
 * @property {string} dueDate
 * @property {string} status
 * @property {string} type
 * @property {string} [notes]
 * @property {Task[]} tasks
 * @property {FileMeta[]} files
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {ProposalMetadata} metadata
 * @property {ValidationStatus} validationStatus
 */

/**
 * @typedef {Object} CalendarEventStatus
 * @property {boolean} completed
 * @property {number} progress
 */

/**
 * @typedef {Object} CalendarEvent
 * @property {string} id
 * @property {string} title
 * @property {string} date
 * @property {'proposal'|'task'|'meeting'|'deadline'|'custom'} type
 * @property {string} [proposalId]
 * @property {string} [taskId]
 * @property {Object.<string, any>} [metadata]
 * @property {CalendarEventStatus} status
 * @property {string} [notificationTime]
 * @property {string} [relatedId]
 * @property {string} [description]
 * @property {boolean} [pushNotification]
 * @property {boolean} [notificationSent]
 */
