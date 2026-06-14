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
worktree_abs="$(cd "$worktree_path" && pwd)"
prompt_abs="$(cd "$(dirname "$prompt_file")" && pwd)/$(basename "$prompt_file")"

timestamp="$(date '+%Y%m%d-%H%M%S')"
log_file="$run_dir/${timestamp}-${agent_name}.log"
report_file="$run_dir/${timestamp}-${agent_name}.report.md"
runner_file="$run_dir/${timestamp}-${agent_name}.runner.sh"

if [ ! -d "$worktree_abs" ]; then
  echo "Worktree not found: $worktree_path" >&2
  exit 1
fi

if [ ! -f "$prompt_abs" ]; then
  echo "Prompt file not found: $prompt_file" >&2
  exit 1
fi

{
  echo "# Agent Run"
  echo
  echo "- Agent: $agent_name"
  echo "- Worktree: $worktree_abs"
  echo "- Prompt: $prompt_abs"
  echo "- Started: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "- Status: RUNNING"
  echo
  echo "## Final Report"
  echo
  echo "Pending."
} > "$report_file"

cat > "$runner_file" <<EOF_RUNNER
#!/usr/bin/env bash
set +e
cd "$worktree_abs" || exit 1
prompt_text="\$(cat "$prompt_abs")"
{
  echo "=== START \$(date '+%Y-%m-%d %H:%M:%S %Z') ==="
  claude -p \\
    --permission-mode bypassPermissions \\
    --model sonnet \\
    --add-dir "$repo_root/skills" \\
    --append-system-prompt "You are a focused implementation agent. Follow repository CLAUDE.md. Commit your work with Chinese commit messages as wentianning. After every successful commit, push the current branch with: git push -u origin HEAD. If push is rejected, fetch and integrate safely; do not force-push unless the user explicitly authorizes it. End with a concise final report containing: status, changed files, verification, commit hash, push status, blockers, and next recommendation." \\
    "\$prompt_text"
  status=\$?
  echo "=== EXIT \$status \$(date '+%Y-%m-%d %H:%M:%S %Z') ==="
  exit "\$status"
} > "$log_file" 2>&1
EOF_RUNNER
chmod +x "$runner_file"

nohup "$runner_file" >/dev/null 2>&1 &
pid=$!

echo "$pid" > "$run_dir/${timestamp}-${agent_name}.pid"

cat <<EOF
Launched $agent_name
PID: $pid
Log: $log_file
Report: $report_file
Runner: $runner_file
EOF
