// Pricing engine for Proposal Flow.
// Formula: price = base_price × travel_adj × condition_adj × rush_adj
// with margin-aware floor check: finalPrice ≥ max(computed, mobilizationMin, floorPrice, costFloor)
//
// Sub-scope service catalog covering Rare Earth Ltd's core trades.
// COGS integration provides cost-basis pricing with margin protection.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Load COGS data ──────────────────────────────────────────────────────────
let COGS = {};
try {
  COGS = JSON.parse(readFileSync(join(__dirname, 'data', 'cogs.json'), 'utf8'));
} catch (e) {
  console.warn('[pricing-engine] Could not load cogs.json, cost estimation disabled:', e.message);
}

// ── Sub-scope service catalog ────────────────────────────────────────────────
const SERVICES = {
  pressure_washing: {
    unit: 'sqft',
    baseRate: { min: 0.18, typical: 0.32, max: 0.55 },
    mobilizationMin: 185,
    floorPrice: 250,
    description: 'Soft-wash / pressure washing of exterior surfaces, driveways, walkways, building envelopes.',
    subScopes: {
      residential_driveway: {
        unit: 'job', baseRate: { min: 120, typical: 175, max: 250 },
        marketRange: { low: 150, high: 250 }, description: 'Residential driveway pressure wash',
      },
      house_exterior: {
        unit: 'sqft', baseRate: { min: 0.10, typical: 0.15, max: 0.25 },
        marketRange: { low: 0.10, high: 0.25 }, description: 'House exterior soft wash',
      },
      commercial_lot: {
        unit: 'sqft', baseRate: { min: 0.10, typical: 0.12, max: 0.15 },
        marketRange: { low: 0.10, high: 0.18 }, description: 'Commercial lot / parking structure wash',
      },
      roof_soft_wash: {
        unit: 'job', baseRate: { min: 500, typical: 700, max: 900 },
        marketRange: { low: 300, high: 900 }, description: 'Roof soft wash ($300/story market)',
      },
      deck_patio: {
        unit: 'job', baseRate: { min: 120, typical: 235, max: 350 },
        marketRange: { low: 120, high: 400 }, description: 'Deck / patio pressure wash',
      },
      fence_line: {
        unit: 'linear_ft', baseRate: { min: 0.40, typical: 0.80, max: 1.25 },
        marketRange: { low: 0.40, high: 1.50 }, description: 'Fence line pressure wash',
      },
      apartment_building: {
        unit: 'unit', baseRate: { min: 50, typical: 50, max: 75 },
        marketRange: { low: 40, high: 80 }, description: 'Apartment building exterior per unit',
      },
    },
  },
  property_preservation: {
    unit: 'property',
    baseRate: { min: 275, typical: 475, max: 850 },
    mobilizationMin: 125,
    floorPrice: 275,
    description: 'Lock change, initial secure, trash-out, lawn maintenance, winterization for GSEs / HUD FSM tickets.',
    subScopes: {
      grass_cut: {
        unit: 'job', baseRate: { min: 45, typical: 85, max: 125 },
        marketRange: { low: 45, high: 125 }, description: 'Initial / maintenance grass cut',
      },
      debris_removal: {
        unit: 'job', baseRate: { min: 175, typical: 340, max: 500 },
        marketRange: { low: 175, high: 600 }, description: 'Debris removal / trash-out',
      },
      board_up: {
        unit: 'opening', baseRate: { min: 65, typical: 110, max: 150 },
        marketRange: { low: 65, high: 175 }, description: 'Board-up per opening (window/door)',
      },
      lock_change: {
        unit: 'job', baseRate: { min: 45, typical: 65, max: 85 },
        marketRange: { low: 45, high: 95 }, description: 'Lock change / rekey',
      },
      winterization: {
        unit: 'job', baseRate: { min: 85, typical: 130, max: 175 },
        marketRange: { low: 85, high: 200 }, description: 'Winterization (dry / wet)',
      },
      mold_treatment: {
        unit: 'job', baseRate: { min: 250, typical: 625, max: 1000 },
        marketRange: { low: 250, high: 1200 }, description: 'Mold treatment / remediation',
      },
      roof_tarp: {
        unit: 'job', baseRate: { min: 175, typical: 300, max: 425 },
        marketRange: { low: 175, high: 500 }, description: 'Emergency roof tarp install',
      },
      pool_securing: {
        unit: 'job', baseRate: { min: 125, typical: 240, max: 350 },
        marketRange: { low: 125, high: 400 }, description: 'Pool securing / cover / drain',
      },
    },
  },
  restriping: {
    unit: 'stall',
    baseRate: { min: 8, typical: 14, max: 28 },
    mobilizationMin: 450,
    floorPrice: 850,
    description: 'Parking-lot line striping, ADA compliance striping, directional arrows, fire-lane markings.',
    subScopes: {
      per_stall: {
        unit: 'stall', baseRate: { min: 8, typical: 9, max: 10 },
        marketRange: { low: 8, high: 12 }, description: 'Per-stall striping',
      },
      ada_symbol: {
        unit: 'each', baseRate: { min: 40, typical: 80, max: 125 },
        marketRange: { low: 40, high: 150 }, description: 'ADA symbol / van-accessible stall',
      },
      full_lot: {
        unit: 'lot', baseRate: { min: 1500, typical: 3250, max: 5000 },
        marketRange: { low: 1500, high: 6000 }, description: 'Full lot re-stripe',
      },
      speed_bump: {
        unit: 'each', baseRate: { min: 250, typical: 425, max: 600 },
        marketRange: { low: 250, high: 700 }, description: 'Speed bump paint / install',
      },
    },
  },
  aggregates: {
    unit: 'ton',
    baseRate: { min: 18, typical: 30, max: 42 },
    mobilizationMin: 2700,
    floorPrice: 5000,
    description: 'Recycled aggregates for public works and infrastructure. Rip rap, crushed stone, crusher run.',
    subScopes: {
      rip_rap: {
        unit: 'ton', baseRate: { min: 38, typical: 42, max: 48 },
        marketRange: { low: 32, high: 45 }, description: 'GDOT Type 3 Rip Rap',
      },
      crushed_stone_57: {
        unit: 'ton', baseRate: { min: 24, typical: 26, max: 32 },
        marketRange: { low: 20, high: 32 }, description: 'ASTM #57 Crushed Stone',
      },
      crusher_run: {
        unit: 'ton', baseRate: { min: 16, typical: 18, max: 22 },
        marketRange: { low: 14, high: 22 }, description: 'Crusher Run Granite GAB',
      },
      crushed_stone_34: {
        unit: 'ton', baseRate: { min: 28, typical: 30, max: 35 },
        marketRange: { low: 25, high: 35 }, description: '#34 Crushed Stone',
      },
    },
  },
  multifamily: {
    unit: 'unit',
    baseRate: { min: 150, typical: 275, max: 450 },
    mobilizationMin: 250,
    floorPrice: 350,
    description: 'Multifamily property maintenance: unit turns, common-area cleaning, grounds, trash-outs.',
    subScopes: {
      unit_turn: {
        unit: 'unit', baseRate: { min: 150, typical: 250, max: 400 },
        marketRange: { low: 125, high: 400 }, description: 'Full unit turn deep clean',
      },
      common_area_wash: {
        unit: 'sqft', baseRate: { min: 0.08, typical: 0.12, max: 0.18 },
        marketRange: { low: 0.08, high: 0.20 }, description: 'Walkways, breezeways, pool decks',
      },
      trash_out: {
        unit: 'unit', baseRate: { min: 300, typical: 500, max: 800 },
        marketRange: { low: 250, high: 900 }, description: 'Full unit cleanout / trash-out',
      },
      grounds_maintenance: {
        unit: 'visit', baseRate: { min: 200, typical: 350, max: 600 },
        marketRange: { low: 150, high: 600 }, description: 'Grounds maintenance per visit',
      },
      make_ready: {
        unit: 'unit', baseRate: { min: 200, typical: 400, max: 700 },
        marketRange: { low: 175, high: 750 }, description: 'Make-ready repairs (drywall, paint, fixtures)',
      },
    },
  },
};

