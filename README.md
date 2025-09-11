# Proposal Flow - Vite SPA Deployment

> Last deployment: 2025-09-11 13:15:00 UTC

A modern proposal management tool built with React, Vite, and TypeScript.

## Environment Variables

Create `.env.development` and `.env.production` files in the project root with the following variables:

```
VITE_QUEUE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_QUEUE_TOKEN=your_token_here
```

- `VITE_QUEUE_URL`: Google Apps Script Web App URL (must end with /exec)
- `VITE_QUEUE_TOKEN`: Bearer token for authentication

## Development

Run the development server:
```bash
npm run dev
```

## Build & Deploy

```bash
npm run build
npm run build:gh
```

## Cloud Queue Integration

Jobs are enqueued to the Google Apps Script Web App and appear in:
`Rare Earth Ltd GovCon/00_Config/cloud_queue.json`

They are processed by the local watcher which updates the pipeline workbook.
