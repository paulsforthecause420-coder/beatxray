#!/usr/bin/env python3
from pathlib import Path
import json, shutil

root = Path.cwd()
print('=== Production SaaS Preflight ===')
print('Root:', root)

required = [
    'AGENTS.md', 'PLANS.md',
    '.agents/skills/production-saas/SKILL.md',
    '.agents/skills/production-auditor/SKILL.md',
    '.codex/agents/production-auditor.toml',
    'docs/release-evidence.md'
]
missing = [x for x in required if not (root / x).exists()]
if missing:
    print('\nHarness missing:')
    for x in missing:
        print(' -', x)
else:
    print('\nHarness structure: PASS')

print('\nTool availability:')
for exe in ['git','node','npm','pnpm','yarn','python','python3','codex']:
    p = shutil.which(exe)
    if p:
        print(f' + {exe}: {p}')

pkg = root / 'package.json'
if pkg.exists():
    try:
        data = json.loads(pkg.read_text())
        print('\nDetected package scripts:')
        for key in ['typecheck','lint','test','test:e2e','build','dev','start']:
            if key in data.get('scripts', {}):
                print(f" - {key}: {data['scripts'][key]}")
    except Exception as e:
        print('Could not parse package.json:', e)

print('\nPreflight is discovery only; it does not prove production readiness.')
