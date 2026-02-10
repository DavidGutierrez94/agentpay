# GitHub Issue Workflow

All commits to AgentPay must reference a GitHub issue for traceability.

## Quick Start

### 1. Create an Issue

**Option A: Manual (no auth required)**
1. Visit: https://github.com/DavidGutierrez94/agentpay/issues/new
2. Fill in title and description
3. Add labels (optional): `enhancement`, `bug`, `ui`, `docs`, etc.
4. Click "Submit new issue"
5. Note the issue number (e.g., `#42`)

**Option B: GitHub CLI (requires auth)**
```bash
cd /root/.openclaw/workspace/skills/agentpay

# Simple issue
gh issue create --repo DavidGutierrez94/agentpay \
  --title "Fix modal refactoring" \
  --body "Convert remaining modals to Radix Dialog"

# With labels
gh issue create --repo DavidGutierrez94/agentpay \
  --title "Fix modal refactoring" \
  --body "Convert remaining modals to Radix Dialog" \
  --label "enhancement,ui"
```

**Option C: Helper Script (requires gh CLI auth)**
```bash
./create-issue.sh "Fix modal refactoring" "Convert remaining modals to Radix Dialog" "enhancement,ui"
```

### 2. Do Your Work

Make your changes, test them, update AGENT_CONTEXT.md

### 3. Commit with Issue Reference

```bash
cd /root/.openclaw/workspace/skills/agentpay
./agent-commit.sh 42 "Refactor modals to Radix Dialog"
```

This will:
- Create feature branch: `issue-42-20260210-153045`
- Commit with message: `"Refactor modals to Radix Dialog (closes #42)"`
- Auto-merge to main (if no conflicts)
- Auto-close issue #42

## Why Use Issues?

1. **Traceability**: Every change is documented with context
2. **Collaboration**: Agents and humans can see what's in progress
3. **Review**: Issues show up in PR context for easier review
4. **History**: Future agents understand why changes were made

## GitHub CLI Setup (Optional)

The `create-issue.sh` script requires GitHub CLI authentication.

**To set up:**
1. Ask your human to create a GitHub Personal Access Token
2. Scopes needed: `repo` (full control)
3. Set environment variable or use `gh auth login`

**Without gh CLI:** Just create issues manually via the GitHub web interface.

## Labels to Use

- `enhancement` - New features or improvements
- `bug` - Something isn't working
- `ui` - User interface changes
- `docs` - Documentation updates
- `security` - Security-related changes
- `performance` - Performance improvements
- `refactor` - Code refactoring without behavior change

## Example Workflow

```bash
# 1. Create issue manually on GitHub
# https://github.com/DavidGutierrez94/agentpay/issues/new
# Title: "Fix hardcoded colors in badges"
# Let's say it gets issue #45

# 2. Do your work
cd /root/.openclaw/workspace/app/src/components/shared
# ... edit ZKBadge.tsx and EscrowBadge.tsx ...

# 3. Update context
cd /root/.openclaw/workspace
# ... edit skills/agentpay/AGENT_CONTEXT.md ...

# 4. Commit and merge
cd skills/agentpay
./agent-commit.sh 45 "Replace hardcoded colors with CSS variables in badges"

# 5. Issue #45 automatically closes when merged to main ✅
```

---

**Remember:** Always create an issue BEFORE starting work. This creates a paper trail and helps coordinate with other agents.
