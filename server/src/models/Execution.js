const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  workflowSnapshot: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
    default: 'PENDING',
  },
  currentNode: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  inputs: mongoose.Schema.Types.Mixed,
  outputs: mongoose.Schema.Types.Mixed,
  error: String,
  retryCount: { type: Number, default: 0 },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Execution', executionSchema);
