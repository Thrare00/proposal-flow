# Rapid Response SOP

## 3-5 Minute Acknowledgment Rule

Every inbound solicitation, inquiry, or contact discovery must receive an acknowledgment within **3 to 5 minutes** of capture. This is a hard operational standard.

### What counts as inbound
- New solicitation matching our NAICS/service profile
- Direct inquiry from a procurement officer or property manager
- Contact discovered through public records or email discovery
- Warm response to outreach (accepted connect, reply, referral)

### Required actions on inbound

| Step | Target Time | Action |
|------|-------------|--------|
| 1 | 0-30 seconds | Log to Proposal Flow (intake stage) |
| 2 | 30 sec - 2 min | Send acknowledgment using template |
| 3 | 2-5 min | Attach discovery questions if applicable |
| 4 | Within 24 hours | Full qualification review and substantive follow-up |

### On contact discovery
When public contact discovery surfaces a viable decision-maker:
1. Create the Proposal Flow record immediately
2. Draft the outreach email using the contact-discovery template
3. Place the draft in Gmail (`rareearthcontracting@gmail.com`)
4. Flag for Eric's review if the target is high-value ($1,000+)

### Templates available
- `inbound-acknowledgment.md` - First touch for new solicitations/inquiries
- `prime-teaming-intro.md` - Teaming outreach to prime contractors
- `property-manager-vendor-qualification.md` - Vendor qualification reply
- `contact-discovery-outreach.md` - Outreach to discovered contacts

### Failure modes
- **Late response (>5 min):** Escalate as red alert. Document reason.
- **No acknowledgment sent:** Treat as critical failure. Log blocker.
- **Template not personalized:** Minimum personalization = recipient name + specific solicitation/property reference. Generic templates without these are not acceptable.

### Stale inbound tracking
Proposal Flow Dashboard surfaces unacknowledged inbound items automatically. Any item showing in the "Stale inbound" counter needs immediate action.

---

## Gmail Draft Automation

### API Endpoints
- `GET /proposal-flow/api/rapid-response/templates` - List available template types
- `POST /proposal-flow/api/proposals/:id/draft-email` - Preview or create Gmail draft

### Draft-email payload
```json
{
  "templateId": "inbound-acknowledgment",
  "overrides": { "contactName": "...", "contactEmail": "..." },
  "createDraft": true
}
```
When `createDraft` is false (default), returns rendered `{ subject, body }` for preview.
When `createDraft` is true and `contactEmail` is provided, creates an actual Gmail draft in `rareearthcontracting@gmail.com`.

### Automation rules
| Signal | Template | Target | SLA |
|--------|----------|--------|-----|
| Inbound lead / inquiry / hiring signal | `inbound-acknowledgment` | Gmail draft | Within 3-5 minutes |
| Public contact discovery | `contact-discovery-outreach` | Gmail draft | Immediate |
| Solicitation with teaming opportunity | `prime-teaming-intro` | Gmail draft | Same session |
| Vendor qualification request | `property-manager-vendor-qualification` | Gmail draft | Same session |

### Programmatic usage (Morpheus / automation)
```bash
# Create draft via API
curl -X POST http://localhost:5174/proposal-flow/api/proposals/PROPOSAL_ID/draft-email \
  -H 'Content-Type: application/json' \
  -d '{"templateId":"inbound-acknowledgment","overrides":{"contactEmail":"buyer@agency.gov","contactName":"Jane Doe"},"createDraft":true}'
```

### UI
The Proposal Details page includes a "Rapid Response Drafts" panel with Preview and Create Draft buttons for each template type. Recipient name and email can be overridden inline.
