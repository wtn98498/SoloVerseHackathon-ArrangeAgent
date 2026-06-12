#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
run_dir="$repo_root/docs/agent-runs"

if [ ! -d "$run_dir" ]; then
  echo "No agent runs yet."
  exit 0
fi

for pid_file in "$run_dir"/*.pid; do
  [ -e "$pid_file" ] || continue
  pid="$(cat "$pid_file")"
  base="${pid_file%.pid}"
  log_file="$base.log"
  report_file="$base.report.md"

  if ps -p "$pid" >/dev/null 2>&1; then
    status="RUNNING"
  else
    status="DONE"
  fi

  echo "== $(basename "$base") =="
  echo "PID: $pid"
  echo "Status: $status"
  echo "Log: $log_file"
  echo "Report: $report_file"
  if [ -f "$log_file" ]; then
    echo "-- tail --"
    tail -n 20 "$log_file"
  fi
  echo
done

