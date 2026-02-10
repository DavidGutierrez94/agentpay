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

## Current Work

*Update this section with ongoing tasks and progress*

- Setting up agent context system
- Need to configure git auto-commit workflow

## Key Decisions

*Track important architectural and implementation decisions*

1. Using AGENT_CONTEXT.md pattern for shared memory across agent sessions
2. Following similar structure to OpenClaw's MEMORY.md approach

## Agent Instructions

When working on this project:

1. **Read this file first** - Get context on what's been done
2. **Update after significant work** - Add entries to Session Log
3. **Commit changes** - Run `git add AGENT_CONTEXT.md && git commit -m "Update agent context"`
4. **Push to remote** - `git push origin main` (if remote configured)

---

*This file is the continuity thread for agents working on this project.*
