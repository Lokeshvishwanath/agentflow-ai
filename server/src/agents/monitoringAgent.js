const { emit } = require('../config/socket');
const { isMemory, getMemStore } = require('../config/db');
const ExecutionLog = require('../models/ExecutionLog');
const { v4: uuidv4 } = require('uuid');

const log = async ({ executionId, workflowId, nodeId, agent, level, message, metadata }) => {
  const entry = { executionId, workflowId, nodeId, agent, level, message, metadata, timestamp: new Date() };

  // Persist
  if (isMemory()) {
    getMemStore().executionLogs.push({ _id: uuidv4(), ...entry });
  } else {
    await ExecutionLog.create(entry).catch(() => {});
  }

  // Broadcast
  emit(`execution:${executionId}`, 'agent:event', { ...entry, id: uuidv4() });

  return entry;
};

module.exports = { log };
