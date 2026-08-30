const { redisUrl } = require('../config/env');

let queue = null;
let worker = null;

// In-memory fallback job runner
const memJobs = [];
const runJob = async (job) => {
  const executionService = require('../services/executionService');
  // Jobs are already triggered directly; queue is for scheduled/retry use
  console.log('[queue] Processing job:', job.name, job.data);
};

const init = async () => {
  if (!redisUrl) {
    console.log('[queue] No REDIS_URL — using in-memory job fallback');
    return;
  }
  try {
    const { Queue, Worker } = require('bullmq');
    const IORedis = require('ioredis');
    const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    queue = new Queue('executions', { connection });
    worker = new Worker('executions', async (job) => runJob(job), { connection });
    worker.on('failed', (job, err) => console.error('[queue] Job failed:', job?.id, err.message));
    console.log('[queue] BullMQ connected to Redis');
  } catch (err) {
    console.warn('[queue] BullMQ init failed — using in-memory fallback:', err.message);
  }
};

const addJob = async (name, data, opts = {}) => {
  if (queue) return queue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, ...opts });
  memJobs.push({ name, data, opts, addedAt: new Date() });
};

module.exports = { init, addJob };
