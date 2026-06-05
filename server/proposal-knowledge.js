/**
 * proposal-knowledge.js  - Service-specific proposal content library
 *
 * Provides grounded, reusable proposal section content keyed by service type.
 * Used by the deterministic fallback in outline + rough draft stages to produce
 * solicitation-aware content instead of generic templates.
 *
 * Content source: Thrare Contracting operational data, past proposals, pricing
 * engine service catalog, and SLA commitments.
 */

// ── Service-specific technical approaches ────────────────────────────────────
// Each contains a short outline paragraph + an expanded rough draft version.

export const TECHNICAL_APPROACHES = {
  pressure_washing: {
    outline: (scope) =>
      `Thrare Contracting will execute all pressure washing services using a three-phase approach: pre-wash assessment (surface type, staining severity, access constraints), chemical application calibrated to substrate (concrete, masonry, membrane roofing), and high-pressure rinse with containment of wastewater per EPA stormwater guidelines. ${scope ? `Scope includes ${scope}. ` : ''}All work follows OSHA 29 CFR 1926 safety standards with crew-specific JSA documentation. Equipment includes commercial-grade 4,000 PSI units, soft-wash systems for delicate surfaces, and surface cleaners for large-area efficiency.`,
    draft: (scope, requirements) =>
      `### Methodology\n\n` +
      `Our pressure washing methodology is structured around a three-phase execution model designed to ensure consistent, high-quality results across all surfaces specified in the solicitation${scope ? ` (${scope})` : ''}.\n\n` +
      `**Phase 1  - Pre-Wash Assessment:** Prior to mobilization, our crew lead conducts a surface-by-surface assessment documenting substrate type (concrete, brick, EIFS, membrane), staining severity (light/moderate/heavy), and access requirements. This assessment drives chemical selection, pressure settings, and time estimates. Photo documentation is captured at baseline for before/after comparison.\n\n` +
      `**Phase 2  - Chemical Application & Wash:** We use sodium hypochlorite-based solutions for organic growth (mold, mildew, algae) and proprietary degreasers for petroleum staining. Soft-wash technique (under 500 PSI) is applied to painted surfaces, EIFS, and roofing membranes. Standard concrete and masonry receives 2,500–4,000 PSI treatment with appropriate tip selection. Surface cleaners are deployed for parking decks, sidewalks, and large slabs to ensure uniform cleaning and reduce cycle time by 40%.\n\n` +
      `**Phase 3  - Rinse, Containment & Documentation:** Final rinse removes all chemical residue. Wastewater containment follows EPA stormwater BMPs  - we deploy berms and vacuum recovery on sensitive sites. Completion photos are timestamped and GPS-tagged. A punch-list walkthrough with the COR confirms acceptance before demobilization.\n\n` +
      (requirements.length ? `**Compliance Notes:** ${requirements.map(r => r.requirement_text).filter(Boolean).slice(0, 3).join('; ')}.\n\n` : '') +
      `**Equipment:** Commercial 4,000 PSI hot/cold units, 12V soft-wash systems, flat-surface cleaners, chemical injection systems, wastewater containment berms, and PPE per OSHA 1926.\n`,
  },

  janitorial: {
    outline: (scope) =>
      `Thrare Contracting will deliver janitorial services through a structured daily/weekly/monthly task matrix aligned to the Performance Work Statement. ${scope ? `Scope covers ${scope}. ` : ''}Cleaning protocols follow ISSA CIMS standards with green-certified products where specified. Our approach includes dedicated site personnel, supply chain management for consumables, and a digital inspection system with photo-verified completion for each task area.`,
    draft: (scope, requirements) =>
      `### Methodology\n\n` +
      `Our janitorial services approach is built on a tiered task matrix that maps directly to the Performance Work Statement${scope ? ` (${scope})` : ''}.\n\n` +
      `**Daily Tasks:** Restroom sanitation (fixtures, mirrors, floors, dispensers), trash removal and liner replacement, entrance/lobby mopping and spot cleaning, break room wipe-down and appliance exterior cleaning.\n\n` +
      `**Weekly Tasks:** Hard-floor machine scrubbing, carpet vacuuming (traffic areas), glass/window interior cleaning, dust horizontal surfaces (ledges, vents, light fixtures), supply inventory and restock.\n\n` +
      `**Monthly/Quarterly Tasks:** Deep carpet extraction, strip and wax hard floors, high-dust HVAC vents and ceiling grids, light fixture cleaning, baseboard detailing.\n\n` +
      `**Quality System:** Each task completion is logged via mobile app with timestamp and GPS verification. The site supervisor conducts daily walkthrough using a standardized 25-point inspection checklist. Deficiencies are corrected same-shift with photo documentation of resolution.\n\n` +
      `**Products & Standards:** All chemicals are EPA Safer Choice or Green Seal certified where feasible. ISSA CIMS cleaning standards govern dilution ratios, dwell times, and cross-contamination prevention (color-coded microfiber system).\n\n` +
      (requirements.length ? `**Compliance:** ${requirements.map(r => r.requirement_text).filter(Boolean).slice(0, 3).join('; ')}.\n\n` : ''),
  },

  grounds_maintenance: {
    outline: (scope) =>
      `Thrare Contracting will perform grounds maintenance on a scheduled cycle covering mowing, edging, trimming, debris removal, and seasonal cleanup. ${scope ? `Scope includes ${scope}. ` : ''}Our crew operates commercial-grade zero-turn mowers, string trimmers, and blowers. Seasonal services include leaf removal, storm debris cleanup, and bed maintenance. All clippings are mulched or removed per facility requirements.`,
    draft: (scope, requirements) =>
      `### Methodology\n\n` +
      `Our grounds maintenance program delivers consistent turf care and site appearance through scheduled service cycles aligned to the solicitation's performance requirements${scope ? ` (${scope})` : ''}.\n\n` +
      `**Weekly/Bi-Weekly Mowing:** Commercial zero-turn mowers maintain turf at specified height (typically 3"–4"). Perimeter edging along sidewalks, curbs, and bed lines is performed each visit. String trimming addresses areas inaccessible to mowers (fence lines, posts, signage bases). All clippings are mulched in place or bagged per facility preference.\n\n` +
      `**Debris & Litter Removal:** Each visit includes policing of grounds for litter, branches, and wind-blown debris. Storm cleanup is performed within 48 hours of weather events per our SLA commitment.\n\n` +
      `**Seasonal Services:** Spring: bed edging, mulch application, pre-emergent weed control. Summer: increased mowing frequency, irrigation monitoring. Fall: leaf removal (blower + vacuum), bed winterization. Winter: dormant pruning, hardscape clearing.\n\n` +
      `**Equipment:** John Deere/Hustler zero-turn mowers, Honda string trimmers, Stihl backpack blowers, debris trailers, and hand tools. All equipment is maintained to OEM specifications with backup units staged for continuity.\n\n` +
      (requirements.length ? `**Compliance:** ${requirements.map(r => r.requirement_text).filter(Boolean).slice(0, 3).join('; ')}.\n\n` : ''),
  },

  property_preservation: {
    outline: (scope) =>
      `Thrare Contracting will deliver property preservation services including initial securing (board-up, lock changes), winterization, debris removal, and ongoing maintenance inspections. ${scope ? `Scope covers ${scope}. ` : ''}Our team responds within 24–48 hours of assignment with photo documentation at every stage. All work follows HUD/FHA property preservation guidelines and client-specific SLAs.`,
    draft: (scope, requirements) =>
      `### Methodology\n\n` +
      `Our property preservation approach follows HUD/FHA guidelines and is structured for rapid response with full documentation${scope ? `  - scope: ${scope}` : ''}.\n\n` +
      `**Initial Securing:** Board-up using 5/8" CDX plywood with tamper-resistant screws. Lock changes (Kwikset Grade 3 keyed deadbolts) with key code reported within 24 hours. Property access padlocks on utility areas.\n\n` +
      `**Winterization:** Drain all water lines, water heater, and fixtures. Apply RV antifreeze to all P-traps. Shut off and tag main water supply. Disconnect washing machine hoses. Document all winterized fixtures with photos.\n\n` +
      `**Debris Removal & Cleanout:** Remove all personal property, trash, and hazardous materials per client guidelines. Broom-clean all rooms. Haul debris to licensed disposal facility with weight tickets retained.\n\n` +
      `**Recurring Inspections:** Monthly drive-by + interior inspection per client cycle. Report property condition, occupancy status, code violations, and maintenance needs. Photo sets uploaded within 24 hours of inspection.\n\n` +
      (requirements.length ? `**Compliance:** ${requirements.map(r => r.requirement_text).filter(Boolean).slice(0, 3).join('; ')}.\n\n` : ''),
  },

  restriping: {
    outline: (scope) =>
      `Thrare Contracting will perform parking lot striping and pavement marking using traffic-grade latex paint and reflective glass beads per MUTCD and ADA standards. ${scope ? `Scope includes ${scope}. ` : ''}Layout is verified against ADA Accessibility Guidelines (2010 Standards) before paint application. We use professional-grade Graco line stripers with 4" tip assemblies for crisp, durable lines. Stencils for ADA symbols, fire lanes, and directional arrows are precision-cut.`,
    draft: (scope, requirements) =>
      `### Methodology\n\n` +
      `Our restriping program ensures full ADA compliance and long-lasting pavement markings${scope ? ` for ${scope}` : ''}.\n\n` +
      `**Pre-Striping Assessment:** Site survey to verify stall count, ADA requirements (van-accessible ratio, access aisle widths, signage), fire lane designations, and directional flow. Existing layout is measured and documented. Client approval of layout plan before mobilization.\n\n` +
      `**Surface Preparation:** Power-blow all surfaces to remove debris and loose material. For re-stripe, existing lines guide layout. For new striping, chalk-snap all lines per approved plan.\n\n` +
      `**Paint Application:** Sherwin-Williams or equivalent traffic-grade latex paint (white for stalls, blue for ADA, red for fire lanes, yellow for no-parking/curb). Reflective glass beads applied wet-on-wet per MUTCD for nighttime visibility. All lines are 4" minimum width per standard.\n\n` +
      `**ADA Compliance:** International Symbol of Accessibility stencils (36"×36" minimum). Van-accessible stalls marked with "VAN ACCESSIBLE" signage. Access aisles: 60" minimum (96" for van). Slope verification where required.\n\n` +
      (requirements.length ? `**Compliance:** ${requirements.map(r => r.requirement_text).filter(Boolean).slice(0, 3).join('; ')}.\n\n` : ''),
  },

  default: {
    outline: (scope) =>
      `Thrare Contracting will execute this scope using a phased approach: mobilization and site assessment, execution per the Performance Work Statement, and close-out with photo-verified documentation. ${scope ? `The solicitation scope includes ${scope}. ` : ''}Our team maintains full insurance coverage, safety protocols per OSHA standards, and a documented QA/QC process. As a certified MBE/DBE small business, we provide direct communication with the owner/PM throughout the project lifecycle.`,
    draft: (scope, requirements) =>
      `### Methodology\n\n` +
      `Our approach is structured around three phases aligned to the Performance Work Statement${scope ? ` (${scope})` : ''}.\n\n` +
      `**Phase 1  - Mobilization & Assessment:** Site visit to verify conditions, access, and logistics. Develop task-specific work plan with schedule and resource allocation. Identify any scope clarifications needed before execution.\n\n` +
      `**Phase 2  - Execution:** Deploy trained crew with appropriate equipment. Follow daily task checklists aligned to PWS requirements. Maintain ongoing communication with COR/COTR for schedule coordination and issue resolution. Photo documentation at each milestone.\n\n` +
      `**Phase 3  - Close-Out & Documentation:** Punch-list walkthrough with government representative. Submit completion report with before/after photos, GPS timestamps, and any maintenance recommendations. Invoice per contract terms.\n\n` +
      (requirements.length ? `**Compliance Notes:** ${requirements.map(r => r.requirement_text).filter(Boolean).slice(0, 3).join('; ')}.\n\n` : ''),
  },
};

