const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: String,
  type: String,
  position: { x: Number, y: Number },
  data: mongoose.Schema.Types.Mixed,
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  type: String,
  animated: Boolean,
  label: String,
}, { _id: false });

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
  triggerConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  nodes: [nodeSchema],
  edges: [edgeSchema],
  version: { type: Number, default: 1 },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);
