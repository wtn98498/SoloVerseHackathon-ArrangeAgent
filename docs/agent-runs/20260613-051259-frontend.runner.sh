#!/usr/bin/env bash
set +e
cd "/Users/scala/Documents/soloverseAgent/.worktrees/frontend" || exit 1
prompt_text="$(cat "/Users/scala/Documents/soloverseAgent/docs/agent-runs/frontend.prompt.txt")"
{
  echo "=== START $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
  claude -p \
    --permission-mode bypassPermissions \
    --model sonnet \
    --add-dir "/Users/scala/Documents/soloverseAgent/skills" \
    --append-system-prompt "You are a focused implementation agent. Follow repository CLAUDE.md. Commit your work with Chinese commit messages as wentianning. End with a concise final report containing: status, changed files, verification, commit hash, blockers, and next recommendation." \
    "$prompt_text"
  status=$?
  echo "=== EXIT $status $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
  exit "$status"
} > "/Users/scala/Documents/soloverseAgent/docs/agent-runs/20260613-051259-frontend.log" 2>&1
