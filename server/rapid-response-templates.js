/**
 * Rapid-response email template renderer.
 *
 * Reads markdown templates from templates/rapid-response/ and renders them
 * with proposal/contact context fields into { subject, body } pairs suitable
 * for Gmail draft creation via dispatchGmailMessage().
 */

const OWNER = {
  name: 'Eric White Jr.',
  company: 'Thrare Contracting (DBA of Rare Earth Ltd)',
  companyShort: 'Thrare Contracting',
  phone: '(678) 748-3578',
  email: 'rareearthcontracting@gmail.com',
};

const TEMPLATE_DEFS = {
  'inbound-acknowledgment': {
    label: 'Inbound Acknowledgment',
    description: 'First touch for new solicitations/inquiries (3-5 min SLA)',
    renderSubject: (ctx) =>
      `RE: ${ctx.title || ctx.solicitation || 'Your Inquiry'}`,
    renderBody: (ctx) => {
      const contactLine = ctx.contactName ? `${ctx.contactName},\n\n` : '';
      return (
        `${contactLine}` +
        `Thank you for reaching out. We've received your ${ctx.type || 'solicitation'} and are reviewing it now.\n\n` +
        `To ensure we provide the most relevant response, a few quick questions:\n\n` +
        `1. What is the target completion date or contract start date?\n` +
        `2. Is there a set-aside or preference for small/minority-owned businesses?\n` +
        `3. Are there any mandatory pre-qualification requirements we should be aware of?\n` +
        `4. Who is the best point of contact for follow-up questions?\n\n` +
        `We'll have a substantive response back to you within 24 hours.\n\n` +
        `Best regards,\n` +
        `${OWNER.name}\n` +
        `${OWNER.company}\n` +
        `${OWNER.phone}\n` +
        `${OWNER.email}`
      );
    },
  },

  'prime-teaming-intro': {
    label: 'Prime Teaming Intro',
    description: 'Teaming outreach to prime contractors for a specific solicitation',
    renderSubject: (ctx) =>
      `Teaming Interest - ${ctx.solicitationNumber || ctx.title || 'Upcoming Solicitation'}`,
    renderBody: (ctx) => {
      const contactLine = ctx.contactName ? `${ctx.contactName},\n\n` : '';
      const solRef = ctx.solicitationNumber || ctx.title || 'this solicitation';
      const agencyRef = ctx.agency || 'the procuring agency';
      return (
        `${contactLine}` +
        `We're tracking ${solRef} for ${agencyRef} and believe there's a strong fit for teaming.\n\n` +
        `Rare Earth Ltd (DBA Thrare Contracting) is an Atlanta-based DBE/MBE firm specializing in facility maintenance, pressure washing, and property preservation services. We hold active registrations with SAM.gov, the State of Georgia, and multiple local procurement portals.\n\n` +
        `What we bring to a team:\n` +
        `- DBE/MBE certification (supports subcontracting goals)\n` +
        `- Licensed, insured, and bonded in Georgia\n` +
        `- Local presence in the metro Atlanta service area\n\n` +
        `We'd welcome a brief call to discuss how we might support your bid. What does your schedule look like this week?\n\n` +
        `Best regards,\n` +
        `${OWNER.name}\n` +
        `Owner, ${OWNER.companyShort}\n` +
        `${OWNER.phone}\n` +
        `${OWNER.email}`
      );
    },
  },

  'property-manager-vendor-qualification': {
    label: 'Vendor Qualification',
    description: 'Vendor qualification reply for property managers, GCs, or asset managers',
    renderSubject: () => `Vendor Qualification - Thrare Contracting`,
    renderBody: (ctx) => {
      const contactLine = ctx.contactName ? `${ctx.contactName},\n\n` : '';
      return (
        `${contactLine}` +
        `Thank you for considering us. Here is our qualification summary:\n\n` +
        `Company: Rare Earth Ltd (DBA Thrare Contracting)\n` +
        `Owner: Eric White Jr.\n` +
        `Location: Stone Mountain, GA 30088\n` +
        `Service Area: Metro Atlanta (20-50 mile radius depending on scope)\n\n` +
        `Certifications & Registrations:\n` +
        `- DBE/MBE certified\n` +
        `- SAM.gov registered (active)\n` +
        `- State of Georgia vendor\n` +
        `- City of Atlanta, DeKalb County, Fulton County registered\n\n` +
        `Insurance:\n` +
        `- General Liability: $1M per occurrence / $2M aggregate\n` +
        `- Workers' Compensation: Active\n` +
        `- Auto: Active\n` +
        `- Additional insured endorsements available on request\n\n` +
        `Core Services:\n` +
        `- Pressure washing (commercial, residential, multi-family)\n` +
        `- Property preservation and make-ready\n` +
        `- Exterior maintenance and facility services\n\n` +
        `References and past performance documentation available upon request.\n\n` +
        `What information do you need from us to move forward with qualification?\n\n` +
        `Best regards,\n` +
        `${OWNER.name}\n` +
        `${OWNER.phone}\n` +
        `${OWNER.email}`
      );
    },
  },

  'stale-followup': {
    label: 'Stale Inbound Follow-Up',
    description: 'Follow up on a solicitation or inquiry that has gone cold',
    renderSubject: (ctx) =>
      `Following Up - ${ctx.solicitationNumber || ctx.title || 'Your Inquiry'}`,
    renderBody: (ctx) => {
      const contactLine = ctx.contactName ? `${ctx.contactName},\n\n` : '';
      const solRef = ctx.solicitationNumber || ctx.title || 'your recent inquiry';
      return (
        `${contactLine}` +
        `I wanted to follow up on ${solRef}. We submitted our initial response and want to make sure we haven't missed any next steps.\n\n` +
        `A few quick questions:\n\n` +
        `1. Has a decision timeline been established?\n` +
        `2. Is there any additional information you need from us?\n` +
        `3. Are you still accepting responses or has the window closed?\n\n` +
        `We remain very interested and can turn around any supplementary materials quickly.\n\n` +
        `Best regards,\n` +
        `${OWNER.name}\n` +
        `${OWNER.company}\n` +
        `${OWNER.phone}\n` +
        `${OWNER.email}`
      );
    },
  },

  'stale-followup-escalation': {
    label: 'Stale Inbound Escalation',
    description: 'Urgent follow-up on a solicitation with no response after extended period',
    renderSubject: (ctx) =>
      `Time-Sensitive: ${ctx.solicitationNumber || ctx.title || 'Pending Inquiry'} — Status Request`,
    renderBody: (ctx) => {
      const contactLine = ctx.contactName ? `${ctx.contactName},\n\n` : '';
      const solRef = ctx.solicitationNumber || ctx.title || 'our previous correspondence';
      return (
        `${contactLine}` +
        `I'm reaching out once more regarding ${solRef}. We have not received a response to our earlier follow-up and want to confirm the status of this opportunity.\n\n` +
        `Specifically:\n` +
        `- Is this solicitation still active?\n` +
        `- Has an award been made?\n` +
        `- Is there a different point of contact we should direct our inquiry to?\n\n` +
        `We appreciate your time and look forward to hearing back at your earliest convenience.\n\n` +
        `Best regards,\n` +
        `${OWNER.name}\n` +
        `${OWNER.company}\n` +
        `${OWNER.phone}\n` +
        `${OWNER.email}`
      );
    },
  },

  'teaming-deadline-reminder': {
    label: 'Teaming Deadline Reminder',
    description: 'Remind a teaming partner or prime that the teaming response window is closing',
    renderSubject: (ctx) =>
      `Teaming Response Window - ${ctx.solicitationNumber || ctx.title || 'Upcoming Solicitation'}`,
    renderBody: (ctx) => {
      const contactLine = ctx.contactName ? `${ctx.contactName},\n\n` : '';
      const solRef = ctx.solicitationNumber || ctx.title || 'the solicitation we discussed';
      const deadline = ctx.teamingDeadline || 'soon';
      return (
        `${contactLine}` +
        `I wanted to flag that the teaming response window for ${solRef} is approaching${deadline !== 'soon' ? ` (${deadline})` : ''}.\n\n` +
        `To keep our joint response on track, we should finalize:\n` +
        `1. Teaming agreement or LOI execution\n` +
        `2. Scope of work allocation and responsibilities\n` +
        `3. Past performance and key personnel submissions\n\n` +
        `Rare Earth Ltd (DBA Thrare Contracting) is ready to support as discussed. We can provide our portion of the proposal package within 48 hours of agreement.\n\n` +
        `Can we schedule a brief sync this week to lock everything down?\n\n` +
        `Best regards,\n` +
        `${OWNER.name}\n` +
        `Owner, ${OWNER.companyShort}\n` +
        `${OWNER.phone}\n` +
        `${OWNER.email}`
      );
    },
  },

  'contact-discovery-outreach': {
    label: 'Contact Discovery Outreach',
    description: 'Outreach to decision-makers found via public contact discovery',
    renderSubject: (ctx) => {
      const service = ctx.service || 'Facility Maintenance';
      const org = ctx.organization || ctx.agency || ctx.contactCompany || '';
      return org ? `${service} Services for ${org}` : `${service} Services`;
    },
    renderBody: (ctx) => {
      const contactLine = ctx.contactName ? `${ctx.contactName},\n\n` : '';
      const reason = ctx.reason || 'your organization may benefit from our services';
      const service = ctx.service || 'facility maintenance and pressure washing';
      const clientType = ctx.clientType || 'municipalities, property management companies, and federal facilities';
      return (
        `${contactLine}` +
        `I'm reaching out because ${reason}.\n\n` +
        `Thrare Contracting provides ${service} for ${clientType} across metro Atlanta. We're DBE/MBE certified and carry full insurance coverage.\n\n` +
        `Would it make sense to connect for 10 minutes this week? I can share our capabilities and pricing relevant to your portfolio.\n\n` +
        `Best regards,\n` +
        `${OWNER.name}\n` +
        `${OWNER.companyShort}\n` +
        `${OWNER.phone}\n` +
        `${OWNER.email}`
      );
    },
  },
};

