const mongoose = require('mongoose');

const agentMemorySchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution' },
  agentId: String,
  key: String,
  value: mongoose.Schema.Types.Mixed,
  confidenceScore: { type: Number, default: 1.0 },
}, { timestamps: true });

module.exports = mongoose.model('AgentMemory', agentMemorySchema);
