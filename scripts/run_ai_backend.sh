#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
export NO_PROXY="${NO_PROXY:-},127.0.0.1,localhost"
export no_proxy="${no_proxy:-},127.0.0.1,localhost"
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi
python -m uvicorn backend.app:app --host 127.0.0.1 --port "${AI_BACKEND_PORT:-8787}"
