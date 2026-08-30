const executionService = require('../services/executionService');

const list = async (req, res, next) => {
  try {
    const result = await executionService.list(req.user, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const execution = await executionService.getById(req.params.id, req.user);
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

const getTimeline = async (req, res, next) => {
  try {
    const logs = await executionService.getTimeline(req.params.id);
    res.json({ success: true, logs });
  } catch (err) { next(err); }
};

const pause = async (req, res, next) => {
  try {
    const execution = await executionService.pause(req.params.id, req.user);
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

const resume = async (req, res, next) => {
  try {
    const execution = await executionService.resume(req.params.id, req.user);
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const execution = await executionService.cancel(req.params.id, req.user);
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, getTimeline, pause, resume, cancel };
