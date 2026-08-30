const { isMemory, getMemStore } = require('../config/db');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const Notification = require('../models/Notification');
const workflowService = require('./workflowService');
const orchestrator = require('../agents/orchestrator');
const { emit } = require('../config/socket');
const { v4: uuidv4 } = require('uuid');

const ownerId = (user) => user._id?.toString() || user.id;

// ── Trigger ───────────────────────────────────────────────────────────────────
const trigger = async (workflowId, user, inputs = {}) => {
  const workflow = await workflowService.getById(workflowId, user);
  const snapshot = JSON.parse(JSON.stringify(workflow));
  const userId = ownerId(user);

  let execution;
  if (isMemory()) {
    execution = { _id: uuidv4(), workflowId, workflowSnapshot: snapshot, status: 'PENDING', inputs, retryCount: 0, startTime: new Date(), triggeredBy: userId, createdAt: new Date() };
    execution.id = execution._id;
    getMemStore().executions.push(execution);
  } else {
    execution = await Execution.create({ workflowId, workflowSnapshot: snapshot, status: 'PENDING', inputs, triggeredBy: userId });
  }

  // Run async (non-blocking)
  setImmediate(() => runExecution(execution, workflow, userId));

  return execution;
};

const runExecution = async (execution, workflow, userId) => {
  const execId = execution._id?.toString() || execution.id;
  await updateStatus(execId, 'RUNNING', { startTime: new Date() });
  emit(`execution:${execId}`, 'execution:started', { executionId: execId, status: 'RUNNING' });

  try {
    const result = await orchestrator.run(execution, workflow, userId);
    await updateStatus(execId, 'COMPLETED', { endTime: new Date(), outputs: result.outputs, duration: Date.now() - new Date(execution.startTime).getTime() });
    emit(`execution:${execId}`, 'execution:completed', { executionId: execId, status: 'COMPLETED', outputs: result.outputs });
    await createNotification(userId, workflow._id || workflow.id, execId, 'success', `Workflow "${workflow.name}" completed`, 'Execution finished successfully');
  } catch (err) {
    await updateStatus(execId, 'FAILED', { endTime: new Date(), error: err.message });
    emit(`execution:${execId}`, 'execution:failed', { executionId: execId, status: 'FAILED', error: err.message });
    await createNotification(userId, workflow._id || workflow.id, execId, 'failure', `Workflow "${workflow.name}" failed`, err.message);
  }
};

const updateStatus = async (execId, status, extra = {}) => {
  if (isMemory()) {
    const store = getMemStore();
    const idx = store.executions.findIndex(e => e._id === execId || e.id === execId);
    if (idx >= 0) store.executions[idx] = { ...store.executions[idx], status, ...extra };
    return;
  }
  await Execution.findByIdAndUpdate(execId, { status, ...extra });
};

const createNotification = async (userId, workflowId, executionId, type, title, message) => {
  if (isMemory()) {
    const n = { _id: uuidv4(), owner: userId, workflowId, executionId, type, title, message, isRead: false, createdAt: new Date() };
    getMemStore().notifications.push(n);
    emit(`user:${userId}`, 'notification:new', n);
    return n;
  }
  const n = await Notification.create({ owner: userId, workflowId, executionId, type, title, message });
  emit(`user:${userId}`, 'notification:new', n);
  return n;
};

// ── List / Get ────────────────────────────────────────────────────────────────
const list = async (user, { page = 1, limit = 20, status } = {}) => {
  if (isMemory()) {
    const store = getMemStore();
    const userWorkflowIds = store.workflows.filter(w => w.owner === ownerId(user)).map(w => w._id);
    let items = store.executions.filter(e => userWorkflowIds.includes(e.workflowId));
    if (status) items = items.filter(e => e.status === status);
    items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = items.length;
    return { executions: items.slice((page - 1) * limit, page * limit), total, page, pages: Math.ceil(total / limit) };
  }
  const userWorkflowIds = await Workflow.find({ owner: ownerId(user) }).distinct('_id');
  const query = { workflowId: { $in: userWorkflowIds } };
  if (status) query.status = status;
  const [executions, total] = await Promise.all([
    Execution.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('workflowId', 'name'),
    Execution.countDocuments(query),
  ]);
  return { executions, total, page, pages: Math.ceil(total / limit) };
};

const getById = async (id, user) => {
  if (isMemory()) {
    const e = getMemStore().executions.find(e => e._id === id || e.id === id);
    if (!e) throw Object.assign(new Error('Execution not found'), { status: 404 });
    return e;
  }
  const e = await Execution.findById(id).populate('workflowId', 'name');
  if (!e) throw Object.assign(new Error('Execution not found'), { status: 404 });
  return e;
};

const getTimeline = async (id) => {
  if (isMemory()) {
    return getMemStore().executionLogs.filter(l => l.executionId === id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
  return ExecutionLog.find({ executionId: id }).sort({ createdAt: 1 });
};

const pause = async (id, user) => {
  await updateStatus(id, 'PAUSED');
  emit(`execution:${id}`, 'execution:paused', { executionId: id });
  return getById(id, user);
};

const resume = async (id, user) => {
  await updateStatus(id, 'RUNNING');
  emit(`execution:${id}`, 'execution:resumed', { executionId: id });
  return getById(id, user);
};

const cancel = async (id, user) => {
  await updateStatus(id, 'CANCELLED', { endTime: new Date() });
  emit(`execution:${id}`, 'execution:cancelled', { executionId: id });
  return getById(id, user);
};

module.exports = { trigger, list, getById, getTimeline, pause, resume, cancel };
