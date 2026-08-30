const mongoose = require('mongoose');
const { mongoUri } = require('./env');

// In-memory store fallback when MongoDB is unavailable
const memStore = {
  users: [], workflows: [], executions: [], executionLogs: [],
  integrations: [], notifications: [], agentMemory: [],
};

let usingMemory = false;

const connect = async () => {
  if (!mongoUri) {
    console.log('[db] No MONGODB_URI set — using in-memory store');
    usingMemory = true;
    return;
  }
  try {
    await mongoose.connect(mongoUri);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.warn('[db] MongoDB connection failed — using in-memory store:', err.message);
    usingMemory = true;
  }
};

const isMemory = () => usingMemory;
const getMemStore = () => memStore;

module.exports = { connect, isMemory, getMemStore };
