# Shannon Web

Web frontend for [Shannon](https://github.com/your-org/shannon) — AI‑powered penetration testing.

A field‑terminal style operator console for driving Shannon pentests: kick
off operations, watch agents work in real time, review deliverables, and
manage operator accounts.

## Overview

Shannon Web provides:

- **Dashboard** — at‑a‑glance view of in‑flight and completed operations, with
  per‑run status, cost, and a running‑count badge that pulses while the pipeline
  is active.
- **Live workflow feed** — a streaming terminal console on each running
  operation's detail page. Phase transitions, agent starts / completions /
  failures, cost deltas, and raw worker stdout all flow in over
  Server‑Sent Events.
- **Guided config builder** — draft and save Shannon YAML configs through a
  guided form with a live YAML preview; no hand‑editing required.
- **Workflow management** — start new pentests, monitor progress, browse the
  full archive, and drill into session metrics, agent progression, and
  deliverables.
- **Reports** — executive markdown reports rendered in‑aesthetic, with a
  one‑click download.
- **Configurations** — list, inspect, and delete YAML profiles that Shannon
  consumes (authentication flow, scope rules).
- **Settings** — manage API keys for Anthropic / OpenAI / OpenRouter, test
  them in place, and choose a default LLM router.
- **User management** — admins create / edit / delete operators, reset
  passwords, toggle admin clearance, and disable accounts without deleting
  them (sessions for disabled accounts are invalidated on the next request).
- **Self‑service profile** — every operator can update their own email and
  rotate their passphrase without asking an admin.

## Quick Start with Docker

Shannon's source is **bundled in this repo** at `shannon/` — pinned to the
release this frontend was tested against. Clone, configure secrets, and
bring up the stack:

```bash
# 1. Clone and configure
git clone https://github.com/your-org/shannon-web.git
cd shannon-web
cp .env.example .env

# 2. Edit .env to configure at minimum:
#    - ADMIN_USERNAME and ADMIN_PASSWORD (initial admin credentials)
#    - SESSION_SECRET (generate with: openssl rand -hex 32)
#    - ANTHROPIC_API_KEY (required if you want to run actual pentests)

# 3. Start the services
#    Web UI + Temporal only (fast, lets you explore the app):
docker compose up -d
#    Full stack including the Shannon worker (needed to run pentests;
#    heavier image with Chromium + security tools):
docker compose --profile worker up -d

# 4. Open http://localhost:3001
```

The `web` and `worker` services both read Shannon from `./shannon`. If you
want to point them at a different checkout, set `SHANNON_ROOT=/path/to/other`
in your `.env`.

### Docker Compose Profiles

```bash
# Start web frontend + Temporal (most common)
docker compose up -d

# Start complete stack including Shannon worker
docker compose --profile worker up -d

# View logs
docker compose logs -f web

# Stop all services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `web` | 3001 | Shannon Web (API + frontend) |
| `temporal` | 7233 | Temporal gRPC server |
| `temporal` | 8233 | Temporal Web UI |
| `worker` | - | Shannon worker (optional, requires `--profile worker`) |

### Environment Variables for Docker

```bash
# Required
SHANNON_ROOT=/path/to/shannon          # Path to Shannon project
ANTHROPIC_API_KEY=sk-ant-...           # Anthropic API key

# Authentication (required for first run)
ADMIN_USERNAME=admin                   # Initial admin username
ADMIN_PASSWORD=your-secure-password    # Initial admin password (change this!)
SESSION_SECRET=your-random-string      # Session signing secret (openssl rand -hex 32)

# Optional
TARGET_REPO=/path/to/target            # Target repo (when using worker profile)
CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000    # Increase for long reports
```

## Local Development

### Prerequisites

- Node.js 22+
- pnpm
- Running [Temporal](https://temporal.io/) server (default: `localhost:7233`)
- Shannon project built (`npm run build` in Shannon directory)

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Build packages:**
   ```bash
   pnpm build
   ```

### Running

#### Development

```bash
# Run API and web frontend concurrently
pnpm dev

# Or run separately:
pnpm dev:api   # API server on http://localhost:3001
pnpm dev:web   # Web frontend on http://localhost:5173
```

#### Production

```bash
pnpm build
pnpm start  # Serves both API and static frontend on port 3001
```

### Troubleshooting: `sqlite3` native bindings

If the API fails on startup with `Error: Could not locate the bindings file`
for `sqlite3`, the prebuilt native binary doesn't match your installed Node
version. Rebuild it:

```bash
cd node_modules/.pnpm/sqlite3@*/node_modules/sqlite3
npm run install
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SHANNON_ROOT` | Path to Shannon project root | `../` (sibling directory) |
| `TEMPORAL_ADDRESS` | Temporal server address | `localhost:7233` |
| `AUDIT_LOGS_DIR` | Override audit logs directory | `$SHANNON_ROOT/audit-logs` |
| `CONFIGS_DIR` | Override configs directory | `$SHANNON_ROOT/configs` |
| `PORT` | API server port | `3001` |
| `SETTINGS_FILE` | Path to settings JSON file | `./.shannon-settings.json` |
| `ADMIN_USERNAME` | Initial admin username | - |
| `ADMIN_PASSWORD` | Initial admin password | - |
| `SESSION_SECRET` | Session cookie signing secret | - |
| `SESSION_MAX_AGE` | Session expiry in milliseconds | `86400000` (24 hours) |
| `USERS_FILE` | Path to users JSON file | `~/.shannon-users.json` |
| `SESSION_DB` | Path to session SQLite database | `~/.shannon-sessions.db` |

### API Keys

API keys can be configured either:
- Via the Settings page in the web UI
- Via environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`)