// ── Management plan content ──────────────────────────────────────────────────

export const MANAGEMENT_PLAN = {
  outline: (teamingPosture, riskNotes) =>
    `Eric White, Owner/PM, serves as the single point of contact and Contractor Project Manager for all task orders. Weekly progress reports are submitted to the COR detailing completed tasks, upcoming schedule, and any issues. A change-control process handles scope modifications  - no work proceeds outside the PWS without written COR approval. ${teamingPosture || ''} ${riskNotes?.length ? `Risk mitigation addresses: ${riskNotes.slice(0, 2).join('; ')}.` : ''}`,
  draft: (teamingPosture, riskNotes, preSol) =>
    `### Project Governance\n\n` +
    `**Contractor Project Manager:** Eric White, Owner of Thrare Contracting, serves as the primary point of contact and is authorized to make binding decisions on behalf of the company. Mr. White is directly reachable at (678) 748-3578 and admin@thrarecontracting.com.\n\n` +
    `**Reporting Cadence:**\n` +
    `- **Weekly:** Written progress report to COR  - tasks completed, tasks scheduled, issues/risks, resource utilization\n` +
    `- **Monthly:** Invoice with supporting documentation (photos, timesheets, material receipts)\n` +
    `- **Ad Hoc:** Immediate notification to COR for safety incidents, scope questions, or schedule impacts\n\n` +
    `**Change Control:** All scope modifications require written COR approval before execution. Thrare Contracting maintains a change log documenting request date, description, cost impact, and approval status.\n\n` +
    `**Communication Plan:** COR receives direct cell phone access to the PM for urgent matters. Non-urgent communication via email with 4-hour response commitment during business hours. Emergency response available 24/7.\n\n` +
    (teamingPosture ? `**Teaming:** ${teamingPosture}\n\n` : '') +
    (riskNotes?.length ? `**Risk Mitigation:** ${riskNotes.join('; ')}.\n\n` : ''),
};

