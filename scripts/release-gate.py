#!/usr/bin/env python3
from pathlib import Path
import re, sys

p = Path('docs/release-evidence.md')
if not p.exists():
    print('NOT READY')
    print('Reason: docs/release-evidence.md is missing.')
    raise SystemExit(1)

text = p.read_text(errors='replace')
critical = [
    'Database/schema','Authentication','Authorization/isolation',
    'Core workflow','Protected API','Production build',
    'Production deployment','Production smoke test',
    'Adversarial audit','Rollback'
]
optional = ['Webhook authenticity/idempotency','Billing/entitlement','Android release']

def status(name):
    pat = re.compile(r'^\|\s*' + re.escape(name) + r'\s*\|\s*(PASS|FAIL|UNVERIFIED|N/A)\s*\|', re.I|re.M)
    m = pat.search(text)
    return m.group(1).upper() if m else 'MISSING'

problems = []
for g in critical:
    s = status(g)
    if s != 'PASS':
        problems.append((g,s))
for g in optional:
    s = status(g)
    if s not in {'PASS','N/A'}:
        problems.append((g,s))

section = re.search(r'## Confirmed release blockers\s*(.*?)(?=\n## |\Z)', text, re.S|re.I)
if section:
    meaningful = [ln.strip(' -*\t') for ln in section.group(1).splitlines() if ln.strip() and 'none recorded' not in ln.lower()]
    if meaningful:
        problems.append(('Confirmed release blockers','PRESENT'))

if problems:
    print('NOT READY')
    print('Gates not proven:')
    for g,s in problems:
        print(f' - {g}: {s}')
    raise SystemExit(1)

print('READY')
print('All configured release-gate rows are PASS or valid N/A.')
print('This script validates evidence bookkeeping; independent review must assess evidence quality.')
