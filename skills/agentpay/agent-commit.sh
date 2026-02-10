#!/bin/bash
# Agent Context Update Script
# Usage: ./agent-commit.sh <issue-number> "commit message"
# Example: ./agent-commit.sh 42 "Fix modal refactoring"

set -e

REPO_DIR="/root/.openclaw/workspace"
CONTEXT_FILE="skills/agentpay/AGENT_CONTEXT.md"

# Validate arguments
if [ -z "$1" ]; then
    echo "❌ Error: GitHub issue number required"
    echo ""
    echo "Usage: ./agent-commit.sh <issue-number> \"commit message\""
    echo "Example: ./agent-commit.sh 42 \"Fix modal refactoring\""
    echo ""
    echo "Create an issue first with:"
    echo "  ./create-issue.sh \"Issue title\" \"Issue description\" [labels]"
    exit 1
fi

if [ -z "$2" ]; then
    echo "❌ Error: Commit message required"
    echo "Usage: ./agent-commit.sh <issue-number> \"commit message\""
    exit 1
fi

ISSUE_NUM="$1"
COMMIT_MSG="$2"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="issue-${ISSUE_NUM}-${TIMESTAMP}"

cd "$REPO_DIR"

# Ensure we're on main and up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b "$BRANCH_NAME"

# Stage the context file
git add "$CONTEXT_FILE"

# Commit with issue reference
FULL_COMMIT_MSG="${COMMIT_MSG} (closes #${ISSUE_NUM})"
git commit -m "$FULL_COMMIT_MSG"

# Push branch to remote
git push origin "$BRANCH_NAME"

# Try to merge to main
git checkout main
git pull origin main

# Attempt merge
if git merge "$BRANCH_NAME" --no-ff -m "Merge $BRANCH_NAME"; then
    echo "✅ Clean merge - pushing to main"
    git push origin main
    
    # Clean up local and remote branch
    git branch -d "$BRANCH_NAME"
    git push origin --delete "$BRANCH_NAME"
    
    echo "✅ Successfully merged and cleaned up branch"
    echo "📋 Issue #${ISSUE_NUM}: https://github.com/DavidGutierrez94/agentpay/issues/${ISSUE_NUM}"
    echo "✅ Issue automatically closed by merge"
else
    echo "⚠️  CONFLICT DETECTED - Manual review needed"
    echo "Branch '$BRANCH_NAME' has been pushed but not merged"
    echo "📋 Issue #${ISSUE_NUM}: https://github.com/DavidGutierrez94/agentpay/issues/${ISSUE_NUM}"
    echo "🔀 Branch: https://github.com/DavidGutierrez94/agentpay/tree/$BRANCH_NAME"
    echo ""
    echo "Resolve conflicts manually, then close the issue when done"
    
    # Abort the merge
    git merge --abort
    
    exit 1
fi