// ── Staffing and key personnel ───────────────────────────────────────────────

export const STAFFING = {
  outline: (scope) =>
    `Eric White, Owner/Project Manager (7+ years experience in facility services, recycling logistics, and project management) directs all operations and serves as the primary interface with the COR. Field crews consist of trained technicians with current OSHA 10-hour certifications and background checks where required. ${scope ? `Staffing is scaled to the scope: ${scope.substring(0, 80)}. ` : ''}All personnel are W-2 employees or vetted subcontractors with documented qualifications.`,
  draft: (scope) =>
    `### Team Structure\n\n` +
    `| Role | Name/Assignment | Qualifications | Availability |\n` +
    `|------|----------------|----------------|---------------|\n` +
    `| Project Manager | Eric White (Owner) | 7+ years facility services, PM, recycling logistics | 100% dedicated |\n` +
    `| Crew Lead | Assigned at NTP | OSHA 10-hr, equipment operation certified | Per task order |\n` +
    `| Technician(s) | Assigned at NTP | Background-checked, task-trained | Per task order |\n\n` +
    `**Key Personnel  - Eric White, Project Manager:**\n` +
    `Mr. White is the owner and sole decision-maker for Thrare Contracting He brings 7+ years of experience managing facility maintenance, recycling logistics, and multi-site service delivery. Relevant experience includes managing $529,200+ in contracts for Fulton County DPW, CheckSammy, and MCS Chainstore Maintenance. Mr. White holds direct relationships with teaming partners and subcontractors across Metro Atlanta.\n\n` +
    `**Staffing Commitment:** Thrare Contracting commits to maintaining the crew size necessary to meet all SLA response times (24-hour emergency, 48-hour standard). Crew members receive task-specific training before deployment, including site-specific safety orientation, equipment operation, and chemical handling (where applicable).\n\n` +
    `**Subcontractor Management:** When teaming partners are utilized, Thrare Contracting maintains prime contractor responsibility. All subcontractors are vetted for insurance, licensing, and relevant experience before deployment.\n`,
};

