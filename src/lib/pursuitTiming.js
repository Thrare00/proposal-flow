export const PURSUIT_BUCKETS = [
  {
    id: 'urgent',
    label: 'Urgent',
    description: '0 to 14 days, immediate bid/no-bid and outreach.',
    minDays: 0,
    maxDays: 14,
    tone: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    id: 'active',
    label: 'Active',
    description: '15 to 45 days, active capture and teaming execution.',
    minDays: 15,
    maxDays: 45,
    tone: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'pre_position',
    label: 'Pre-position',
    description: '46 to 120 days, shape requirements and line up partners.',
    minDays: 46,
    maxDays: 120,
    tone: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'strategic_watch',
    label: 'Strategic Watch',
    description: '121 to 180 days, monitor, map contacts, and prepare the approach.',
    minDays: 121,
    maxDays: 180,
    tone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'future',
    label: 'Future',
    description: 'More than 180 days out, keep light watch only.',
    minDays: 181,
    maxDays: Number.POSITIVE_INFINITY,
    tone: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  {
    id: 'closed',
    label: 'Closed',
    description: 'Due date has passed.',
    minDays: Number.NEGATIVE_INFINITY,
    maxDays: -1,
    tone: 'bg-slate-200 text-slate-700 border-slate-300',
  },
];

export const PURSUIT_POSTURES = [
  { value: 'prime', label: 'Prime' },
  { value: 'subcontract', label: 'Subcontract' },
  { value: 'watch', label: 'Watch' },
  { value: 'pre_position', label: 'Pre-position' },
  { value: 'no_bid', label: 'No Bid' },
  { value: 'either', label: 'Either' },
];

const POSTURE_ALIAS_MAP = Object.freeze({ sub: 'subcontract' });
const VALID_POSTURES = new Set(PURSUIT_POSTURES.map((p) => p.value));

export function normalizePosture(value) {
  if (typeof value !== 'string') return 'either';
  const key = value.toLowerCase().trim();
  const resolved = POSTURE_ALIAS_MAP[key] || key;
  return VALID_POSTURES.has(resolved) ? resolved : 'either';
}

function startOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysUntilDate(value, now = new Date()) {
  if (!value) return null;
  const due = startOfDay(value);
  const today = startOfDay(now);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function getPursuitBucket(daysOut) {
  if (!Number.isFinite(daysOut)) {
    return PURSUIT_BUCKETS[0];
  }
  return PURSUIT_BUCKETS.find((bucket) => daysOut >= bucket.minDays && daysOut <= bucket.maxDays) || PURSUIT_BUCKETS[0];
}

// Dashboard-oriented timing horizons for capture management views.
export const DASHBOARD_HORIZONS = [
  { id: 'overdue',   label: 'Overdue',       minDays: null,  maxDays: -1,   tone: 'bg-red-600 text-white border-red-700' },
  { id: 'now',       label: 'Now',           minDays: 0,     maxDays: 0,    tone: 'bg-red-100 text-red-900 border-red-300' },
  { id: 'this_week', label: 'This Week',     minDays: 1,     maxDays: 7,    tone: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: 'next_week', label: 'Next Week',     minDays: 8,     maxDays: 14,   tone: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: '30_days',   label: '30 Days',       minDays: 15,    maxDays: 30,   tone: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
  { id: '60_days',   label: '60 Days',       minDays: 31,    maxDays: 60,   tone: 'bg-blue-50 text-blue-900 border-blue-200' },
  { id: '90_180',    label: '90-180 Days',   minDays: 61,    maxDays: 180,  tone: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  { id: 'beyond',    label: '180+ Days',     minDays: 181,   maxDays: null, tone: 'bg-gray-50 text-gray-700 border-gray-200' },
];

export function getDashboardHorizon(daysOut) {
  if (daysOut === null || daysOut === undefined) return null;
  return DASHBOARD_HORIZONS.find((h) => {
    const lo = h.minDays ?? Number.NEGATIVE_INFINITY;
    const hi = h.maxDays ?? Number.POSITIVE_INFINITY;
    return daysOut >= lo && daysOut <= hi;
  }) || null;
}

export function bucketProposalsByHorizon(proposals) {
  const buckets = {};
  for (const h of DASHBOARD_HORIZONS) buckets[h.id] = [];
  const noBucket = [];
  for (const p of proposals) {
    const days = daysUntilDate(p.dueDate);
    const h = getDashboardHorizon(days);
    if (h) buckets[h.id].push(p);
    else noBucket.push(p);
  }
  return { buckets, noBucket };
}

export function getRecommendedWindows(dueDate, rawPosture = 'either') {
  const pursuitPosture = normalizePosture(rawPosture);
  const due = dueDate ? startOfDay(dueDate) : null;
  if (!due) {
    return {
      dueDate: null,
      intentToBidDate: null,
      teamingStartDate: null,
      primeOutreachStartDate: null,
      primeOutreachEndDate: null,
      bucket: 'urgent',
      timingBucket: 'now',
      daysOut: null,
      pursuitPosture,
      recommendation: 'Set a due date to calculate pursuit timing.',
    };
  }

  const daysOut = daysUntilDate(due);
  const bucket = getPursuitBucket(daysOut);
  const horizon = getDashboardHorizon(daysOut);

  const shift = (days) => {
    const copy = new Date(due);
    copy.setDate(copy.getDate() - days);
    return copy.toISOString().slice(0, 10);
  };

  const isSub = pursuitPosture === 'subcontract';
  const intentLead = isSub ? 10 : 14;
  const teamingLead = pursuitPosture === 'prime' ? 45 : 60;
  const outreachStartLead = isSub ? 90 : 75;
  const outreachEndLead = isSub ? 30 : 45;

  let recommendation = 'Advance capture planning and keep the record warm.';
  if (pursuitPosture === 'no_bid') recommendation = 'Marked no-bid. Review periodically if conditions change.';
  else if (pursuitPosture === 'watch') recommendation = 'Watching only. Monitor for teaming or recompete opportunities.';
  else if (bucket.id === 'urgent') recommendation = 'Treat as immediate response. Confirm bid posture and send outreach now.';
  else if (bucket.id === 'active') recommendation = 'Work active capture, pricing, and partner follow-up this week.';
  else if (bucket.id === 'pre_position') recommendation = 'Use this window to shape teaming, intent, and customer touchpoints.';
  else if (bucket.id === 'strategic_watch') recommendation = 'Track as pre-bid positioning. Start contact mapping and partner targeting early.';
  else if (bucket.id === 'future') recommendation = 'Monitor lightly until it moves into the 180-day active horizon.';
  else if (bucket.id === 'closed') recommendation = 'Due date has passed. Confirm whether this is still actionable.';

  return {
    dueDate: due.toISOString().slice(0, 10),
    intentToBidDate: shift(intentLead),
    teamingStartDate: shift(teamingLead),
    primeOutreachStartDate: shift(outreachStartLead),
    primeOutreachEndDate: shift(outreachEndLead),
    bucket: bucket.id,
    timingBucket: horizon?.id || 'now',
    daysOut,
    pursuitPosture,
    recommendation,
  };
}
