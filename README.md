# Agentflow AI — Agentic Automation Platform

A full-stack AI Operations Automation Platform that lets operators describe automations in natural language and turn them into executable visual workflows.

## Quick Start

### 1. Install dependencies
```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 2. Configure environment
Edit `server/.env` — the platform works out of the box with no keys set (in-memory DB, rule-based AI, simulated integrations).

```env
# Optional — enables real AI generation
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=AIza...

# Optional — enables real OAuth integrations
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_BOT_TOKEN=...

# Optional — persistent storage
MONGODB_URI=mongodb://localhost:27017/agentflow
REDIS_URL=redis://localhost:6379
```

### 3. Run
```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 3000)
cd client && npm run dev
```

Open **http://localhost:3000**

---

## Architecture

### Backend (`server/`)
| Layer | Responsibility |
|---|---|
| `routes/` | HTTP routing + express-validator |
| `controllers/` | Request parsing + response shaping only |
| `services/` | All business logic |
| `agents/` | Pure agent modules (no HTTP knowledge) |
| `integrations/` | Third-party SDK wrappers behind BaseIntegration |
| `queues/` | BullMQ + Redis (in-memory fallback) |
| `config/` | Env, MongoDB, Socket.IO |

### Agent Chain
```
Planner → Executor → Validator → Recovery → Monitoring
```
Each agent emits a Socket.IO event + writes an ExecutionLog row.

### Frontend (`client/`)
| Page | Description |
|---|---|
| `/` | Landing page |
| `/dashboard` | Operator console with metrics |
| `/workflows` | Workflow list + management |
| `/workflows/builder` | AI prompt-to-workflow generator |
| `/workflows/[id]` | Full canvas editor |
| `/executions` | Execution history |
| `/executions/[id]` | Live agent timeline |
| `/integrations` | OAuth connection management |
| `/settings` | Profile + system health |

---

## Fallback Behavior

| Service | Configured | Not Configured |
|---|---|---|
| MongoDB | Persists to MongoDB | In-memory store |
| Redis/BullMQ | Background job queue | In-memory fallback |
| OpenRouter | Real AI generation | Falls through |
| Gemini | Real AI generation | Rule-based builder |
| Gmail/Slack/etc | Real API calls | INTEGRATION_NOT_CONNECTED error in timeline |

---

## Security
- Passwords hashed with bcrypt (cost 12)
- JWTs signed with `JWT_SECRET`
- OAuth tokens encrypted at rest with AES-256-CBC using `CREDENTIAL_ENCRYPTION_KEY`
- HTTP security headers via helmet
- CORS limited to `CLIENT_URL`
- Rate limiting on auth endpoints
- All request bodies validated with express-validator