// ── Quality Control ──────────────────────────────────────────────────────────

export const QUALITY_CONTROL = {
  outline: () =>
    `Thrare Contracting implements a three-tier QC process: (1) pre-task planning with crew-specific checklists derived from the PWS, (2) in-progress inspection by the crew lead at defined checkpoints, and (3) post-task documentation including timestamped, GPS-tagged photos of completed work. Nonconformances trigger a corrective action cycle: identify deficiency → root cause → corrective action → COR notification → re-inspection within 24 hours. Customer satisfaction is verified through post-service follow-up.`,
  draft: (requirements) =>
    `### QA/QC Framework\n\n` +
    `**Tier 1  - Pre-Task Planning:**\n` +
    `- PWS requirements mapped to crew-specific task checklists\n` +
    `- Equipment pre-inspection and chemical inventory verification\n` +
    `- Safety briefing and JSA (Job Safety Analysis) review\n` +
    `- Baseline photo documentation before work begins\n\n` +
    `**Tier 2  - In-Progress Inspection:**\n` +
    `- Crew lead inspects work at defined checkpoints (e.g., after each area/zone completion)\n` +
    `- Real-time quality issues are corrected before proceeding\n` +
    `- Progress photos captured at each checkpoint\n\n` +
    `**Tier 3  - Post-Task Documentation:**\n` +
    `- Completion photos: timestamped, GPS-tagged, organized by area\n` +
    `- Task checklist signed by crew lead\n` +
    `- Submitted to COR within 24 hours of task completion\n\n` +
    `**Corrective Action Process:**\n` +
    `1. Deficiency identified (self-inspection or COR feedback)\n` +
    `2. Root cause determined within 4 hours\n` +
    `3. Corrective action executed within 24 hours\n` +
    `4. COR notified with description, root cause, and resolution\n` +
    `5. Re-inspection to confirm resolution\n` +
    `6. Preventive measure added to crew checklist to prevent recurrence\n\n` +
    (requirements?.length ? `**Applicable Requirements:** ${requirements.map(r => r.requirement_text).filter(Boolean).slice(0, 3).join('; ')}.\n` : ''),
};

