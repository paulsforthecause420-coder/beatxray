#!/usr/bin/env bash
set -euo pipefail

npm run lint
npm run build
python3 -m compileall -q services/worker
python3 -m pytest services/worker/tests -q
if command -v shellcheck >/dev/null; then shellcheck scripts/*.sh; fi
