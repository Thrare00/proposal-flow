// Market research module for Proposal Flow.
// Fetches market rates via Brave Search API and caches results.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = join(__dirname, 'data', 'market-research');
const CACHE_MAX_AGE_DAYS = 30;

// Unit labels for search query construction
const UNIT_LABELS = {
  pressure_washing: { default: 'per sqft', residential_driveway: 'per driveway', house_exterior: 'per sqft', commercial_lot: 'per sqft', roof_soft_wash: 'per job', deck_patio: 'per job', fence_line: 'per linear foot', apartment_building: 'per unit' },
  property_preservation: { default: 'per property', grass_cut: 'per cut', debris_removal: 'per job', board_up: 'per opening', lock_change: 'per lock', winterization: 'per property', mold_treatment: 'per job', roof_tarp: 'per job', pool_securing: 'per job' },
  restriping: { default: 'per stall', per_stall: 'per stall', ada_symbol: 'per symbol', full_lot: 'per lot', speed_bump: 'each' },
};

// GSA Schedule / HUD FSM static benchmarks for federal work
const FEDERAL_BENCHMARKS = {
  pressure_washing: { source: 'GSA/Thumbtack 2025', low: 0.15, high: 0.65, unit: 'sqft' },
  property_preservation: { source: 'HUD FSM 2025', low: 285, high: 900, unit: 'property' },
  restriping: { source: 'GSA Schedule 2025', low: 8, high: 30, unit: 'stall' },
};

function cacheKey(service, subScope, zip) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sub = subScope || 'default';
  return `${service}_${sub}_${zip || 'national'}_${month}.json`;
}

function loadCached(key) {
  const filePath = join(CACHE_DIR, key);
  if (!existsSync(filePath)) return null;
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const age = (Date.now() - new Date(data.fetchedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (age > CACHE_MAX_AGE_DAYS) return null;
    return data;
  } catch { return null; }
}

function saveCache(key, data) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(join(CACHE_DIR, key), JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('[market-research] Cache write failed:', e.message);
  }
}

// Parse price signals from search result snippets
function parsePriceSignals(snippets) {
  const prices = [];
  const priceRegex = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g;
  for (const snippet of snippets) {
    let match;
    while ((match = priceRegex.exec(snippet)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > 0 && val < 100000) prices.push(val);
    }
  }
  if (prices.length === 0) return null;
  prices.sort((a, b) => a - b);
  return {
    low: prices[0],
    median: prices[Math.floor(prices.length / 2)],
    high: prices[prices.length - 1],
    sampleSize: prices.length,
  };
}

/**
 * Fetch market rates for a service/sub-scope in a given area.
 * Uses Brave Search API if BRAVE_API_KEY is set, otherwise returns static benchmarks.
 */