// ── Executive Summary builder ────────────────────────────────────────────────

export function buildExecutiveSummary(proposal, matrix, preSol, pp, detectedServices) {
  const title = proposal.title || 'this solicitation';
  const agency = proposal.agency || 'the procuring agency';
  const certText = pp?.certifications?.length
    ? `As a certified ${pp.certifications.join('/')}, `
    : '';
  const valueText = pp?.total_contract_value
    ? ` with $${pp.total_contract_value.toLocaleString()}+ in past contract value`
    : '';
  const svcText = detectedServices?.length
    ? detectedServices.map(d => d.service.replace(/_/g, ' ')).join(', ')
    : 'the required services';

  const highRisk = matrix.filter(r => r.risk_level === 'high' || r.risk_level === 'critical');
  const riskText = highRisk.length
    ? ` We have identified ${highRisk.length} high/critical compliance requirements and address each directly in this proposal.`
    : '';

  return (
    `Thrare Contracting submits this proposal in response to ${agency}'s requirement for ${title}. ` +
    `${certText}Thrare Contracting brings proven capability in ${svcText}${valueText}. ` +
    `Our approach emphasizes rapid mobilization, documented quality control, and direct owner oversight  - ` +
    `Eric White, Owner/PM, serves as the single point of contact for all contract activities.` +
    `${riskText} ` +
    `${preSol.pricingPosture || 'Pricing is competitive and transparently documented with a full basis of estimate.'}`
  );
}

// ── Pricing narrative builder ────────────────────────────────────────────────

