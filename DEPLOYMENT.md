# Deployment

Production checklist and options for PSPBA KMS & Website.

## Production checklist

### Environment (backend)

- **DATABASE_URL** — PostgreSQL connection string (required when `NODE_ENV=production`).
- **JWT_SECRET** — At least 32 characters (required in production; server exits if missing).
- **NODE_ENV** — Set to `production`.
- **PORT** — API port (default 4000).
- **UPLOAD_DIR**, **LOCAL_BACKUP_DIR** — Paths for uploads and backups (optional; defaults under backend).
- **OLD_DOMAIN**, **NEW_DOMAIN** — For 301 redirect from plateaupeacebuilding.org to pspba.org (optional).
- **SMTP_HOST**, **SMTP_PORT**, **SMTP_SECURE**, **SMTP_USER**, **SMTP_PASS**, **SMTP_FROM** — For application confirmation emails (optional; when not set, emails are skipped).
- **STAFF_NOTIFICATION_EMAIL** — Email address to notify when new applications are submitted (optional).

### One-time setup

1. Create PostgreSQL database and run migrations:
   ```bash
   npm run db:migrate
   ```
   Or with Docker: migrations run on API start when using `docker compose up` (see README).

2. Create at least one admin user (do not use `/api/auth/seed` in production; create users via a secure process or migration).

### Health and tests

- **Health:** `GET /api/health` returns `{ status: 'ok', db: 'ok' }` when DB is reachable. Use `npm run health-check` (set `API_URL` for remote).
- **Tests:** `npm run test` runs backend API tests.

### Frontend in production

1. Build:
   ```bash
   npm run build:web
   ```
   Output: `frontend/dist/`.

2. Serve the built app from the same origin as the API (e.g. reverse proxy) so `/api` goes to the API and everything else to the static app. See **nginx.conf.example** in the repo for a full example (SPA + `/api` proxy + optional SSL).

Alternatively, host the static build on a CDN or static host and set the API base URL via env (e.g. Vite `VITE_API_URL`) so the frontend calls the correct API.

### 301 redirect (domain migration)

- Set **OLD_DOMAIN** (e.g. `plateaupeacebuilding.org`) and **NEW_DOMAIN** (e.g. `pspba.org`) so the API returns 301 for requests to the old domain. For edge-level redirects, configure 301 at the reverse proxy or CDN instead.

### SSL/TLS

- Terminate HTTPS at the reverse proxy or load balancer. Ensure NFR-S1 (SSL/TLS for all traffic) is met.

## Docker

- **Local dev:** See README: `docker compose up -d` runs API + PostgreSQL. Run the frontend locally with `npm run dev:web`.
- **Production-style (full stack):** `docker compose -f docker-compose.prod.yml up -d` runs API + PostgreSQL + Frontend (nginx on port 80, `/api` proxied to API). Set env: `POSTGRES_PASSWORD`, `JWT_SECRET` (min 32 chars). Optional: `POSTGRES_DB`, `POSTGRES_USER`. Create an admin user separately (do not use `/api/auth/seed` in production).

### Backups (NFR-R1)

Run `scripts/backup.sh` daily for database and optional uploads backup with 30-day retention.

```bash
DATABASE_URL=postgresql://... BACKUP_DIR=/var/backups/pspba UPLOAD_DIR=./backend/uploads npm run backup
```

**Env:** `DATABASE_URL` (required), `BACKUP_DIR` (default: `./backups`), `UPLOAD_DIR` (optional), `RETENTION_DAYS` (default: 30).

**Cron (daily at 2am):** `0 2 * * * cd /path/to/project && DATABASE_URL=... BACKUP_DIR=... npm run backup`

**Requirements:** `pg_dump` (PostgreSQL client tools) must be in PATH.

## Optional next steps

- Run migrations as a one-off job in CI/CD or a separate container (instead of on every API start) when scaling API replicas.
- Add a production `docker-compose` or Dockerfile that builds the frontend and serves it (e.g. nginx) alongside the API.
