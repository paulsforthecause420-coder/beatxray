#!/usr/bin/env bash
set -euo pipefail
commands=(git node npm docker python3)
optional=(gh supabase modal vercel stripe ffmpeg ffprobe)
for cmd in "${commands[@]}"; do
  command -v "$cmd" >/dev/null || { echo "MISSING required command: $cmd"; exit 1; }
  printf '%-12s %s\n' "$cmd" "$($cmd --version 2>/dev/null | head -1)"
done
for cmd in "${optional[@]}"; do
  if command -v "$cmd" >/dev/null; then printf '%-12s %s\n' "$cmd" "$($cmd --version 2>/dev/null | head -1)"; else echo "OPTIONAL missing: $cmd"; fi
done
