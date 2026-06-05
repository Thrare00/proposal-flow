# Proposal Flow — Agent Context

## Owner
Eric White, Rare Earth LTD (DBA Thrare Contracting). Government contracting + facility services.

## Architecture
- **Server**: Express ESM at port 5174, base path `/proposal-flow`
- **DB**: `server/data/automation-db.json` (JSON file store, cached in memory)
- **CRM**: Twenty CRM at localhost:3000, GraphQL at `/graphql`
- **Bridge**: PF server → Twenty (primary) → Legacy CRM (fallback). Mode: read-write.

## Key Paths
- Running server: `/mnt/c/Users/ericw/proposal-flow/proposal-flow/server.js`
- Automation worker: `server/automation-worker.js` — job queue, stage logic, checklist, cadence
- Twenty execution: `server/twenty-execution.js` — GraphQL mutations + normalization
- Twenty client: `server/bridge/twenty-client.js` — API client (read + write)
- CRM actions UI: `src/components/CrmActions.jsx`
- Openclaw copy (secondary): `/home/ericw/.openclaw/workspace/skills/proposal-flow/frontend/`

## Workflow Stages
`intake → qualification → pre_solicitation → research → technical_compliance → pricing_packaging → drafting → review → google_docs_final → submitted`

## Twenty CRM Stages
`NEW → SCREENING → MEETING → PROPOSAL → CUSTOMER`

## Stage Mapping (PF → Twenty)
intake=NEW, qualification=SCREENING, pre_solicitation=SCREENING, research=MEETING, technical_compliance=MEETING, pricing_packaging=PROPOSAL, drafting=PROPOSAL, review=PROPOSAL, google_docs_final=PROPOSAL, submitted=CUSTOMER

## Execution Pipeline
- POST `/crm/execute` → `previewTwentyExecution()` → enqueue `sync_twenty_execution` → worker → `executeTwentyExecution()`
- Actions: advance_stage, complete_task, log_activity, accept, mark_won, mark_lost, set_next_action
- Stage auto-advance: when all tasks for a stage complete, auto-advance + sync Twenty
- Outreach cadence: touch intervals by priority × temperature, runs MON/WED
- Inbound auto-intake: SAM proposals auto-create Twenty opportunities

## GraphQL Notes
- Relay pagination: `edges { node { ... } }`
- Amount: `{ amountMicros, currencyCode }` — dollars × 1,000,000
- Task body: `bodyV2 { markdown }` for create, `body` for read
- domainName: Links object `{ primaryLinkUrl, primaryLinkLabel }` (NOT scalar)
- Stage/status enums must be unquoted in mutations

## Conventions
- `updateDb(db => { ...; return db; })` — synchronous DB update with auto-save
- `enqueueJobs([{ action, payload }])` + `setImmediate(() => safeRunWorkerPass())` — async job queue
- `afterCommit` pattern in worker for async post-commit operations
- `sanitizeProposal()` / `normalizeProposal()` — always normalize before storing
- Token auth: `requireQueueToken` middleware (skipped in dev mode)
