// Seed bid history from Eric's actual proposals and estimates
// Run: node server/db/seed-bids.js

import { insertBid, upsertRateCard, insertMarketRate, insertBidBulk } from './pricing-db.js';

// ── Bid History from actual proposals ───────────────────────────────────────
const bids = [
  // Fulton County - Recycled Gravel ($198K contract, WON)
  {
    proposal_id: 'fulton-gravel-2024', client_name: 'Fulton County Public Works',
    service: 'aggregates', sub_scope: 'rip_rap',
    property_type: 'government', sqft: null, unit_count: null,
    quantity: 500, unit: 'ton', unit_cost: 42,
    bid_amount: 21000, cost_amount: 18250, profit: 2750, margin_pct: 0.13,
    overhead_pct: 0, profit_pct: 0.13,
    zip: '30303', city: 'Atlanta', state: 'GA', distance_miles: 15,
    outcome: 'win', client_type: 'government',
    notes: 'GDOT Type 3 Rip Rap via Midsouth Aggs. $36.50/ton cost, sold at $42/ton.',
    bid_date: '2024-06-01',
  },
  {
    proposal_id: 'fulton-gravel-2024', client_name: 'Fulton County Public Works',
    service: 'aggregates', sub_scope: 'crushed_stone_57',
    property_type: 'government', sqft: null, unit_count: null,
    quantity: 1300, unit: 'ton', unit_cost: 26,
    bid_amount: 33800, cost_amount: 31200, profit: 2600, margin_pct: 0.08,
    overhead_pct: 0, profit_pct: 0.08,
    zip: '30303', city: 'Atlanta', state: 'GA', distance_miles: 15,
    outcome: 'win', client_type: 'government',
    notes: 'ASTM #57 Crushed Stone via Metro Green. $24/ton cost, sold at $26/ton.',
    bid_date: '2024-06-01',
  },
  {
    proposal_id: 'fulton-gravel-2024', client_name: 'Fulton County Public Works',
    service: 'aggregates', sub_scope: 'crusher_run',
    property_type: 'government', sqft: null, unit_count: null,
    quantity: 400, unit: 'ton', unit_cost: 18,
    bid_amount: 7200, cost_amount: 6000, profit: 1200, margin_pct: 0.17,
    overhead_pct: 0, profit_pct: 0.17,
    zip: '30303', city: 'Atlanta', state: 'GA', distance_miles: 15,
    outcome: 'win', client_type: 'government',
    notes: 'Crusher Run Granite GAB via Metro Green. $15/ton cost, sold at $18/ton.',
    bid_date: '2024-06-01',
  },
  {
    proposal_id: 'fulton-gravel-2024', client_name: 'Fulton County Public Works',
    service: 'aggregates', sub_scope: 'crushed_stone_34',
    property_type: 'government', sqft: null, unit_count: null,
    quantity: 1000, unit: 'ton', unit_cost: 30,
    bid_amount: 30000, cost_amount: 28000, profit: 2000, margin_pct: 0.07,
    overhead_pct: 0, profit_pct: 0.07,
    zip: '30303', city: 'Atlanta', state: 'GA', distance_miles: 15,
    outcome: 'win', client_type: 'government',
    notes: '#34 Crushed Stone via Metro Green. $28/ton cost, sold at $30/ton.',
    bid_date: '2024-06-01',
  },

  // Prescott Construction - Property Preservation (Macon + Columbus, WON)
  {
    proposal_id: 'prescott-macon-2025', client_name: 'Prescott Construction',
    service: 'property_preservation', sub_scope: 'board_up',
    property_type: 'multifamily', sqft: null, unit_count: 28,
    quantity: 28, unit: 'door', unit_cost: 150,
    bid_amount: 4200, cost_amount: 2916, profit: 1284, margin_pct: 0.31,
    overhead_pct: 0.06, profit_pct: 0.30,
    zip: '31206', city: 'Macon', state: 'GA', distance_miles: 85,
    outcome: 'win', client_type: 'contractor',
    notes: 'HUD Spec board-up. Materials $57/door, labor 2 workers x 3 days at $150/day.',
    bid_date: '2025-03-01',
  },
  {
    proposal_id: 'prescott-macon-2025', client_name: 'Prescott Construction',
    service: 'property_preservation', sub_scope: 'debris_removal',
    property_type: 'multifamily', sqft: null, unit_count: null,
    quantity: 1, unit: 'job', unit_cost: 520,
    bid_amount: 520, cost_amount: 520, profit: 0, margin_pct: 0,
    overhead_pct: 0, profit_pct: 0,
    zip: '31206', city: 'Macon', state: 'GA', distance_miles: 85,
    outcome: 'win', client_type: 'contractor',
    notes: '30 yard dumpster rental, 7-day.',
    bid_date: '2025-03-01',
  },
  {
    proposal_id: 'prescott-macon-2025', client_name: 'Prescott Construction',
    service: 'property_preservation', sub_scope: 'grass_cut',
    property_type: 'multifamily', sqft: null, unit_count: null,
    quantity: 1, unit: 'job', unit_cost: 400,
    bid_amount: 400, cost_amount: 280, profit: 120, margin_pct: 0.30,
    overhead_pct: 0, profit_pct: 0.30,
    zip: '31206', city: 'Macon', state: 'GA', distance_miles: 85,
    outcome: 'win', client_type: 'contractor',
    notes: 'One-time lawn maintenance, overgrown lot.',
    bid_date: '2025-03-01',
  },
  {
    proposal_id: 'prescott-columbus-2025', client_name: 'Prescott Construction',
    service: 'property_preservation', sub_scope: 'board_up',
    property_type: 'multifamily', sqft: null, unit_count: 26,
    quantity: 26, unit: 'door', unit_cost: 150,
    bid_amount: 3900, cost_amount: 2622, profit: 1278, margin_pct: 0.33,
    overhead_pct: 0.06, profit_pct: 0.33,
    zip: '31907', city: 'Columbus', state: 'GA', distance_miles: 107,
    outcome: 'win', client_type: 'contractor',
    notes: 'HUD Spec board-up Columbus property. 214mi RT mileage.',
    bid_date: '2025-03-01',
  },

  // GSU Pressure Washing Bid
  {
    proposal_id: 'gsu-pw-2025', client_name: 'Georgia State University',
    service: 'pressure_washing', sub_scope: 'commercial_lot',
    property_type: 'commercial', sqft: 118955, unit_count: null,
    quantity: 118955, unit: 'sqft', unit_cost: 0.14,
    bid_amount: 16653.70, cost_amount: null, profit: null, margin_pct: null,
    overhead_pct: null, profit_pct: null,
    zip: '30303', city: 'Atlanta', state: 'GA', distance_miles: 10,
    outcome: 'pending', client_type: 'government',
    notes: 'Student Center West. $0.14/sqft PW + $50/hr spot cleaning. 146 buildings total on building list.',
    bid_date: '2025-02-01',
  },

  // Costco Parking Lot
  {
    proposal_id: 'costco-pw-2025', client_name: 'SEI / Costco',
    service: 'pressure_washing', sub_scope: 'commercial_lot',
    property_type: 'commercial', sqft: 54922, unit_count: null,
    quantity: 54922, unit: 'sqft', unit_cost: 0.05,
    bid_amount: 4416.18, cost_amount: 3390.60, profit: 1025.58, margin_pct: 0.23,
    overhead_pct: 0.06, profit_pct: 0.138,
    zip: null, city: 'Atlanta', state: 'GA', distance_miles: 20,
    outcome: 'pending', client_type: 'commercial',
    notes: 'Parking lot PW. Labor $0.05/sqft, tools $180, drain socks $276, bleach 55gal, gas.',
    bid_date: '2025-01-15',
  },

  // ABC Leasing
  {
    proposal_id: 'abc-leasing-2025', client_name: 'ABC Leasing Enterprises LLC',
    service: 'pressure_washing', sub_scope: 'commercial_lot',
    property_type: 'commercial', sqft: 5026, unit_count: null,
    quantity: 5026, unit: 'sqft', unit_cost: 0.08,
    bid_amount: 2577.85, cost_amount: 2062.28, profit: 515.57, margin_pct: 0.20,
    overhead_pct: 0.10, profit_pct: 0.15,
    zip: null, city: 'Atlanta', state: 'GA', distance_miles: 15,
    outcome: 'pending', client_type: 'commercial',
    notes: 'Concrete cleaning. Man hour $50, SQFT $0.08, mob $500.',
    bid_date: '2025-01-20',
  },

  // Kings Market
  {
    proposal_id: 'kings-market-2025', client_name: 'Kings Market',
    service: 'pressure_washing', sub_scope: 'house_exterior',
    property_type: 'commercial', sqft: 275294, unit_count: null,
    quantity: 275294, unit: 'sqft', unit_cost: 0.10,
    bid_amount: 33563.28, cost_amount: 27969.40, profit: 5593.88, margin_pct: 0.17,
    overhead_pct: 0.05, profit_pct: 0.15,
    zip: null, city: 'Atlanta', state: 'GA', distance_miles: 20,
    outcome: 'pending', client_type: 'commercial',
    notes: 'Building washing at $0.10/sqft. Tools $180, bleach 55gal, gas, chemicals.',
    bid_date: '2025-02-10',
  },

  // Lakeside at Mansell
  {
    proposal_id: 'lakeside-mansell-2025', client_name: 'Lakeside at Mansell',
    service: 'pressure_washing', sub_scope: 'house_exterior',
    property_type: 'multifamily', sqft: 14884, unit_count: null,
    quantity: 14884, unit: 'sqft', unit_cost: 0.15,
    bid_amount: 3558.78, cost_amount: 2737.52, profit: 821.26, margin_pct: 0.23,
    overhead_pct: 0.10, profit_pct: 0.20,
    zip: null, city: 'Roswell', state: 'GA', distance_miles: 30,
    outcome: 'pending', client_type: 'property_manager',
    notes: 'Building $0.15/sqft + concrete $0.13/sqft. Tools $180, bleach, gas, chemicals.',
    bid_date: '2025-02-15',
  },

  // Gocha Breakfast Bar
  {
    proposal_id: 'gocha-2025', client_name: 'Gocha Breakfast Bar',
    service: 'pressure_washing', sub_scope: 'house_exterior',
    property_type: 'commercial', sqft: 7777, unit_count: null,
    quantity: 7777, unit: 'sqft', unit_cost: 0.75,
    bid_amount: 41511.69, cost_amount: 34166.00, profit: 7345.69, margin_pct: 0.18,
    overhead_pct: 0.08, profit_pct: 0.135,
    zip: null, city: 'Atlanta', state: 'GA', distance_miles: 10,
    outcome: 'pending', client_type: 'commercial',
    notes: 'Dwelling $0.75/sqft, concrete $0.25, wood $0.85, patio $0.35. Includes concrete pour $19493 and artificial brick $5600.',
    bid_date: '2025-03-01',
  },

  // Castleberry (City Auditorium) — template pricing
  {
    proposal_id: 'castleberry-2025', client_name: 'City Auditorium (027-25)',
    service: 'pressure_washing', sub_scope: 'house_exterior',
    property_type: 'government', sqft: 69083, unit_count: null,
    quantity: 69083, unit: 'sqft', unit_cost: 0.20,
    bid_amount: 19817.20, cost_amount: null, profit: null, margin_pct: null,
    overhead_pct: null, profit_pct: null,
    zip: null, city: 'Atlanta', state: 'GA', distance_miles: 10,
    outcome: 'pending', client_type: 'government',
    notes: 'City Auditorium exterior cleaning. 3 floors. Man hour $25, SQFT $0.20, mob $100. Cost sheet shows $19,817 cost.',
    bid_date: '2025-04-01',
  },
];

