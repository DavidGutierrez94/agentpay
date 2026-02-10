#!/bin/bash
# GitHub Issue Creation Script
# Usage: ./create-issue.sh "Issue title" "Issue body" [label1,label2,...]

set -e

REPO_OWNER="DavidGutierrez94"
REPO_NAME="agentpay"

if [ -z "$1" ]; then
    echo "❌ Error: Issue title required"
    echo "Usage: ./create-issue.sh \"Issue title\" \"Issue body\" [labels]"
    exit 1
fi

TITLE="$1"
BODY="${2:-}"
LABELS="${3:-}"

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not installed"
    echo "Install: https://cli.github.com/"
    echo ""
    echo "Or create issue manually at:"
    echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new"
    exit 1
fi

# Build labels flag
LABELS_FLAG=""
if [ -n "$LABELS" ]; then
    LABELS_FLAG="--label $LABELS"
fi

# Create issue
echo "Creating GitHub issue..."
ISSUE_URL=$(gh issue create \
    --repo "${REPO_OWNER}/${REPO_NAME}" \
    --title "$TITLE" \
    --body "$BODY" \
    $LABELS_FLAG \
    2>&1)

if [ $? -eq 0 ]; then
    # Extract issue number from URL
    ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oP '#\K\d+' || echo "$ISSUE_URL" | grep -oP '/issues/\K\d+')
    echo "✅ Issue created: #${ISSUE_NUM}"
    echo "$ISSUE_URL"
    echo ""
    echo "Next: Use this issue number with agent-commit.sh"
    echo "Example: ./agent-commit.sh ${ISSUE_NUM} \"Your commit message\""
else
    echo "❌ Failed to create issue"
    echo "$ISSUE_URL"
    exit 1
fi
