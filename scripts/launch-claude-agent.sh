#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <agent-name> <worktree-path> <prompt-file>" >&2
  exit 1
fi

agent_name="$1"
worktree_path="$2"
prompt_file="$3"

repo_root="$(git rev-parse --show-toplevel)"
run_dir="$repo_root/docs/agent-runs"
mkdir -p "$run_dir"

timestamp="$(date '+%Y%m%d-%H%M%S')"
log_file="$run_dir/${timestamp}-${agent_name}.log"
report_file="$run_dir/${timestamp}-${agent_name}.report.md"

if [ ! -d "$worktree_path" ]; then
  echo "Worktree not found: $worktree_path" >&2
  exit 1
fi

if [ ! -f "$prompt_file" ]; then
  echo "Prompt file not found: $prompt_file" >&2
  exit 1
fi

{
  echo "# Agent Run"
  echo
  echo "- Agent: $agent_name"
  echo "- Worktree: $worktree_path"
  echo "- Prompt: $prompt_file"
  echo "- Started: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "- Status: RUNNING"
  echo
  echo "## Final Report"
  echo
  echo "Pending."
} > "$report_file"

(
  cd "$worktree_path"
  {
    echo "=== START $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
    claude -p \
      --permission-mode bypassPermissions \
      --model sonnet \
      --append-system-prompt "You are a focused implementation agent. Follow repository CLAUDE.md. Commit your work with Chinese commit messages as wentianning. End with a concise final report containing: status, changed files, verification, commit hash, blockers, and next recommendation." \
      "$(cat "$prompt_file")"
    status=$?
    echo "=== EXIT $status $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
    exit "$status"
  } > "$log_file" 2>&1
) &

pid=$!
echo "$pid" > "$run_dir/${timestamp}-${agent_name}.pid"

cat <<EOF
Launched $agent_name
PID: $pid
Log: $log_file
Report: $report_file
EOF

