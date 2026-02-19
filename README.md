# Shannon Web

Web frontend for [Shannon](https://github.com/your-org/shannon) - AI-powered penetration testing.

## Overview

This is a standalone web application for managing Shannon pentest workflows. It provides:

- **Dashboard** - Overview of running and completed workflows
- **Workflow Management** - Start new pentests, monitor progress, view reports
- **Configuration** - Manage pentest configuration files
- **Settings** - Configure API keys for LLM providers
- **User Authentication** - Multi-user support with session-based authentication

## Quick Start with Docker

The easiest way to run Shannon Web is with Docker Compose:

```bash
# 1. Clone and configure
git clone https://github.com/your-org/shannon-web.git
cd shannon-web
cp .env.example .env

# 2. Edit .env to configure:
#    - SHANNON_ROOT (path to Shannon project)
#    - ANTHROPIC_API_KEY
#    - ADMIN_USERNAME and ADMIN_PASSWORD (initial admin credentials)
#    - SESSION_SECRET (generate with: openssl rand -hex 32)

# 3. Start the services
docker compose up -d

# 4. Open http://localhost:3001
```

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

### Authentication

Shannon Web requires authentication to access. On first startup:

1. If no users exist, an admin user is created from `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables
2. Visit the login page and sign in with the admin credentials
3. Navigate to **Users** (admin only) to create additional user accounts

**Security notes:**
- Passwords are hashed with bcrypt (cost factor 12)
- Sessions use HTTP-only, secure (in production), SameSite=strict cookies
- Sessions are stored in SQLite for persistence across restarts
- Only admins can create, list, or delete user accounts

## Architecture

```
shannon-web/
├── packages/
│   ├── shared/    # Shared TypeScript types
│   ├── api/       # Express API server
│   └── web/       # React + Vite frontend
├── Dockerfile     # Multi-stage Docker build
├── docker-compose.yml
└── package.json   # Workspace root
```

The API server connects to:
- **Temporal** - For workflow orchestration
- **Shannon audit-logs/** - For session data and deliverables
- **Shannon configs/** - For pentest configuration files

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

AGPL-3.0 - See Shannon project for details.
