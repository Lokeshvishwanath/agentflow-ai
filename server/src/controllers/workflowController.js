const workflowService = require('../services/workflowService');
const executionService = require('../services/executionService');
const aiService = require('../services/aiService');

const list = async (req, res, next) => {
  try {
    const result = await workflowService.list(req.user, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const workflow = await workflowService.getById(req.params.id, req.user);
    res.json({ success: true, workflow });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const workflow = await workflowService.create(req.body, req.user);
    res.status(201).json({ success: true, workflow });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const workflow = await workflowService.update(req.params.id, req.body, req.user);
    res.json({ success: true, workflow });
  } catch (err) { next(err); }
};

const duplicate = async (req, res, next) => {
  try {
    const workflow = await workflowService.duplicate(req.params.id, req.user);
    res.status(201).json({ success: true, workflow });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await workflowService.remove(req.params.id, req.user);
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (err) { next(err); }
};

const execute = async (req, res, next) => {
  try {
    const execution = await executionService.trigger(req.params.id, req.user, req.body);
    res.status(202).json({ success: true, execution });
  } catch (err) { next(err); }
};

const generate = async (req, res, next) => {
  try {
    const workflow = await aiService.generateWorkflow(req.body.prompt, req.user);
    res.json({ success: true, workflow });
  } catch (err) { next(err); }
};

const getDashboard = async (req, res, next) => {
  try {
    const stats = await workflowService.dashboard(req.user);
    res.json({ success: true, ...stats });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, duplicate, remove, execute, generate, getDashboard };
