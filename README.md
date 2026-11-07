# PSPBA Knowledge Management System & Website

Plateau State Peacebuilding Agency (PSPBA) — Knowledge Management System, public website (pspba.org), and admin. Built from [doc/PRD.md](doc/PRD.md) and [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md). Email system upgrade is out of scope for this phase.

## Stack

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React (Vite), React Router
- **Scope:** Website, admin (KMS dashboards, CMS, content approval), backend (repository, conflict data, map, application portal)

## Prerequisites

- Node.js 18+
- PostgreSQL (local or remote)

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Database**
   - Create DB: `createdb pspba`
   - Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` (e.g. `postgresql://localhost:5432/pspba`)

3. **Migrations** (run once)
   ```bash
   npm run db:migrate
   ```

4. **Seed admin (dev only)**
   ```bash
   curl -X POST http://localhost:4000/api/auth/seed
   ```
   Then log in at http://localhost:3000/admin/login with `admin@pspba.org` / `admin123`.

5. **Seed demo data (optional)** — Populate all pages with dummy content:
   ```bash
   npm run seed:demo
   ```
   Creates news, events, galleries, documents, content pages (team, partners, etc.), conflict incidents, peacebuilding actors, partners, contact messages, and sample applications. The script prints application IDs for testing the status lookup at `/application-status`.

5. **Start app**
   ```bash
   npm run dev
   ```
   Starts API (port 4000) and frontend (port 3000). Public site: http://localhost:3000 · Admin: http://localhost:3000/admin

## Scripts

| Command | Description |
|---------|--------------|
| `npm run dev` | Start API + frontend (one command) |
| `npm run dev:api` | Start API only (port 4000) |
| `npm run dev:web` | Start frontend only (port 3000) |
| `npm run db:migrate` | Run database migrations |
| `npm run build` | Build frontend for production |
| `npm run build:api` | Build backend |
| `npm run start:api` | Run API (after build) |
| `npm run start:web` | Preview production frontend |
| `npm run health-check` | Hit `/api/health`; exit 0 if DB ok (set `API_URL` for remote) |
| `npm run backup` | Backup DB + uploads (NFR-R1); needs `DATABASE_URL`, `pg_dump` in PATH |
| `npm run test` | Run backend API tests (Node built-in test runner; requires PostgreSQL + `npm run db:migrate`) |

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to `main` or `master`: install, migrate, test, build.

## Documentation

- **[Operational manual](doc/OPERATIONAL-MANUAL.md)** — For PSPBA staff: how to use the admin, upload documents, manage content, and process applications.
- **[Deployment](DEPLOYMENT.md)** — Production checklist, env vars, Docker.

## Implementation status

- **Epic 1 (KMS):** Document upload with local backup, metadata/versioning, department dashboards, RBAC, search/facets, analytics.
- **Epic 2 (Conflict data):** Incidents, peacebuilding actors, map (17 LGAs), trend analysis; public map.
- **Epic 3 (Website):** Content pages, news, events, contact form, newsletter, public repository, publish-from-KMS, 301 redirect.
- **Epic 4 (Applications):** Volunteer, intern, consultant forms; admin Applications list; confirmation message (email out of scope).
- **Epic 3.5 (Galleries):** Photo galleries; admin CRUD; public /galleries.

## Docker (optional)

**Local dev (API + Postgres only):**
```bash
docker compose up -d
```
- API: http://localhost:4000 · Postgres: localhost:5432 (user/pass `pspba`, db `pspba`)
- Migrations run on API start. Seed admin: `curl -X POST http://localhost:4000/api/auth/seed`
- Run frontend locally: `npm run dev:web` (proxies `/api` to API)

**Production-style (API + Postgres + Frontend):**
```bash
export POSTGRES_PASSWORD=your-secure-password
export JWT_SECRET=your-jwt-secret-at-least-32-characters
docker compose -f docker-compose.prod.yml up -d
```
- Site: http://localhost (frontend on port 80; `/api` proxied to API). Create admin user separately; do not use `/api/auth/seed` in production.

## Environment

- `backend/.env`: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `UPLOAD_DIR`, `LOCAL_BACKUP_DIR`. Optional cloud storage vars when added.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production checklist, env vars, frontend build, health-check, and optional Docker/nginx notes.
