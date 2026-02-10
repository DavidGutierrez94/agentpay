#!/bin/bash
# Agent Context Update Script
# Usage: ./agent-commit.sh "commit message"

set -e

REPO_DIR="/root/.openclaw/workspace"
CONTEXT_FILE="skills/agentpay/AGENT_CONTEXT.md"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="agent-update-${TIMESTAMP}"

cd "$REPO_DIR"

# Ensure we're on master and up to date
git checkout master
git pull origin master

# Create feature branch
git checkout -b "$BRANCH_NAME"

# Stage the context file
git add "$CONTEXT_FILE"

# Commit with provided message
COMMIT_MSG="${1:-Update agent context}"
git commit -m "$COMMIT_MSG"

# Push branch to remote
git push origin "$BRANCH_NAME"

# Try to merge to master
git checkout master
git pull origin master

# Attempt merge
if git merge "$BRANCH_NAME" --no-ff -m "Merge $BRANCH_NAME"; then
    echo "✅ Clean merge - pushing to master"
    git push origin master
    
    # Clean up local and remote branch
    git branch -d "$BRANCH_NAME"
    git push origin --delete "$BRANCH_NAME"
    
    echo "✅ Successfully merged and cleaned up branch"
else
    echo "⚠️  CONFLICT DETECTED - Manual review needed"
    echo "Branch '$BRANCH_NAME' has been pushed but not merged"
    echo "Please review at: https://github.com/DavidGutierrez94/agentpay/tree/$BRANCH_NAME"
    
    # Abort the merge
    git merge --abort
    
    exit 1
fi