/**
 * List available template types with metadata.
 */
export function listTemplates() {
  return Object.entries(TEMPLATE_DEFS).map(([id, def]) => ({
    id,
    label: def.label,
    description: def.description,
  }));
}

/**
 * Render a template into { subject, body } using context fields.
 *
 * @param {string} templateId - One of the TEMPLATE_DEFS keys
 * @param {object} context - Merge fields (title, agency, contactName, contactEmail, etc.)
 * @returns {{ subject: string, body: string }}
 */
export function renderTemplate(templateId, context = {}) {
  const def = TEMPLATE_DEFS[templateId];
  if (!def) {
    throw new Error(`Unknown rapid-response template: ${templateId}`);
  }
  return {
    subject: def.renderSubject(context),
    body: def.renderBody(context),
  };
}

/**
 * Build context from a Proposal Flow proposal record.
 */
export function proposalToContext(proposal) {
  return {
    title: proposal.title || '',
    agency: proposal.agency || '',
    solicitationNumber: proposal.metadata?.solicitationNumber || proposal.solicitationNumber || '',
    contactName: proposal.metadata?.contactName || proposal.contactName || '',
    contactEmail: proposal.metadata?.contactEmail || proposal.contactEmail || '',
    contactCompany: proposal.metadata?.contactCompany || proposal.agency || '',
    type: proposal.metadata?.type || 'solicitation',
    service: proposal.metadata?.service || '',
    organization: proposal.agency || '',
    reason: '',
    clientType: '',
  };
}
