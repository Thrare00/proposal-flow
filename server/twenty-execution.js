import {
  getStatus as getTwentyClientStatus,
  isHealthy,
  runTwentyGraphql,
} from './bridge/twenty-client.js';

const VALID_TASK_STATUSES = new Set(['TODO', 'IN_PROGRESS', 'DONE']);
const OPPORTUNITY_UPDATE_FIELDS = ['nextAction', 'nextActionDate', 'blockerStatus', 'priority', 'stage'];

function normalizeString(value) {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeNullableString(value) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function toIsoDateTime(value, label, errors) {
  if (value == null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${label} must be a valid date or ISO timestamp`);
    return null;
  }

  return parsed.toISOString();
}

function buildTaskBody(task) {
  if (task.body != null) return String(task.body);
  if (task.description != null) return String(task.description);
  return '';
}

function buildNoteTitle(note) {
  const providedTitle = normalizeString(note.title);
  if (providedTitle) return providedTitle;

  const body = normalizeString(note.body);
  if (!body) return 'Proposal Flow note';

  return body.split('\n')[0].slice(0, 80) || 'Proposal Flow note';
}

function normalizeOpportunityUpdate(input, errors) {
  const update = input.update && typeof input.update === 'object' ? input.update : {};
  const opportunityUpdate = input.opportunityUpdate && typeof input.opportunityUpdate === 'object'
    ? input.opportunityUpdate
    : {};
  const merged = { ...opportunityUpdate, ...update };

  for (const field of OPPORTUNITY_UPDATE_FIELDS) {
    if (input[field] !== undefined && merged[field] === undefined) {
      merged[field] = input[field];
    }
  }

  const normalized = {};
  if (merged.nextAction !== undefined) normalized.nextAction = normalizeString(merged.nextAction);
  if (merged.nextActionDate !== undefined) normalized.nextActionDate = toIsoDateTime(merged.nextActionDate, 'update.nextActionDate', errors);
  if (merged.blockerStatus !== undefined) normalized.blockerStatus = normalizeString(merged.blockerStatus);
  if (merged.priority !== undefined) normalized.priority = normalizeString(merged.priority);
  if (merged.stage !== undefined) normalized.stage = normalizeString(merged.stage);

  const fields = Object.entries(normalized).filter(([, value]) => value !== undefined);
  if (fields.length === 0) return null;

  return Object.fromEntries(fields);
}

function normalizeTask(item, index, fallbackTargets, errors, warnings) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`tasks[${index}] must be an object`);
    return null;
  }

  const title = normalizeString(item.title);
  if (!title) {
    errors.push(`tasks[${index}].title is required`);
    return null;
  }

  const dueAt = toIsoDateTime(item.dueAt ?? item.dueDate, `tasks[${index}].dueAt`, errors);
  const normalizedStatus = normalizeString(item.status || 'TODO').toUpperCase();
  const status = VALID_TASK_STATUSES.has(normalizedStatus) ? normalizedStatus : 'TODO';
  if (!VALID_TASK_STATUSES.has(normalizedStatus)) {
    warnings.push(`tasks[${index}].status "${normalizedStatus}" is unsupported; defaulted to TODO`);
  }

  const opportunityId = normalizeNullableString(item.opportunityId) || fallbackTargets.opportunityId;
  const companyId = normalizeNullableString(item.companyId) || fallbackTargets.companyId;
  if (!opportunityId && !companyId) {
    warnings.push(`tasks[${index}] has no opportunity/company target and may be created unlinked`);
  }

  return {
    title,
    body: buildTaskBody(item),
    dueAt,
    status,
    opportunityId,
    companyId,
  };
}

function normalizeNote(item, index, fallbackTargets, errors, warnings) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`notes[${index}] must be an object`);
    return null;
  }

  const body = item.body == null ? '' : String(item.body);
  const title = buildNoteTitle(item);

  if (!title && !normalizeString(body)) {
    errors.push(`notes[${index}] requires title or body`);
    return null;
  }

  const opportunityId = normalizeNullableString(item.opportunityId) || fallbackTargets.opportunityId;
  const companyId = normalizeNullableString(item.companyId) || fallbackTargets.companyId;
  if (!opportunityId && !companyId) {
    warnings.push(`notes[${index}] has no opportunity/company target and may be created unlinked`);
  }

  return {
    title,
    body,
    opportunityId,
    companyId,
  };
}

export function normalizeTwentyExecutionRequest(rawInput = {}, targetOverrides = {}) {
  const input = rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput) ? rawInput : {};
  const errors = [];
  const warnings = [];

  const opportunityId = normalizeNullableString(targetOverrides.opportunityId) || normalizeNullableString(input.opportunityId);
  const companyId = normalizeNullableString(targetOverrides.companyId) || normalizeNullableString(input.companyId);
  const proposalId = normalizeNullableString(input.proposalId);
  const dryRun = input.dryRun === true;
  const source = normalizeString(input.source) || 'proposal-flow';

  const update = normalizeOpportunityUpdate(input, errors);
  if (update && !opportunityId) {
    errors.push('opportunityId is required for opportunity updates');
  }

  const fallbackTargets = { opportunityId, companyId };
  const tasks = Array.isArray(input.tasks)
    ? input.tasks
      .map((item, index) => normalizeTask(item, index, fallbackTargets, errors, warnings))
      .filter(Boolean)
    : [];

  const notes = Array.isArray(input.notes)
    ? input.notes
      .map((item, index) => normalizeNote(item, index, fallbackTargets, errors, warnings))
      .filter(Boolean)
    : [];

  if (!update && tasks.length === 0 && notes.length === 0) {
    errors.push('At least one operation is required: update, tasks, or notes');
  }

  const hasTarget = Boolean(
    opportunityId
      || companyId
      || tasks.some((task) => task.opportunityId || task.companyId)
      || notes.some((note) => note.opportunityId || note.companyId),
  );
  if (!hasTarget) {
    errors.push('At least one opportunityId or companyId target is required');
  }

  const payload = {
    opportunityId,
    companyId,
    proposalId,
    dryRun,
    source,
    update,
    tasks,
    notes,
  };

  return {
    ok: errors.length === 0,
    message: errors.length === 0 ? 'Twenty execution payload validated' : 'Twenty execution payload invalid',
    errors,
    warnings,
    payload,
    summary: {
      updateFields: update ? Object.keys(update) : [],
      taskCount: tasks.length,
      noteCount: notes.length,
      operationCount: (update ? 1 : 0) + tasks.length + notes.length,
    },
    configured: getTwentyClientStatus().configured,
    baseUrl: getTwentyClientStatus().baseUrl,
  };
}

export async function previewTwentyExecution(rawInput = {}, targetOverrides = {}) {
  return normalizeTwentyExecutionRequest(rawInput, targetOverrides);
}

async function updateTwentyOpportunity(opportunityId, patch = {}) {
  const data = {};

  if (patch.nextAction !== undefined) data.nextAction = patch.nextAction;
  if (patch.nextActionDate !== undefined) data.nextActionDate = patch.nextActionDate;
  if (patch.blockerStatus !== undefined) data.blockerStatus = patch.blockerStatus;
  if (patch.priority !== undefined) data.priority = patch.priority;
  if (patch.stage !== undefined) data.stage = patch.stage;

  if (Object.keys(data).length === 0) return null;

  const response = await runTwentyGraphql(
    `mutation UpdateOpportunity($id: UUID!, $data: OpportunityUpdateInput!) {
      updateOpportunity(id: $id, data: $data) {
        id
        name
        nextAction
        nextActionDate
        blockerStatus
        priority
        stage
      }
    }`,
    { id: opportunityId, data },
  );

  return response?.updateOpportunity || null;
}

async function tryLinkTarget(targetId, linkQueries) {
  for (const query of linkQueries) {
    try {
      const result = await runTwentyGraphql(query.document, query.variables(targetId));
      return {
        ok: true,
        via: query.name,
        result,
      };
    } catch (error) {
      if (query === linkQueries[linkQueries.length - 1]) {
        return {
          ok: false,
          via: query.name,
          error: error.message,
        };
      }
    }
  }

  return {
    ok: false,
    via: linkQueries[linkQueries.length - 1]?.name || 'unknown',
    error: 'Target link failed',
  };
}

async function linkTwentyTask(taskId, task) {
  const linkedTargets = [];
  const warnings = [];

  if (task.opportunityId) {
    const result = await tryLinkTarget(task.opportunityId, [
      {
        name: 'createTaskTarget.opportunity',
        document: `mutation LinkTaskOpportunity($taskId: UUID!, $targetId: UUID!) {
          createTaskTarget(data: { taskId: $taskId, targetOpportunityId: $targetId }) { id }
        }`,
        variables: (targetId) => ({ taskId, targetId }),
      },
    ]);

    if (result.ok) {
      linkedTargets.push({ type: 'opportunity', id: task.opportunityId, via: result.via });
    } else {
      warnings.push(`Task "${task.title}" was created but could not link to opportunity ${task.opportunityId}: ${result.error}`);
    }
  }

  if (task.companyId) {
    const result = await tryLinkTarget(task.companyId, [
      {
        name: 'createTaskTarget.company',
        document: `mutation LinkTaskCompany($taskId: UUID!, $targetId: UUID!) {
          createTaskTarget(data: { taskId: $taskId, targetCompanyId: $targetId }) { id }
        }`,
        variables: (targetId) => ({ taskId, targetId }),
      },
    ]);

    if (result.ok) {
      linkedTargets.push({ type: 'company', id: task.companyId, via: result.via });
    } else {
      warnings.push(`Task "${task.title}" was created but could not link to company ${task.companyId}: ${result.error}`);
    }
  }

  return { linkedTargets, warnings };
}

async function createTwentyTask(task = {}) {
  const response = await runTwentyGraphql(
    `mutation CreateTask($title: String!, $body: String!, $dueAt: DateTime, $status: TaskStatus) {
      createTask(data: {
        title: $title,
        bodyV2: { markdown: $body },
        dueAt: $dueAt,
        status: $status
      }) {
        id
        title
        dueAt
        status
      }
    }`,
    {
      title: task.title,
      body: task.body || '',
      dueAt: task.dueAt || null,
      status: task.status || 'TODO',
    },
  );

  const createdTask = response?.createTask || null;
  if (!createdTask?.id) {
    throw new Error(`Task "${task.title}" did not return an id`);
  }

  const linkResult = await linkTwentyTask(createdTask.id, task);

  return {
    ...createdTask,
    linkedTargets: linkResult.linkedTargets,
    warnings: linkResult.warnings,
  };
}

async function linkTwentyNote(noteId, note) {
  const linkedTargets = [];
  const warnings = [];

  if (note.opportunityId) {
    try {
      await runTwentyGraphql(
        `mutation LinkNoteOpportunity($noteId: UUID!, $targetId: UUID!) {
          createNoteTarget(data: { noteId: $noteId, targetOpportunityId: $targetId }) { id }
        }`,
        { noteId, targetId: note.opportunityId },
      );
      linkedTargets.push({ type: 'opportunity', id: note.opportunityId, via: 'createNoteTarget.opportunity' });
    } catch (error) {
      warnings.push(`Note "${note.title}" was created but could not link to opportunity ${note.opportunityId}: ${error.message}`);
    }
  }

  if (note.companyId) {
    try {
      await runTwentyGraphql(
        `mutation LinkNoteCompany($noteId: UUID!, $targetId: UUID!) {
          createNoteTarget(data: { noteId: $noteId, targetCompanyId: $targetId }) { id }
        }`,
        { noteId, targetId: note.companyId },
      );
      linkedTargets.push({ type: 'company', id: note.companyId, via: 'createNoteTarget.company' });
    } catch (error) {
      warnings.push(`Note "${note.title}" was created but could not link to company ${note.companyId}: ${error.message}`);
    }
  }

  return { linkedTargets, warnings };
}

async function createTwentyNote(note = {}) {
  const response = await runTwentyGraphql(
    `mutation CreateNote($title: String!, $body: String!) {
      createNote(data: { title: $title, bodyV2: { markdown: $body } }) {
        id
        title
      }
    }`,
    {
      title: note.title,
      body: note.body || '',
    },
  );

  const createdNote = response?.createNote || null;
  if (!createdNote?.id) {
    throw new Error(`Note "${note.title}" did not return an id`);
  }

  const linkResult = await linkTwentyNote(createdNote.id, note);

  return {
    ...createdNote,
    linkedTargets: linkResult.linkedTargets,
    warnings: linkResult.warnings,
  };
}

export async function executeTwentyExecution(rawInput = {}, targetOverrides = {}) {
  const preview = normalizeTwentyExecutionRequest(rawInput, targetOverrides);
  if (!preview.ok) {
    const error = new Error(preview.errors.join('; '));
    error.preview = preview;
    throw error;
  }

  if (preview.payload.dryRun) {
    return {
      ...preview,
      ok: true,
      dryRun: true,
      executed: false,
      message: 'Twenty execution dry-run validated',
    };
  }

  if (!preview.configured) {
    throw new Error('Twenty execution unavailable: TWENTY_API_TOKEN missing');
  }

  const payload = preview.payload;
  const taskErrors = [];
  const noteErrors = [];
  const warnings = [...preview.warnings];
  const appliedTasks = [];
  const appliedNotes = [];

  const opportunityUpdate = payload.update
    ? await updateTwentyOpportunity(payload.opportunityId, payload.update)
    : null;

  for (const task of payload.tasks) {
    try {
      const createdTask = await createTwentyTask(task);
      warnings.push(...(createdTask.warnings || []));
      appliedTasks.push({
        id: createdTask.id,
        title: createdTask.title,
        dueAt: createdTask.dueAt,
        status: createdTask.status,
        linkedTargets: createdTask.linkedTargets || [],
      });
    } catch (error) {
      taskErrors.push({
        title: task.title,
        error: error.message,
      });
    }
  }

  for (const note of payload.notes) {
    try {
      const createdNote = await createTwentyNote(note);
      warnings.push(...(createdNote.warnings || []));
      appliedNotes.push({
        id: createdNote.id,
        title: createdNote.title,
        linkedTargets: createdNote.linkedTargets || [],
      });
    } catch (error) {
      noteErrors.push({
        title: note.title,
        error: error.message,
      });
    }
  }

  if (payload.tasks.length > 0 && appliedTasks.length === 0 && taskErrors.length > 0 && !opportunityUpdate && appliedNotes.length === 0) {
    throw new Error(taskErrors[0].error);
  }

  if (payload.notes.length > 0 && appliedNotes.length === 0 && noteErrors.length > 0 && !opportunityUpdate && appliedTasks.length === 0) {
    throw new Error(noteErrors[0].error);
  }

  const errors = [
    ...taskErrors.map((entry) => ({ type: 'task.create', ...entry })),
    ...noteErrors.map((entry) => ({ type: 'note.create', ...entry })),
  ];

  return {
    ok: errors.length === 0,
    dryRun: false,
    executed: true,
    message: errors.length === 0 ? 'Twenty execution applied' : 'Twenty execution applied with partial failures',
    payload,
    summary: preview.summary,
    warnings,
    errors,
    applied: {
      opportunityUpdate,
      tasks: appliedTasks,
      notes: appliedNotes,
    },
  };
}

export async function getTwentyExecutionStatus({ includeHealth = true } = {}) {
  const status = getTwentyClientStatus();
  const healthy = includeHealth
    ? await isHealthy().catch(() => false)
    : status.healthy;

  return {
    configured: status.configured,
    healthy,
    baseUrl: status.baseUrl,
    lastCheck: status.lastCheck,
    mode: status.configured ? 'queue-backed writes' : 'disabled',
    supportedOperations: [
      'opportunity.update',
      'task.create',
      'note.create',
    ],
  };
}