// ── Adjusters (user-requested values) ────────────────────────────────────────
const ADJUSTERS = {
  travel: {
    local:    { maxMiles: 20,       factor: 1.00 },
    near:     { maxMiles: 35,       factor: 1.10 },
    mid:      { maxMiles: 50,       factor: 1.25 },
    far:      { maxMiles: 150,      factor: 1.42 },
    remote:   { maxMiles: Infinity, factor: 1.65 },
  },
  condition: {
    light:     { factor: 1.00, notes: 'Light / typical wear.' },
    moderate:  { factor: 1.20, notes: 'Moderate soil / repair scope.' },
    heavy:     { factor: 1.50, notes: 'Heavy soil, distressed, or vacant; PPE upgrade.' },
    hazardous: { factor: 1.70, notes: 'Bio/chem hazards or restricted site — HAZWOPER crew.' },
  },
  rush: {
    standard:  { factor: 1.00, notes: 'Standard lead time.' },
    '48hr':    { factor: 1.25, notes: '48-hour turnaround.' },
    same_day:  { factor: 1.50, notes: 'Same-day dispatch.' },
  },
};

// ── Market benchmarks (2025–2026 data) ───────────────────────────────────────
export const MARKET_BENCHMARKS = {
  pressure_washing: {
    thumbtack: { low: 0.20, median: 0.35, high: 0.65, unit: 'sqft' },
    angi:      { low: 0.15, median: 0.30, high: 0.50, unit: 'sqft' },
    note: 'Commercial/residential exterior soft-wash. Gutter cleaning typically billed separately.',
  },
  property_preservation: {
    hud_fsm:   { low: 285, median: 440, high: 775, unit: 'SFR initial secure + trash-out' },
    gsa:       { low: 350, median: 525, high: 900, unit: 'federal per-property' },
    note: 'HUD FSM line-item caps define ceilings for GSE work. GSA typically higher on federal sites.',
  },
  restriping: {
    thumbtack: { low: 8,  median: 14, high: 22, unit: 'stall' },
    angi:      { low: 9,  median: 16, high: 25, unit: 'stall' },
    gsa:       { low: 11, median: 18, high: 30, unit: 'stall' },
    note: 'Federal lots include ADA van-accessible stalls priced separately ($45-$85 each).',
  },
  aggregates: {
    supplier_quote: { low: 15, median: 26, high: 42, unit: 'ton' },
    note: 'Metro Atlanta supplier rates (Metro Green, Midsouth Aggs, Martin Marietta). Delivery $2,700/load.',
  },
  multifamily: {
    thumbtack: { low: 150, median: 275, high: 450, unit: 'unit turn' },
    note: 'Unit turn pricing varies by condition. Trash-outs priced separately. Common area wash per sqft.',
  },
};

