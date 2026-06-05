/**
 * @typedef {Object} ProposalType
 * @property {'commercial'|'state_local'|'federal'} type
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
  state_local: {
    type: 'state_local',
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
 * @property {PricingGovernance} [pricingGovernance]
 */

/**
 * @typedef {Object} PricingConstraint
 * @property {string} id
 * @property {string} lineItem
 * @property {'ceiling'|'floor'|'fixed'|'not_to_exceed'|'range'|'other'} constraintType
 * @property {string} description
 * @property {number|null} threshold
 * @property {string} unit
 * @property {string} source
 * @property {'open'|'met'|'violated'|'waived'} status
 * @property {string} notes
 */

/**
 * @typedef {Object} PricingAssumption
 * @property {string} id
 * @property {string} text
 * @property {boolean} validated
 * @property {string} validatedBy
 * @property {string|null} validatedAt
 * @property {string} notes
 */

/**
 * @typedef {Object} PricingGovernance
 * @property {PricingConstraint[]} constraints
 * @property {number|null} marginFloor
 * @property {string} riskAdjustmentNotes
 * @property {Object} bondInsurance
 * @property {Object} wageDetermination
 * @property {Object} taxEscalation
 * @property {PricingAssumption[]} assumptions
 * @property {'not_started'|'in_progress'|'approved'|'flagged'} reviewStatus
 * @property {string} reviewedBy
 * @property {string|null} reviewedAt
 * @property {string} notes
 */

// ── Pursuit Posture & Timing ─────────────────────────────────────────────────

/**
 * @typedef {'prime'|'subcontract'|'watch'|'pre_position'|'no_bid'|'either'} PursuitPosture
 */

/**
 * @typedef {'now'|'this_week'|'next_week'|'30_days'|'60_days'|'90_180'|'beyond'|'overdue'} TimingBucket
 */

/**
 * @typedef {Object} CaptureTiming
 * @property {PursuitPosture} pursuitPosture
 * @property {string}         pursuitBucket    - PURSUIT_BUCKETS id (urgent, active, etc.)
 * @property {TimingBucket}   timingBucket     - dashboard-oriented horizon id
 * @property {number|null}    daysOut
 * @property {string|null}    intentToBidDate
 * @property {string|null}    teamingStartDate
 * @property {string|null}    primeOutreachStartDate
 * @property {string|null}    primeOutreachEndDate
 * @property {Object}         recommendedWindow
 */

// ── Pre-Solicitation / Capture Foundation ────────────────────────────────────

/**
 * @typedef {'detected'|'qualifying'|'bid_review'|'capture_active'|'no_bid'|'awaiting_rfp'} OpportunityStage
 */

/**
 * @typedef {Object} BidNoBidScore
 * @property {number} incumbentStrength   - 1–5: incumbent entrenchment
 * @property {number} competitiveFit      - 1–5: fit to capabilities / service lanes
 * @property {number} pastPerformanceFit  - 1–5: past performance relevance
 * @property {number} teamingReadiness    - 1–5: teaming readiness (0=major gaps)
 * @property {number} pricingConfidence   - 1–5: PTW confidence
 * @property {number} strategicValue      - 1–5: pipeline / strategic value
 * @property {number} total               - computed 6–30
 * @property {number} pwin                - 0–100 Pwin estimate
 * @property {'bid'|'no_bid'|'conditional'} recommendation
 * @property {string} [rationale]
 */

/**
 * @typedef {Object} CaptureStakeholder
 * @property {string} role        - e.g. CO, COR, PM, OSDBU
 * @property {string} [name]
 * @property {string} [agency]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} PortalReadiness
 * @property {boolean} samActive
 * @property {boolean} portalIdentified
 * @property {boolean} credentialsConfirmed
 * @property {string}  [notes]
 */

/**
 * @typedef {Object} CaptureRecord
 * @property {string}           id
 * @property {string}           opportunityId         - SAM.gov notice ID or external ref
 * @property {string}           [proposalId]          - set when full Proposal is created
 * @property {OpportunityStage} stage
 * @property {string}           [solicitationNumber]
 * @property {string[]}         naicsCodes
 * @property {string[]}         pscCodes
 * @property {string}           [setAside]
 * @property {string}           [incumbentName]
 * @property {string}           [incumbentContractNumber]
 * @property {BidNoBidScore}    [bidNoBid]
 * @property {string[]}         winThemes
 * @property {string[]}         ghostingTargets       - incumbent weaknesses to contrast
 * @property {string[]}         teamingGaps           - capability gaps needing partners
 * @property {CaptureStakeholder[]} stakeholders
 * @property {PortalReadiness}  portalReadiness
 * @property {string}           [notes]
 * @property {string}           createdAt
 * @property {string}           updatedAt
 */

/**
 * Returns a blank CaptureRecord with safe defaults.
 * @param {string} opportunityId
 * @returns {CaptureRecord}
 */
export function createCaptureRecord(opportunityId) {
  const now = new Date().toISOString();
  return {
    id: `capture-${Date.now()}`,
    opportunityId,
    stage: 'detected',
    naicsCodes: [],
    pscCodes: [],
    winThemes: [],
    ghostingTargets: [],
    teamingGaps: [],
    stakeholders: [],
    portalReadiness: {
      samActive: false,
      portalIdentified: false,
      credentialsConfirmed: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Returns a blank BidNoBidScore.
 * @returns {BidNoBidScore}
 */
export function createBidNoBidScore() {
  return {
    incumbentStrength: 3,
    competitiveFit: 3,
    pastPerformanceFit: 3,
    teamingReadiness: 3,
    pricingConfidence: 3,
    strategicValue: 3,
    total: 18,
    pwin: 50,
    recommendation: 'conditional',
    rationale: '',
  };
}

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
