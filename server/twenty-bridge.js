/**
 * Twenty CRM bridge routes.
 *
 * This router exposes read-through CRM surfaces to Proposal Flow.
 * Queue-backed write endpoints live in `server.js` under the CRM execution routes.
 */

import { Router } from 'express';
import * as bridge from './bridge/crm-bridge.js';
import { getTwentyExecutionStatus } from './twenty-execution.js';

const router = Router();

router.get('/status', async (_req, res) => {
  try {
    const status = await bridge.getIntegrationStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check integration status', detail: err.message });
  }
});

router.get('/execution/status', async (_req, res) => {
  try {
    const status = await getTwentyExecutionStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check execution status', detail: err.message });
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const data = await bridge.getDashboard();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Dashboard bridge failed', detail: err.message });
  }
});

router.get('/companies', async (_req, res) => {
  try {
    const result = await bridge.getCompanies();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Companies bridge failed', detail: err.message });
  }
});

router.get('/contacts', async (_req, res) => {
  try {
    const result = await bridge.getContacts();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Contacts bridge failed', detail: err.message });
  }
});

router.get('/opportunities', async (_req, res) => {
  try {
    const result = await bridge.getOpportunities();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Opportunities bridge failed', detail: err.message });
  }
});

router.get('/tasks', async (_req, res) => {
  try {
    const result = await bridge.getTasks();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Tasks bridge failed', detail: err.message });
  }
});

router.get('/activities', async (_req, res) => {
  try {
    const result = await bridge.getActivities();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Activities bridge failed', detail: err.message });
  }
});

router.get('/pipeline', async (_req, res) => {
  try {
    const dashboard = await bridge.getDashboard();
    res.json({
      closestToCash: dashboard.closestToCash,
      blocked: dashboard.blocked,
      urgentActions: dashboard.urgentActions,
      pipeline: dashboard.pipeline,
    });
  } catch (err) {
    res.status(500).json({ error: 'Pipeline view failed', detail: err.message });
  }
});

router.get('/overdue', async (_req, res) => {
  try {
    const dashboard = await bridge.getDashboard();
    res.json({
      overdue: dashboard.overdue,
      dueThisWeek: dashboard.dueThisWeek,
      taskSummary: dashboard.taskSummary,
    });
  } catch (err) {
    res.status(500).json({ error: 'Overdue view failed', detail: err.message });
  }
});

export default router;