// ── Rate cards from actual pricing templates ────────────────────────────────
const rateCards = [
  // Pressure washing rates (from pricing template)
  { service: 'pressure_washing', sub_scope: 'concrete', property_type: 'commercial', base_rate: 0.08, unit: 'sqft', notes: 'Base SQFT cost from pricing template' },
  { service: 'pressure_washing', sub_scope: 'concrete', property_type: 'residential', base_rate: 0.14, unit: 'sqft', notes: 'Residential concrete rate' },
  { service: 'pressure_washing', sub_scope: 'building_wash', property_type: 'commercial', base_rate: 0.10, unit: 'sqft', notes: 'Building exterior soft wash' },
  { service: 'pressure_washing', sub_scope: 'building_wash', property_type: 'multifamily', base_rate: 0.15, unit: 'sqft', notes: 'Apartment building soft wash' },
  { service: 'pressure_washing', sub_scope: 'building_wash', property_type: 'restaurant', base_rate: 0.75, unit: 'sqft', notes: 'Restaurant/specialty exterior (Gocha rate)' },
  { service: 'pressure_washing', sub_scope: 'parking_lot', property_type: 'commercial', base_rate: 0.05, unit: 'sqft', notes: 'Large parking lot rate (Costco)' },
  { service: 'pressure_washing', sub_scope: 'wood_panels', property_type: 'commercial', base_rate: 0.85, unit: 'sqft', notes: 'Wood panel washing' },
  { service: 'pressure_washing', sub_scope: 'patio', property_type: 'commercial', base_rate: 0.35, unit: 'sqft', notes: 'Patio and stairs cleaning' },

  // Property preservation rates (from Prescott estimate)
  { service: 'property_preservation', sub_scope: 'board_up', property_type: 'multifamily', base_rate: 150, unit: 'door', notes: 'HUD spec board-up per door (bid rate)' },
  { service: 'property_preservation', sub_scope: 'board_up', property_type: 'sfr', base_rate: 120, unit: 'door', notes: 'SFR board-up per door' },
  { service: 'property_preservation', sub_scope: 'dumpster_30yd', property_type: null, base_rate: 520, unit: 'rental', notes: '30 yard dumpster 7-day rental' },
  { service: 'property_preservation', sub_scope: 'lawn_initial', property_type: 'multifamily', base_rate: 400, unit: 'job', notes: 'Initial cut, overgrown lot' },
  { service: 'property_preservation', sub_scope: 'lawn_initial', property_type: 'sfr', base_rate: 85, unit: 'job', notes: 'SFR initial grass cut' },

  // Aggregates rates (from Fulton contract)
  { service: 'aggregates', sub_scope: 'rip_rap', property_type: 'government', base_rate: 42, unit: 'ton', notes: 'GDOT Type 3 Rip Rap sell price' },
  { service: 'aggregates', sub_scope: 'crushed_stone_57', property_type: 'government', base_rate: 26, unit: 'ton', notes: 'ASTM #57 Crushed Stone sell price' },
  { service: 'aggregates', sub_scope: 'crusher_run', property_type: 'government', base_rate: 18, unit: 'ton', notes: 'Crusher Run Granite GAB sell price' },
  { service: 'aggregates', sub_scope: 'crushed_stone_34', property_type: 'government', base_rate: 30, unit: 'ton', notes: '#34 Crushed Stone sell price' },

  // Labor rates
  { service: '_labor', sub_scope: 'man_hour_pw', property_type: null, base_rate: 50, unit: 'hour', notes: 'Pressure washing man hour rate' },
  { service: '_labor', sub_scope: 'man_hour_pp', property_type: null, base_rate: 20, unit: 'hour', notes: 'Property preservation man hour rate' },
  { service: '_labor', sub_scope: 'day_rate', property_type: null, base_rate: 150, unit: 'day', notes: 'Day rate per worker' },
  { service: '_labor', sub_scope: 'mobilization', property_type: 'commercial', base_rate: 500, unit: 'job', notes: 'Commercial mobilization fee' },
  { service: '_labor', sub_scope: 'mobilization', property_type: 'residential', base_rate: 100, unit: 'job', notes: 'Residential mobilization fee' },
  { service: '_labor', sub_scope: 'spot_cleaning', property_type: null, base_rate: 50, unit: 'hour', notes: 'Spot cleaning hourly rate' },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
console.log('Seeding bid history...');
insertBidBulk(bids);
console.log(`  ${bids.length} bids inserted.`);

console.log('Seeding rate cards...');
for (const card of rateCards) {
  upsertRateCard(card);
}
console.log(`  ${rateCards.length} rate cards inserted.`);

console.log('Seeding market rates...');
const marketRates = [
  { service: 'pressure_washing', sub_scope: 'residential', source: 'thumbtack', low: 0.20, mid: 0.35, high: 0.65, unit: 'sqft' },
  { service: 'pressure_washing', sub_scope: 'commercial', source: 'thumbtack', low: 0.10, mid: 0.18, high: 0.30, unit: 'sqft' },
  { service: 'pressure_washing', sub_scope: 'residential', source: 'angi', low: 0.15, mid: 0.30, high: 0.50, unit: 'sqft' },
  { service: 'property_preservation', sub_scope: 'initial_secure', source: 'hud_fsm', low: 285, mid: 440, high: 775, unit: 'property' },
  { service: 'property_preservation', sub_scope: 'board_up', source: 'hud_fsm', low: 65, mid: 110, high: 175, unit: 'opening' },
  { service: 'property_preservation', sub_scope: 'grass_cut', source: 'hud_fsm', low: 45, mid: 85, high: 125, unit: 'job' },
  { service: 'aggregates', sub_scope: 'rip_rap', source: 'supplier_quote', region: 'Atlanta metro', low: 32, mid: 38, high: 45, unit: 'ton' },
  { service: 'aggregates', sub_scope: 'crushed_stone', source: 'supplier_quote', region: 'Atlanta metro', low: 20, mid: 26, high: 32, unit: 'ton' },
];
for (const rate of marketRates) {
  insertMarketRate(rate);
}
console.log(`  ${marketRates.length} market rates inserted.`);

console.log('Done. Database seeded at server/data/pricing.db');
