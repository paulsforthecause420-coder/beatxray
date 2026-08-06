# Beat >X< RAY workspace setup

## Install
1. Git
2. Node.js 20.9 or newer
3. VS Code
4. Docker Desktop (for local Supabase)
5. Supabase CLI
6. Python 3.11
7. Modal CLI
8. Vercel CLI

Recommended VS Code extensions: ESLint, Tailwind CSS IntelliSense, Prettier, GitLens, Python, Pylance, Docker.

## Accounts
- GitHub: source control
- Vercel: web deployment
- Supabase: authentication, Postgres, private storage
- Modal: Python processing worker
- Namecheap or current registrar: DNS for beatxray.com and zerohype.org

## Local startup
```bash
cp apps/web/.env.example apps/web/.env.local
npm install
npm run dev
```

Create a Supabase project, run `supabase/migrations/001_initial.sql` in the SQL editor, then copy the project URL and publishable key into `apps/web/.env.local`.

## Worker deployment
```bash
cd services/worker
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
modal setup
modal secret create beatxray-secrets SUPABASE_URL=... SUPABASE_SECRET_KEY=... WORKER_WEBHOOK_SECRET=...
modal deploy modal_app.py
```
Copy the Modal endpoint URL into `WORKER_WEBHOOK_URL` in Vercel and use the same `WORKER_WEBHOOK_SECRET` in both environments.

## Vercel
Import the GitHub repository, set Root Directory to `apps/web`, add all environment variables, and deploy.

## Domains
- `beatxray.com` → primary Vercel production domain
- `www.beatxray.com` → redirect to `beatxray.com`
- `zerohype.org` → organization site; link to BeatXray as a product
- Optional `app.beatxray.com` → move the authenticated dashboard here later

Use the exact DNS records Vercel displays; do not guess values because they can vary by configuration.
