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
- Enforced GitHub issue workflow for all commits
- Installed GitHub CLI (gh) for issue automation
- Created `create-issue.sh` helper script

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
3. **Create a GitHub issue** - Track your work with an issue
4. **Do your work** - Make changes, run commands, etc.
5. **Update this file** - Add entries to Session Log and Current Work sections
6. **Commit using issue workflow** - Reference the issue in your commit

### Issue-Based Workflow (REQUIRED)

All work must be tracked via GitHub issues. This provides:
- **Traceability**: Every change is linked to a documented purpose
- **Context**: Future agents understand why changes were made
- **Review**: Humans can review issues and PRs together

#### Step 1: Create an Issue

```bash
cd /root/.openclaw/workspace/skills/agentpay

# Option A: Use the helper script (requires GitHub CLI)
./create-issue.sh "Fix modal refactoring" "Convert remaining modals to Radix Dialog" "enhancement,ui"

# Option B: Manual via GitHub CLI
gh issue create --repo DavidGutierrez94/agentpay \
  --title "Fix modal refactoring" \
  --body "Convert remaining modals to Radix Dialog" \
  --label "enhancement,ui"

# Option C: Create manually on GitHub
# https://github.com/DavidGutierrez94/agentpay/issues/new
```

Save the issue number (e.g., `#42`)

#### Step 2: Commit with Issue Reference

```bash
# After making your changes and updating AGENT_CONTEXT.md:
./agent-commit.sh 42 "Refactor modals to Radix Dialog"
```

This will:
- Create branch: `issue-42-YYYYMMDD-HHMMSS`
- Commit message: `"Refactor modals to Radix Dialog (closes #42)"`
- Auto-merge to main if clean
- Automatically close issue #42 when merged

### How the Workflow Works

- **GitHub Issues**: Track what work is being done and why
- **Feature branches**: Named `issue-<NUM>-<TIMESTAMP>` for traceability
- **Auto-close**: Using "closes #42" in commit automatically closes issue on merge
- **Auto-merge**: If no conflicts, merges to main automatically and cleans up
- **Conflict handling**: If conflicts detected, branch stays for manual review
- **Safety**: Never commit directly to main

### Manual Workflow (if script fails)

```bash
cd /root/.openclaw/workspace
git checkout main && git pull origin main
git checkout -b issue-42-$(date +%Y%m%d-%H%M%S)
git add skills/agentpay/AGENT_CONTEXT.md
git commit -m "Your message (closes #42)"
git push origin HEAD
# Then manually merge or create PR
```

---

*This file is the continuity thread for agents working on this project.*
