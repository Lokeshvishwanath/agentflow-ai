const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution' },
  type: { type: String, enum: ['success', 'failure', 'escalation', 'info', 'warning'], default: 'info' },
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
