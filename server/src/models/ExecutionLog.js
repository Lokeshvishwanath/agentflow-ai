const mongoose = require('mongoose');

const executionLogSchema = new mongoose.Schema({
  executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  nodeId: String,
  agent: { type: String, enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'] },
  level: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  message: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('ExecutionLog', executionLogSchema);