export function buildPricingNarrative(detectedServices, matrix, preSol, estimateJobCostFn) {
  if (!detectedServices?.length) {
    return preSol?.pricingPosture || 'Pricing is benchmarked to current market rates with a documented basis of estimate. All rates include labor, materials, equipment, overhead, and profit.';
  }

  const svcNames = [...new Set(detectedServices.map(d => d.service.replace(/_/g, ' ')))];
  const lines = [];

  for (const svc of detectedServices.slice(0, 3)) {
    const cost = estimateJobCostFn?.(svc.service, svc.subScope, 1, 20);
    if (cost) {
      lines.push(
        `**${svc.service.replace(/_/g, ' ')}${svc.subScope ? ` (${svc.subScope.replace(/_/g, ' ')})` : ''}:** ` +
        `Labor: $${cost.laborCost.toFixed(0)} (${cost.laborHours} crew-hrs × burdened rate), ` +
        `Materials: $${cost.materialCost.toFixed(0)}, ` +
        `Fuel/mobilization: $${cost.fuelCost.toFixed(0)}, ` +
        `Overhead: $${cost.perJobOverhead.toFixed(0)}  - ` +
        `Cost floor: $${cost.costFloor.toFixed(0)} (${Math.round((cost.marginTarget || 0.2) * 100)}% margin target)`
      );
    }
  }

  let narrative =
    `Pricing for ${svcNames.join(', ')} is developed using a transparent cost-build methodology. ` +
    `Each line item includes direct labor (crew hours at burdened rates), materials and chemicals, ` +
    `fuel/mobilization, and allocated overhead (insurance, vehicle, administrative). ` +
    `A ${20}% margin target ensures financial sustainability while remaining competitive.\n\n`;

  if (lines.length) {
    narrative += `**Cost Basis by Service:**\n${lines.map(l => `- ${l}`).join('\n')}\n\n`;
  }

  narrative +=
    `${preSol?.pricingPosture || 'All rates are benchmarked against current market data and federal pricing guides (GSA Schedule, HUD FSM where applicable).'} ` +
    `Volume pricing and multi-year cost adjustments are available upon request.`;

  return narrative;
}

// ── Service detection from title/scope text ──────────────────────────────────

export function detectServiceType(text, title) {
  // Check title first  - it's the most authoritative signal
  if (title) {
    const tl = title.toLowerCase();
    if (/pressure\s*wash|power\s*wash/.test(tl)) return 'pressure_washing';
    if (/janitor|custodial/.test(tl)) return 'janitorial';
    if (/grounds?\s*maint|landscap|mowing/.test(tl)) return 'grounds_maintenance';
    if (/property\s*preserv|trash[\s-]*out/.test(tl)) return 'property_preservation';
    if (/strip|pavement\s*mark/.test(tl)) return 'restriping';
  }
  const t = (text || '').toLowerCase();
  if (/pressure\s*wash|power\s*wash|soft\s*wash|exterior\s*clean|building\s*wash|facade\s*clean/.test(t)) return 'pressure_washing';
  if (/janitor|custodial|cleaning\s*service|restroom|sanitation/.test(t)) return 'janitorial';
  if (/grounds?\s*maint|mowing|landscap|lawn|turf|grass\s*cut|vegetation\s*maint/.test(t)) return 'grounds_maintenance';
  if (/property\s*preserv|board[\s-]*up|lock\s*change|winteriz|cleanout|eviction|trash[\s-]*out|vacancy/.test(t)) return 'property_preservation';
  if (/strip|pavement\s*mark|parking\s*lot\s*line|ada\s*(stall|symbol|mark)|line\s*paint/.test(t)) return 'restriping';
  return 'default';
}

// ── Extract scope language from compliance matrix ────────────────────────────

export function extractScopeText(matrix) {
  if (!matrix?.length) return '';
  // Look for scope-of-work, performance work statement, or description requirements
  const scopeReqs = matrix.filter(r => {
    const section = (r.proposal_section || '').toLowerCase();
    const text = (r.requirement_text || '').toLowerCase();
    return section.includes('scope') || section.includes('pws') || section.includes('statement of work') ||
           text.includes('scope of work') || text.includes('shall provide') || text.includes('contractor shall');
  });
  if (scopeReqs.length) {
    return scopeReqs.map(r => r.requirement_text).join('. ');
  }
  // Fallback: return first 3 requirement texts
  return matrix.slice(0, 3).map(r => r.requirement_text).filter(Boolean).join('. ');
}

// ── Extract high-risk requirements ───────────────────────────────────────────

export function getHighRiskRequirements(matrix) {
  return (matrix || []).filter(r => r.risk_level === 'high' || r.risk_level === 'critical');
}