export async function fetchMarketRates(service, subScope, zipCode, isFederal = false) {
  const key = cacheKey(service, subScope, zipCode);
  const cached = loadCached(key);
  if (cached) return cached;

  const unitLabel = UNIT_LABELS[service]?.[subScope || 'default'] || 'per job';
  const serviceName = (service || '').replace(/_/g, ' ');
  const subScopeName = subScope ? subScope.replace(/_/g, ' ') : '';
  const searchLabel = subScopeName ? `${serviceName} ${subScopeName}` : serviceName;
  const locationPart = zipCode ? ` ${zipCode}` : '';

  const result = {
    service,
    subScope: subScope || null,
    zipCode: zipCode || null,
    marketRange: null,
    federalBenchmark: null,
    sources: [],
    confidence: 'low',
    fetchedAt: new Date().toISOString(),
  };

  // Add federal benchmarks if applicable
  if (isFederal && FEDERAL_BENCHMARKS[service]) {
    result.federalBenchmark = FEDERAL_BENCHMARKS[service];
    result.sources.push(FEDERAL_BENCHMARKS[service].source);
  }

  // Try Brave Search API
  const braveKey = process.env.BRAVE_API_KEY;
  if (braveKey) {
    try {
      const queries = [
        `"${searchLabel}" cost ${unitLabel}${locationPart} 2026`,
        `${searchLabel} pricing rates${locationPart}`,
      ];

      const allSnippets = [];
      for (const q of queries) {
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5`;
        const resp = await fetch(url, {
          headers: { 'X-Subscription-Token': braveKey, 'Accept': 'application/json' },
        });
        if (resp.ok) {
          const data = await resp.json();
          const results = data.web?.results || [];
          for (const r of results) {
            if (r.description) allSnippets.push(r.description);
            if (r.title) allSnippets.push(r.title);
            result.sources.push(r.url);
          }
        }
      }

      const signals = parsePriceSignals(allSnippets);
      if (signals) {
        result.marketRange = signals;
        result.confidence = signals.sampleSize >= 5 ? 'high' : signals.sampleSize >= 3 ? 'medium' : 'low';
      }
    } catch (e) {
      console.warn('[market-research] Brave Search failed:', e.message);
    }
  }

  // If no live data, use static benchmarks as fallback
  if (!result.marketRange && FEDERAL_BENCHMARKS[service]) {
    const fb = FEDERAL_BENCHMARKS[service];
    result.marketRange = { low: fb.low, median: Number(((fb.low + fb.high) / 2).toFixed(2)), high: fb.high, sampleSize: 0 };
    result.confidence = 'static';
    if (!result.sources.includes(fb.source)) result.sources.push(fb.source);
  }

  // Limit sources array to unique values, max 10
  result.sources = [...new Set(result.sources)].slice(0, 10);

  saveCache(key, result);
  return result;
}

/**
 * Detect services mentioned in a compliance matrix.
 * Returns array of { service, subScope } objects.
 */
export function detectServicesFromMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  const text = matrix.map(r => `${r.requirement_text || ''} ${r.proposal_section || ''}`).join(' ').toLowerCase();

  const serviceKeywords = {
    pressure_washing: ['pressure wash', 'power wash', 'soft wash', 'exterior clean', 'building wash'],
    property_preservation: ['property preservation', 'lock change', 'board up', 'winteriz', 'grass cut', 'lawn', 'trash-out', 'trash out', 'debris removal', 'mold', 'pool secur'],
    restriping: ['restrip', 'striping', 'parking lot line', 'pavement marking', 'ada stall', 'ada symbol', 'parking stall'],
  };

  const subScopeKeywords = {
    pressure_washing: {
      residential_driveway: ['driveway'], house_exterior: ['house', 'home exterior'],
      commercial_lot: ['commercial', 'parking structure'], roof_soft_wash: ['roof'],
      deck_patio: ['deck', 'patio'], fence_line: ['fence'],
      apartment_building: ['apartment', 'multi-family'],
    },
    property_preservation: {
      grass_cut: ['grass', 'lawn', 'mow'], debris_removal: ['debris', 'trash-out', 'trash out'],
      board_up: ['board up', 'board-up'], lock_change: ['lock change', 'rekey'],
      winterization: ['winteriz'], mold_treatment: ['mold'],
      roof_tarp: ['roof tarp', 'emergency roof'], pool_securing: ['pool'],
    },
    restriping: {
      per_stall: ['per stall', 'parking stall'], ada_symbol: ['ada'],
      full_lot: ['full lot', 'entire lot'], speed_bump: ['speed bump'],
    },
  };

  const detected = [];
  for (const [svc, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      // Try to detect specific sub-scopes
      let foundSubScope = false;
      if (subScopeKeywords[svc]) {
        for (const [sub, subKws] of Object.entries(subScopeKeywords[svc])) {
          if (subKws.some(kw => text.includes(kw))) {
            detected.push({ service: svc, subScope: sub });
            foundSubScope = true;
          }
        }
      }
      if (!foundSubScope) {
        detected.push({ service: svc, subScope: null });
      }
    }
  }

  return detected;
}
