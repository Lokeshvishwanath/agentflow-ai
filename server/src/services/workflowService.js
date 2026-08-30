const { isMemory, getMemStore } = require('../config/db');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const { v4: uuidv4 } = require('uuid');

const ownerId = (user) => user._id?.toString() || user.id;

// ── helpers ──────────────────────────────────────────────────────────────────
const memFind = (owner) => getMemStore().workflows.filter(w => w.owner === owner && w.status !== 'archived');

// ── CRUD ─────────────────────────────────────────────────────────────────────
const list = async (user, { page = 1, limit = 20, search = '', status } = {}) => {
  if (isMemory()) {
    let items = memFind(ownerId(user));
    if (search) items = items.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
    if (status) items = items.filter(w => w.status === status);
    const total = items.length;
    return { workflows: items.slice((page - 1) * limit, page * limit), total, page, pages: Math.ceil(total / limit) };
  }
  const query = { owner: ownerId(user) };
  if (search) query.name = { $regex: search, $options: 'i' };
  if (status) query.status = status;
  const [workflows, total] = await Promise.all([
    Workflow.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Workflow.countDocuments(query),
  ]);
  return { workflows, total, page, pages: Math.ceil(total / limit) };
};

const getById = async (id, user) => {
  if (isMemory()) {
    const w = getMemStore().workflows.find(w => w._id === id && w.owner === ownerId(user));
    if (!w) throw Object.assign(new Error('Workflow not found'), { status: 404 });
    return w;
  }
  const w = await Workflow.findOne({ _id: id, owner: ownerId(user) });
  if (!w) throw Object.assign(new Error('Workflow not found'), { status: 404 });
  return w;
};

const create = async (data, user) => {
  if (isMemory()) {
    const w = { _id: uuidv4(), ...data, owner: ownerId(user), version: 1, status: 'draft', nodes: data.nodes || [], edges: data.edges || [], tags: data.tags || [], createdAt: new Date(), updatedAt: new Date() };
    getMemStore().workflows.push(w);
    return w;
  }
  return Workflow.create({ ...data, owner: ownerId(user) });
};

const update = async (id, data, user) => {
  if (isMemory()) {
    const store = getMemStore();
    const idx = store.workflows.findIndex(w => w._id === id && w.owner === ownerId(user));
    if (idx === -1) throw Object.assign(new Error('Workflow not found'), { status: 404 });
    store.workflows[idx] = { ...store.workflows[idx], ...data, version: (store.workflows[idx].version || 1) + 1, updatedAt: new Date() };
    return store.workflows[idx];
  }
  const w = await Workflow.findOneAndUpdate(
    { _id: id, owner: ownerId(user) },
    { ...data, $inc: { version: 1 } },
    { new: true }
  );
  if (!w) throw Object.assign(new Error('Workflow not found'), { status: 404 });
  return w;
};

const duplicate = async (id, user) => {
  const original = await getById(id, user);
  const copy = {
    name: `${original.name} (copy)`,
    description: original.description,
    nodes: original.nodes,
    edges: original.edges,
    triggerConfig: original.triggerConfig,
    tags: original.tags,
  };
  return create(copy, user);
};

const remove = async (id, user) => {
  if (isMemory()) {
    const store = getMemStore();
    const idx = store.workflows.findIndex(w => w._id === id && w.owner === ownerId(user));
    if (idx === -1) throw Object.assign(new Error('Workflow not found'), { status: 404 });
    store.workflows.splice(idx, 1);
    return;
  }
  const w = await Workflow.findOneAndDelete({ _id: id, owner: ownerId(user) });
  if (!w) throw Object.assign(new Error('Workflow not found'), { status: 404 });
};

const dashboard = async (user) => {
  if (isMemory()) {
    const store = getMemStore();
    const uid = ownerId(user);
    const workflows = store.workflows.filter(w => w.owner === uid);
    const executions = store.executions.filter(e => workflows.some(w => w._id === e.workflowId));
    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'active').length,
      totalExecutions: executions.length,
      successRate: executions.length ? Math.round(executions.filter(e => e.status === 'COMPLETED').length / executions.length * 100) : 0,
      recentExecutions: executions.slice(-5).reverse(),
    };
  }
  const [totalWorkflows, activeWorkflows, totalExecutions, completedExecutions] = await Promise.all([
    Workflow.countDocuments({ owner: ownerId(user) }),
    Workflow.countDocuments({ owner: ownerId(user), status: 'active' }),
    Execution.countDocuments({ workflowId: { $in: await Workflow.find({ owner: ownerId(user) }).distinct('_id') } }),
    Execution.countDocuments({ workflowId: { $in: await Workflow.find({ owner: ownerId(user) }).distinct('_id') }, status: 'COMPLETED' }),
  ]);
  const recentExecutions = await Execution.find({
    workflowId: { $in: await Workflow.find({ owner: ownerId(user) }).distinct('_id') }
  }).sort({ createdAt: -1 }).limit(5).populate('workflowId', 'name');
  return {
    totalWorkflows, activeWorkflows, totalExecutions,
    successRate: totalExecutions ? Math.round(completedExecutions / totalExecutions * 100) : 0,
    recentExecutions,
  };
};

module.exports = { list, getById, create, update, duplicate, remove, dashboard };
