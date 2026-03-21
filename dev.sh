#!/bin/bash
# Start backend and frontend dev servers in parallel

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting RedNotebook Web Dev Servers..."
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."
echo ""

# Start backend (use venv if present)
(
  cd "$ROOT"
  if [ -f ".venv/bin/uvicorn" ]; then
    .venv/bin/uvicorn backend.main:app --reload --port 8000
  else
    uvicorn backend.main:app --reload --port 8000
  fi
) &
BACKEND_PID=$!

# Start frontend
(
  cd "$ROOT/frontend"
  npm run dev
) &
FRONTEND_PID=$!

# Kill both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM EXIT

wait
