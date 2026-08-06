#!/usr/bin/env bash
set -euo pipefail
npm run lint
npm run build
python3 -m compileall services/worker
if command -v shellcheck >/dev/null; then shellcheck scripts/*.sh; fi