// ── Helper: parse service key ────────────────────────────────────────────────
// Accepts "pressure_washing.roof_soft_wash" or bare "pressure_washing"
function parseServiceKey(key) {
  const str = String(key || '');
  const dotIdx = str.indexOf('.');
  if (dotIdx === -1) return { service: str, subScope: null };
  return { service: str.slice(0, dotIdx), subScope: str.slice(dotIdx + 1) };
}

// ── Adjuster pickers ─────────────────────────────────────────────────────────
function pickTravelTier(miles) {
  const m = Number(miles) || 0;
  const tiers = ADJUSTERS.travel;
  if (m <= tiers.local.maxMiles) return { key: 'local', factor: tiers.local.factor };
  if (m <= tiers.near.maxMiles) return { key: 'near', factor: tiers.near.factor };
  if (m <= tiers.mid.maxMiles) return { key: 'mid', factor: tiers.mid.factor };
  if (m <= tiers.far.maxMiles) return { key: 'far', factor: tiers.far.factor };
  return { key: 'remote', factor: tiers.remote.factor };
}

function pickConditionTier(condition) {
  const c = String(condition || 'light').toLowerCase();
  // Backward compatibility: map old tier names to new
  const aliasMap = { standard: 'light', heavy: 'heavy', distressed: 'heavy', hazardous: 'hazardous' };
  const mapped = aliasMap[c] || c;
  return ADJUSTERS.condition[mapped]
    ? { key: mapped, ...ADJUSTERS.condition[mapped] }
    : { key: 'light', ...ADJUSTERS.condition.light };
}

function pickRushTier(leadDays) {
  if (leadDays == null) return { key: 'standard', ...ADJUSTERS.rush.standard };
  const d = Number(leadDays);
  if (d < 1) return { key: 'same_day', ...ADJUSTERS.rush.same_day };
  if (d <= 2) return { key: '48hr', ...ADJUSTERS.rush['48hr'] };
  return { key: 'standard', ...ADJUSTERS.rush.standard };
}

