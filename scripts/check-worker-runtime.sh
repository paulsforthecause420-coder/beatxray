#!/usr/bin/env bash
set -euo pipefail

if ! command -v modal >/dev/null 2>&1; then
  echo "Modal CLI is required to verify the deployed worker image." >&2
  exit 1
fi

cd "$(dirname "$0")/../services/worker"
modal run modal_app.py::runtime_sanity_check
