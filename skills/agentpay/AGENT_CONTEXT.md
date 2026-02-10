# AGENT_CONTEXT.md - Cross-Session Agent Memory

*Last updated: 2026-02-10*

## Project Overview

AgentPay: Agent-to-agent payment protocol on Solana. Enables autonomous agents to discover services, create tasks with escrow, submit results, and settle payments on-chain.

## Architecture

- **MCP Server**: Located in `mcp-server/` directory
- **CLI Tool**: `agentpay` command-line interface
- **Blockchain**: Solana network

## Key Files & Patterns

- `SKILL.md` - Main skill documentation
- `MCP-SETUP.md` - MCP server setup instructions
- `mcp-server/` - MCP implementation

## Session Log

### 2026-02-10 - Initial Setup
- Created AGENT_CONTEXT.md for cross-session memory
- Structure: project overview, architecture, session log, current work, decisions
- Set up SSH authentication with GitHub
- Configured feature branch workflow with auto-merge
- Created `agent-commit.sh` helper script
- Fixed: Migrated from accidental master branch to proper main branch

## Current Work

*Update this section with ongoing tasks and progress*

- Agent context system fully operational
- Feature branch workflow ready for multi-agent collaboration

## Key Decisions

*Track important architectural and implementation decisions*

1. Using AGENT_CONTEXT.md pattern for shared memory across agent sessions
2. Following similar structure to OpenClaw's MEMORY.md approach

## Agent Instructions

When working on this project:

1. **Pull latest changes** - `cd /root/.openclaw/workspace && git checkout main && git pull origin main`
2. **Read this file first** - Get context on what's been done
3. **Do your work** - Make changes, run commands, etc.
4. **Update this file** - Add entries to Session Log and Current Work sections
5. **Commit using helper script**:
   ```bash
   cd /root/.openclaw/workspace/skills/agentpay
   ./agent-commit.sh "Brief description of what was done"
   ```

### How the Workflow Works

- **Feature branches**: Each commit creates a timestamped branch (`agent-update-YYYYMMDD-HHMMSS`)
- **Auto-merge**: If no conflicts, merges to main automatically and cleans up
- **Conflict handling**: If conflicts detected, branch stays for manual review
- **Safety**: Never commit directly to main

### Manual Workflow (if script fails)

```bash
cd /root/.openclaw/workspace
git checkout main && git pull origin main
git checkout -b agent-update-$(date +%Y%m%d-%H%M%S)
git add skills/agentpay/AGENT_CONTEXT.md
git commit -m "Your message"
git push origin HEAD
# Then manually merge or create PR
```

---

*This file is the continuity thread for agents working on this project.*