// ── COGS estimation ──────────────────────────────────────────────────────────
// Returns estimated job cost from cogs.json data
export function estimateJobCost(service, subScope, qty, miles) {
  if (!COGS.labor) return null;

  const labor = COGS.labor;
  const overhead = COGS.overhead || {};
  const supplies = COGS.supplies?.[service] || {};

  // Estimate labor hours based on service type
  const crewSize = labor.crew_size_default || 2;
  let laborHours = crewSize * 2; // default 2hrs per crew member

  // Sub-scope-specific labor estimates (hours per crew member)
  const laborEstimates = {
    pressure_washing: {
      residential_driveway: 1.5, house_exterior: 3, commercial_lot: 4,
      roof_soft_wash: 4, deck_patio: 2, fence_line: 2.5, apartment_building: 1,
    },
    property_preservation: {
      grass_cut: 1.5, debris_removal: 3, board_up: 1, lock_change: 0.75,
      winterization: 2, mold_treatment: 4, roof_tarp: 3, pool_securing: 2,
    },
    restriping: {
      per_stall: 0.1, ada_symbol: 0.5, full_lot: 8, speed_bump: 1.5,
    },
  };

  if (laborEstimates[service]?.[subScope]) {
    laborHours = crewSize * laborEstimates[service][subScope];
  }

  // For per-unit items, scale labor with quantity
  const qtyMultiplier = subScope && ['per_stall', 'apartment_building', 'board_up'].includes(subScope)
    ? Math.max(1, qty || 1)
    : 1;

  const laborCost = laborHours * qtyMultiplier * labor.base_hourly * labor.burden_multiplier;

  // Material cost estimate
  let materialCost = 0;
  if (service === 'pressure_washing') {
    materialCost = (supplies.chemicals_soft_wash_per_job || 25) + (supplies.equipment_maintenance_per_job || 40);
  } else if (service === 'property_preservation') {
    if (subScope === 'lock_change') materialCost = (supplies.lockset?.min || 28);
    else if (subScope === 'board_up') materialCost = (supplies.board_up_sheet || 22) * (qty || 1);
    else if (subScope === 'winterization') materialCost = (supplies.antifreeze_per_gal || 12) * 3;
    else if (subScope === 'roof_tarp') materialCost = supplies.tarp_per_roll || 45;
    else if (subScope === 'debris_removal') materialCost = (supplies.trash_bags_per_bundle || 8) * 3;
    else materialCost = 20;
  } else if (service === 'restriping') {
    if (subScope === 'full_lot') materialCost = (supplies.paint_per_5gal || 85) * 3 + (supplies.reflective_beads_per_lb || 3.50) * 20;
    else if (subScope === 'ada_symbol') materialCost = (supplies.ada_stencil || 15) + (supplies.paint_per_5gal || 85) * 0.2;
    else materialCost = (supplies.paint_per_5gal || 85) * 0.1 * (qty || 1);
  }

  // Travel cost
  const fuelCost = (Number(miles) || 0) * 2 * (COGS.supplies?.pressure_washing?.fuel_per_mile || 0.58);

  // Per-job overhead
  const perJobOverhead = (overhead.insurance_per_job || 35) + (overhead.vehicle_per_job || 25) + (overhead.admin_per_job || 15);

  const totalCost = laborCost + materialCost + fuelCost + perJobOverhead;

  return {
    laborCost: Number(laborCost.toFixed(2)),
    laborHours: Number((laborHours * qtyMultiplier).toFixed(1)),
    materialCost: Number(materialCost.toFixed(2)),
    fuelCost: Number(fuelCost.toFixed(2)),
    perJobOverhead: Number(perJobOverhead.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    marginTarget: overhead.target_margin_pct || 0.20,
    costFloor: Number((totalCost / (1 - (overhead.target_margin_pct || 0.20))).toFixed(2)),
  };
}

// ── Price a single line item ─────────────────────────────────────────────────
// inputs: { service, quantity, rateTier: 'min'|'typical'|'max', miles, condition, leadDays }
// service can be "pressure_washing" (uses top-level) or "pressure_washing.roof_soft_wash" (sub-scope)
export function priceLineItem(inputs = {}) {
  const { service: svcKey, subScope } = parseServiceKey(inputs.service);
  const serviceDef = SERVICES[svcKey];
  if (!serviceDef) {
    return { error: `Unknown service: ${inputs.service}`, supportedServices: Object.keys(SERVICES) };
  }

  // Resolve rate source: sub-scope or top-level
  let rateSrc = serviceDef;
  let resolvedSubScope = subScope;
  if (subScope && serviceDef.subScopes?.[subScope]) {
    rateSrc = serviceDef.subScopes[subScope];
  } else if (subScope) {
    return {
      error: `Unknown sub-scope: ${subScope} for ${svcKey}`,
      supportedSubScopes: Object.keys(serviceDef.subScopes || {}),
    };
  }

  const rateTier = ['min', 'typical', 'max'].includes(inputs.rateTier) ? inputs.rateTier : 'typical';
  const qty = Math.max(0, Number(inputs.quantity) || 0);
  const base = rateSrc.baseRate[rateTier] * qty;

  const travel = pickTravelTier(inputs.miles);
  const condition = pickConditionTier(inputs.condition);
  const rush = pickRushTier(inputs.leadDays);

  const raw = base * travel.factor * condition.factor * rush.factor;

  // COGS estimation
  const jobCost = estimateJobCost(svcKey, resolvedSubScope, qty, inputs.miles);
  const costFloor = jobCost ? jobCost.costFloor : 0;

  // Floor checks: mobilization minimum, absolute floor, AND cost floor (margin-aware)
  const floorChecked = Math.max(raw, serviceDef.mobilizationMin, serviceDef.floorPrice, costFloor);
  const flooredApplied = floorChecked > raw;

  const result = {
    service: svcKey,
    subScope: resolvedSubScope,
    unit: rateSrc.unit || serviceDef.unit,
    quantity: qty,
    rateTier,
    baseRate: rateSrc.baseRate[rateTier],
    baseSubtotal: Number(base.toFixed(2)),
    adjusters: { travel, condition, rush },
    computedPrice: Number(raw.toFixed(2)),
    floorPrice: serviceDef.floorPrice,
    mobilizationMin: serviceDef.mobilizationMin,
    costFloor,
    finalPrice: Number(floorChecked.toFixed(2)),
    flooredApplied,
    benchmarks: MARKET_BENCHMARKS[svcKey] || null,
  };

  if (rateSrc.marketRange) {
    result.subScopeMarketRange = rateSrc.marketRange;
  }
  if (jobCost) {
    result.costEstimate = jobCost;
  }

  return result;
}

// ── Price a full scope ───────────────────────────────────────────────────────
export function priceScope(lineItems = []) {
  const lines = (Array.isArray(lineItems) ? lineItems : []).map(priceLineItem);
  const subtotal = lines.reduce((sum, l) => sum + (Number(l.finalPrice) || 0), 0);
  return {
    lines,
    subtotal: Number(subtotal.toFixed(2)),
    generatedAt: new Date().toISOString(),
  };
}

// ── Human-readable pricing narrative ─────────────────────────────────────────
export function formatPricingNarrative(quote) {
  if (!quote || !Array.isArray(quote.lines) || quote.lines.length === 0) {
    return 'No pricing line items provided. Scope-driven pricing pending.';
  }
  const parts = quote.lines.map((l) => {
    const adj = l.adjusters || {};
    const flr = l.flooredApplied ? ` (floor applied)` : '';
    const scope = l.subScope ? `${l.service}.${l.subScope}` : l.service;
    let line = `- **${scope}** ${l.quantity} ${l.unit} @ $${l.baseRate}/${l.unit} × travel[${adj.travel?.key}:${adj.travel?.factor}] × condition[${adj.condition?.key}:${adj.condition?.factor}] × rush[${adj.rush?.key}:${adj.rush?.factor}] = **$${l.finalPrice.toLocaleString()}**${flr}`;
    if (l.costEstimate) {
      line += `\n  _COGS: labor $${l.costEstimate.laborCost} (${l.costEstimate.laborHours}hrs) + materials $${l.costEstimate.materialCost} + fuel $${l.costEstimate.fuelCost} + overhead $${l.costEstimate.perJobOverhead} = $${l.costEstimate.totalCost} cost → $${l.costEstimate.costFloor} floor (${Math.round(l.costEstimate.marginTarget * 100)}% margin)_`;
    }
    return line;
  });
  parts.push(`\n**Subtotal: $${quote.subtotal.toLocaleString()}**`);
  return parts.join('\n');
}

// ── Win/loss insight ─────────────────────────────────────────────────────────
export function getWinLossInsight(service) {
  let log = { entries: [] };
  try {
    log = JSON.parse(readFileSync(join(__dirname, 'data', 'win-loss-log.json'), 'utf8'));
  } catch { return null; }

  const relevant = log.entries.filter(e => e.service === service);
  if (relevant.length < 2) return null;

  const wins = relevant.filter(e => e.outcome === 'win');
  const winRate = wins.length / relevant.length;
  const avgWinBid = wins.length > 0
    ? wins.reduce((s, e) => s + (e.awardAmount || e.bidAmount), 0) / wins.length
    : null;

  return {
    service,
    totalBids: relevant.length,
    wins: wins.length,
    winRate: Number(winRate.toFixed(2)),
    avgWinBid: avgWinBid ? Number(avgWinBid.toFixed(2)) : null,
    advisory: winRate >= 0.5
      ? `Strong win rate (${Math.round(winRate * 100)}%) on ${service} — current pricing strategy is effective.`
      : `Below 50% win rate on ${service} (${Math.round(winRate * 100)}%) — consider adjusting bid competitiveness.`,
  };
}

export const PRICING_SERVICES = SERVICES;
export const PRICING_ADJUSTERS = ADJUSTERS;
