# Shannon Web

Web frontend for [Shannon](https://github.com/your-org/shannon) - AI-powered penetration testing.

## Overview

This is a standalone web application for managing Shannon pentest workflows. It provides:

- **Dashboard** - Overview of running and completed workflows
- **Workflow Management** - Start new pentests, monitor progress, view reports
- **Configuration** - Manage pentest configuration files
- **Settings** - Configure API keys for LLM providers

## Prerequisites

- Node.js 22+
- pnpm
- Running [Temporal](https://temporal.io/) server (default: `localhost:7233`)
- Shannon project built (`npm run build` in Shannon directory)

## Setup

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

## Running

### Development

```bash
# Run API and web frontend concurrently
pnpm dev

# Or run separately:
pnpm dev:api   # API server on http://localhost:3001
pnpm dev:web   # Web frontend on http://localhost:5173
```

### Production

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

### API Keys

API keys can be configured either:
- Via the Settings page in the web UI
- Via environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`)

## Architecture

```
shannon-web/
├── packages/
│   ├── shared/    # Shared TypeScript types
│   ├── api/       # Express API server
│   └── web/       # React + Vite frontend
└── package.json   # Workspace root
```

The API server connects to:
- **Temporal** - For workflow orchestration
- **Shannon audit-logs/** - For session data and deliverables
- **Shannon configs/** - For pentest configuration files

## License

AGPL-3.0 - See Shannon project for details.