### Authentication & User Management

Shannon Web requires authentication to access. On first startup:

1. If no users exist, an admin user is created from `ADMIN_USERNAME` and
   `ADMIN_PASSWORD` environment variables.
2. Visit the login page and sign in with the admin credentials.
3. Navigate to **Users** (admin only) to register additional operators.

Admins can:

- Create new operators (username, password, optional email, admin clearance)
- **Reset passwords** for any operator
- **Toggle admin clearance** on any operator (except themselves)
- **Disable / re‑enable accounts** — preferable to deletion when an operator
  is stepping away; preserves audit‑log attribution. A disabled account's
  existing sessions are invalidated on the next request.
- **Delete operators** — destructive; blocked for the current user and for the
  last remaining enabled admin

Every operator — admin or not — can use the **Profile** page (click the
avatar in the sidebar) to:

- Update their contact email
- Rotate their passphrase (requires the current passphrase)

**Security notes:**
- Passwords are hashed with bcrypt (cost factor 12)
- Sessions use HTTP‑only, secure (in production), SameSite=strict cookies
- Sessions are stored in SQLite for persistence across restarts
- The system always retains at least one enabled admin; edits that would
  violate this are rejected with a 400
- Admins cannot demote or disable themselves (prevents accidental lockout)
- `lastLoginAt` is recorded on every successful login

## Live Workflow Feed

While a workflow is running, the detail page streams events via Server‑Sent
Events at `GET /api/workflows/:workflowId/events`. The server:

- Sends an initial snapshot (progress + recent worker logs)
- Polls Temporal's progress query every 1.5s and diffs against the prior state
- Emits typed events (`phase-change`, `agent-start`, `agent-complete`,
  `agent-failed`, `cost-delta`, `finished`, `error`) plus raw worker
  `stdout` / `stderr` lines as they arrive
- Heartbeats every 10s; closes cleanly when the workflow finishes or the
  client disconnects
- Falls back to audit‑logs for completed workflows Temporal no longer retains

The frontend renders the stream as a terminal‑style feed with per‑event‑kind
color coding and auto‑scroll.

## Guided Config Builder

`/configs/new` is a guided form that composes a Shannon YAML config without
hand‑editing. It covers:

- **Authentication** — login type, URL, credentials (with optional TOTP
  secret), a numbered natural‑language login flow, and a success condition
  matching Shannon's Zod schema (`url | cookie | element | redirect`)
- **Rules** — scoping `avoid` and `focus` lists with typed matchers
  (`path | subdomain | domain | method | header | parameter`)

A live YAML preview renders on the right with line numbers, light syntax
coloring, a copy button, and a schema‑validity indicator. Save writes the
file to `$SHANNON_ROOT/configs/<name>.yaml`.

## Architecture

```
shannon-web/
├── packages/
│   ├── shared/    # Shared TypeScript types (pipeline progress, events)
│   ├── api/       # Express API server + SSE + Temporal client
│   └── web/       # React + Vite frontend
├── shannon/       # Vendored Shannon pentest engine (pinned release)
├── Dockerfile     # Multi-stage Docker build for the web package
├── docker-compose.yml
└── package.json   # Workspace root
```

The API server connects to:
- **Temporal** — workflow orchestration and progress queries
- **Shannon `audit-logs/`** — session metrics, deliverables, historical data
- **Shannon `configs/`** — pentest configuration files
- The **Shannon worker** (managed as a child process when run locally)

## Design

The UI is a distinctive "field terminal" aesthetic — warm ink‑and‑amber
palette, JetBrains Mono for data with IBM Plex Serif for display type,
stamped small‑caps labels, hairline borders, signal‑amber accents used
sparingly to mark live run state. See `packages/web/src/index.css` and
`packages/web/tailwind.config.js` for tokens.

## Building Docker Image Manually

```bash
# Build the image
docker build -t shannon-web .

# Run with external Temporal
docker run -d \
  -p 3001:3001 \
  -e TEMPORAL_ADDRESS=host.docker.internal:7233 \
  -e SHANNON_ROOT=/shannon \
  -v /path/to/shannon:/shannon:ro \
  shannon-web
```

## License

AGPL-3.0 — see Shannon project for details.
