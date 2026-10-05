#!/usr/bin/env bash
set -euo pipefail

# Generic graceful startup wrapper for Node/TypeScript apps.
# Usage as ENTRYPOINT: it will forward SIGINT/SIGTERM and run CMD if provided.
# If START_CMD env var is set, it takes precedence.

START_CMD="${START_CMD:-}"

# If the container was invoked with arguments, use them as the command (highest priority)
if [ "$#" -gt 0 ]; then
  # join args into a single command string
  START_CMD="$(printf '%s ' "$@")"
fi

# If still empty, prefer npm start if package.json has a start script, else node dist/index.js
if [ -z "$START_CMD" ]; then
  if [ -f package.json ] && grep -q '"start"' package.json; then
    START_CMD="npm run start"
  else
    START_CMD="node dist/index.js"
  fi
fi

child_pid=0

on_exit() {
  echo "Graceful shutdown requested, forwarding signal to child (pid $child_pid)"
  if [ "$child_pid" -ne 0 ]; then
    kill -SIGINT "$child_pid" 2>/dev/null || true
    wait "$child_pid" || true
  fi
  exit 0
}

trap 'on_exit' SIGINT SIGTERM

# Start the actual app in background so the wrapper can trap signals
bash -c "$START_CMD" &
child_pid=$!
echo "Started child process $child_pid ($START_CMD)"

# Wait for child to exit
wait "$child_pid"
exit_code=$?

echo "Child exited with code $exit_code"
exit $exit_code
