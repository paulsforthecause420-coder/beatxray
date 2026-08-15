#!/usr/bin/env bash
set -euo pipefail

# Docker is needed only to run the optional local Supabase stack. Production uses managed Supabase, Modal, and Vercel.
required=(git node npm python3)
optional=(docker gh supabase modal vercel stripe ffmpeg ffprobe)

for command_name in "${required[@]}"; do
  command -v "$command_name" >/dev/null || { echo "MISSING required command: $command_name"; exit 1; }
  printf '%-12s %s\n' "$command_name" "$("$command_name" --version 2>/dev/null | head -1)"
done
for command_name in "${optional[@]}"; do
  if command -v "$command_name" >/dev/null; then
    printf '%-12s %s\n' "$command_name" "$("$command_name" --version 2>/dev/null | head -1)"
  else
    echo "OPTIONAL missing: $command_name"
  fi
done
