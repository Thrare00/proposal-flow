// SQLite pricing database — bid history, rate cards, market rates, revenue tracking
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'pricing.db');
const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS rate_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    sub_scope TEXT,
    property_type TEXT,
    severity TEXT DEFAULT 'light',
    base_rate REAL NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bid_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id TEXT,
    client_name TEXT NOT NULL,
    service TEXT NOT NULL,
    sub_scope TEXT,
    property_type TEXT,
    sqft REAL,
    unit_count INTEGER,
    quantity REAL,
    unit TEXT,
    unit_cost REAL,
    bid_amount REAL NOT NULL,
    cost_amount REAL,
    profit REAL,
    margin_pct REAL,
    overhead_pct REAL,
    profit_pct REAL,
    zip TEXT,
    city TEXT,
    state TEXT DEFAULT 'GA',
    distance_miles REAL,
    outcome TEXT DEFAULT 'pending',
    client_type TEXT,
    notes TEXT,
    bid_date TEXT,
    submitted_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS market_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    sub_scope TEXT,
    source TEXT NOT NULL,
    region TEXT DEFAULT 'Atlanta metro',
    low REAL,
    mid REAL,
    high REAL,
    unit TEXT,
    scraped_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS revenue_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL UNIQUE,
    target REAL DEFAULT 22000,
    invoiced REAL DEFAULT 0,
    collected REAL DEFAULT 0,
    job_count INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_bid_service ON bid_history(service);
  CREATE INDEX IF NOT EXISTS idx_bid_outcome ON bid_history(outcome);
  CREATE INDEX IF NOT EXISTS idx_bid_client ON bid_history(client_name);
  CREATE INDEX IF NOT EXISTS idx_market_service ON market_rates(service);
`);

// ── Bid History ─────────────────────────────────────────────────────────────
export function insertBid(bid) {
  const stmt = db.prepare(`
    INSERT INTO bid_history (
      proposal_id, client_name, service, sub_scope, property_type,
      sqft, unit_count, quantity, unit, unit_cost,
      bid_amount, cost_amount, profit, margin_pct, overhead_pct, profit_pct,
      zip, city, state, distance_miles,
      outcome, client_type, notes, bid_date
    ) VALUES (
      @proposal_id, @client_name, @service, @sub_scope, @property_type,
      @sqft, @unit_count, @quantity, @unit, @unit_cost,
      @bid_amount, @cost_amount, @profit, @margin_pct, @overhead_pct, @profit_pct,
      @zip, @city, @state, @distance_miles,
      @outcome, @client_type, @notes, @bid_date
    )
  `);
  return stmt.run(bid);
}

export function updateBidOutcome(id, outcome) {
  return db.prepare('UPDATE bid_history SET outcome = ? WHERE id = ?').run(outcome, id);
}

export function updateBidOutcomeByProposal(proposalId, outcome) {
  return db.prepare('UPDATE bid_history SET outcome = ? WHERE proposal_id = ?').run(outcome, proposalId);
}

export function getBidsByProposal(proposalId) {
  return db.prepare('SELECT * FROM bid_history WHERE proposal_id = ?').all(proposalId);
}

export function getBidHistory(filters = {}) {
  let sql = 'SELECT * FROM bid_history WHERE 1=1';
  const params = [];
  if (filters.service) { sql += ' AND service = ?'; params.push(filters.service); }
  if (filters.outcome) { sql += ' AND outcome = ?'; params.push(filters.outcome); }
  if (filters.client_type) { sql += ' AND client_type = ?'; params.push(filters.client_type); }
  sql += ' ORDER BY submitted_at DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return db.prepare(sql).all(...params);
}

export function getWinLossStats(service) {
  const all = db.prepare(
    'SELECT * FROM bid_history WHERE service = ? AND outcome IN (?, ?)'
  ).all(service, 'win', 'loss');

  if (all.length < 1) return null;

  const wins = all.filter(e => e.outcome === 'win');
  const losses = all.filter(e => e.outcome === 'loss');
  const winRate = all.length > 0 ? wins.length / all.length : 0;
  const avgWinBid = wins.length > 0
    ? wins.reduce((s, e) => s + e.bid_amount, 0) / wins.length
    : null;
  const avgWinMargin = wins.length > 0
    ? wins.reduce((s, e) => s + (e.margin_pct || 0), 0) / wins.length
    : null;

  return {
    service,
    totalBids: all.length,
    wins: wins.length,
    losses: losses.length,
    winRate: Number(winRate.toFixed(2)),
    avgWinBid: avgWinBid ? Number(avgWinBid.toFixed(2)) : null,
    avgWinMargin: avgWinMargin ? Number((avgWinMargin * 100).toFixed(1)) : null,
  };
}

// ── Rate Cards ──────────────────────────────────────────────────────────────
export function upsertRateCard(card) {
  const existing = db.prepare(`
    SELECT id FROM rate_cards WHERE service = ? AND COALESCE(sub_scope, '') = ? AND COALESCE(property_type, '') = ? AND COALESCE(severity, 'light') = ?
  `).get(card.service, card.sub_scope || '', card.property_type || '', card.severity || 'light');

  if (existing) {
    return db.prepare(
      'UPDATE rate_cards SET base_rate = ?, unit = ?, notes = ?, updated_at = datetime("now") WHERE id = ?'
    ).run(card.base_rate, card.unit, card.notes || null, existing.id);
  }
  return db.prepare(
    'INSERT INTO rate_cards (service, sub_scope, property_type, severity, base_rate, unit, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(card.service, card.sub_scope || null, card.property_type || null, card.severity || 'light', card.base_rate, card.unit, card.notes || null);
}

export function getRateCards(service) {
  if (service) return db.prepare('SELECT * FROM rate_cards WHERE service = ?').all(service);
  return db.prepare('SELECT * FROM rate_cards').all();
}

// ── Market Rates ────────────────────────────────────────────────────────────
export function insertMarketRate(rate) {
  return db.prepare(
    'INSERT INTO market_rates (service, sub_scope, source, region, low, mid, high, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(rate.service, rate.sub_scope || null, rate.source, rate.region || 'Atlanta metro', rate.low, rate.mid, rate.high, rate.unit);
}

export function getMarketRates(service) {
  return db.prepare(
    'SELECT * FROM market_rates WHERE service = ? ORDER BY scraped_at DESC'
  ).all(service);
}

// ── Revenue Tracking ────────────────────────────────────────────────────────
export function upsertRevenue(month, data) {
  const existing = db.prepare('SELECT id FROM revenue_tracking WHERE month = ?').get(month);
  if (existing) {
    return db.prepare(
      "UPDATE revenue_tracking SET invoiced = ?, collected = ?, job_count = ?, updated_at = datetime('now') WHERE month = ?"
    ).run(data.invoiced || 0, data.collected || 0, data.job_count || 0, month);
  }
  return db.prepare(
    'INSERT INTO revenue_tracking (month, target, invoiced, collected, job_count) VALUES (?, ?, ?, ?, ?)'
  ).run(month, data.target || 22000, data.invoiced || 0, data.collected || 0, data.job_count || 0);
}

export function getRevenue(months) {
  if (months) {
    return db.prepare(
      'SELECT * FROM revenue_tracking ORDER BY month DESC LIMIT ?'
    ).all(months);
  }
  return db.prepare('SELECT * FROM revenue_tracking ORDER BY month DESC').all();
}

// ── Bulk Operations ─────────────────────────────────────────────────────────
export const insertBidBulk = db.transaction((bids) => {
  for (const bid of bids) insertBid(bid);
});

export function getDb() { return db; }

export default db;
