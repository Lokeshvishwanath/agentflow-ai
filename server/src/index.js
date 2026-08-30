const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { port, clientUrl, nodeEnv } = require('./config/env');
const { connect } = require('./config/db');
const socketConfig = require('./config/socket');
const { init: initQueue } = require('./queues/executionQueue');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
socketConfig.init(server);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(compression());
app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workflows', require('./routes/workflowRoutes'));
app.use('/api/executions', require('./routes/executionRoutes'));
app.use('/api/integrations', require('./routes/integrationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
const start = async () => {
  await connect();
  await initQueue();
  server.listen(port, () => console.log(`[server] Agentflow AI running on port ${port}`));
};

start().catch(console.error);
