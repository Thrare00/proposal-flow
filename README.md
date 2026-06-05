# Proposal Flow

Proposal Flow is a local-first government proposal operating system built with React/Vite on the frontend and an Express JSON runtime on the backend.

## Workflow

Proposal Flow now treats these stages as first-class application concepts:

1. `Ingestion`
2. `Compliance`
3. `Strategy`
4. `Outline`
5. `Drafting`
6. `Red Team`
7. `Final Review`

Whole-proposal drafting is gated until ingestion, compliance, strategy, and outline are complete.

## Core proposal entities

Each proposal is normalized into structured GovCon entities instead of loose text blobs:

- `Opportunity`
- `SolicitationDocument`
- `Requirement`
- `EvaluationFactor`
- `ComplianceMatrix`
- `ProposalSection`
- `Artifact`
- `PastPerformanceRecord`
- `CapabilityStatement`
- `PartnerProfile`
- `RedTeamFinding`
- `SubmissionPackage`

## Model routing

Model routing is centralized in the shared workflow layer:

- `GPT-5.4` is the default writer for extraction, compliance, outline generation, drafting, red-team, and final review.
- `Claude Sonnet` is the default rewrite/polish lane.
- `Claude Opus` is the escalation lane for hard strategic section rewrites.
- cheaper models are reserved for low-risk bulk work.

If a configured provider is unavailable, Proposal Flow falls back to the default writer and records that fallback in the workflow metadata.

## Local runtime

The local server exposes proposal workflow actions under `/proposal-flow/api/proposals/:id/...` for:

- compliance build
- strategy generation
- annotated outline generation
- section drafting
- section polish / escalation
- red-team review
- final review

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Local production-style preview

```bash
npm run serve:local
```

Then open:

- `http://localhost:5010/proposal-flow`
