# Implementation Status

**Updated:** 2026-01-31  
**Scope:** Website, admin, backend (email out of scope).  
**Sources:** [doc/PRD.md](../doc/PRD.md), [epics.md](./epics.md).

## Project scaffold

- **Root:** npm workspaces (`backend`, `frontend`).
- **Backend:** Node 18+, Express, PostgreSQL. ES modules. Routes: `/api/health`, `/api/auth`, `/api/kms`.
- **Frontend:** Vite + React 18, React Router. Public site + admin under `/admin`. Mobile-first base CSS (Source Sans 3, eye-friendly palette).
- **Database:** Single migration script creates tables for Epic 1–4 (users, roles, documents, versions, access log, conflict incidents, peacebuilding actors, content pages, news, events, newsletter, applications).

## Epic 1: Knowledge Management System

| Story | Status | Notes |
|------|--------|--------|
| 1.1 Document upload and cloud storage with local backup | Done | Upload to `UPLOAD_DIR`, copy to `LOCAL_BACKUP_DIR`; categorization (project, thematic_area, document_type); confirmation. |
| 1.2 Metadata tagging and version control | Done | PATCH `/api/kms/documents/:id` for metadata; version history in GET document; document_versions table. |
| 1.3 Department dashboards and upload interface | Done | Dashboard shows department (user.department/role); upload form with auto metadata (author, date in metadata). |
| 1.4 Role-based access control | Done | `requireAuth` + `requireRole` on KMS routes; upload/patch restricted by role. |
| 1.5 Advanced search | Done | GET `/api/kms/documents` with q, project, thematic_area, from, to, type, author; facets endpoint; admin UI filters. |
| 1.6 Analytics and reporting | Done | GET `/api/kms/analytics/access`, `/api/kms/analytics/summary` (MERL/admin); access log on document view. |

## Epic 2: Conflict & Peace Data Management

| Story | Status | Notes |
|------|--------|--------|
| 2.1 Conflict incident database | Done | CRUD `/api/conflict/incidents`; filters (lga, from, to, intensity); admin Conflict Incidents page. |
| 2.2 Peacebuilding actors database | Done | CRUD `/api/conflict/actors`; filter by LGA; admin Peacebuilding Actors page. |
| 2.3 Interactive map (17 LGAs) | Done | `/api/conflict/lgas`, `/api/conflict/map-data` (public); admin Conflict Map page; public `/map` page with legend and LGA cards. |
| 2.4 Conflict trend analysis | Done | GET `/api/conflict/trends` (by LGA, intensity, triggers); admin Conflict Trends page. |

## Epic 3: Website Redesign

| Story | Status | Notes |
|------|--------|--------|
| 3.1 Domain migration & 301 redirects | Done | Env OLD_DOMAIN/NEW_DOMAIN; Express middleware 301 to pspba.org. |
| 3.2 Mobile-first & performance | Done | Base layout and CSS already mobile-first; NFR-P1 via lightweight pages. |
| 3.3 Content management admin | Done | Content pages, news, events CRUD; admin Content Pages, News, Events. |
| 3.4 Publish from KMS & approval | Done | documents.published_to_website; PATCH publish; content_approvals API (submit/approve). |
| 3.5 Galleries, videos, success stories | Done | Galleries table; CRUD admin; public /galleries and /galleries/:slug; image upload; cover image. Videos/success stories via content pages (HTML embeds). |
| 3.6 Public document repository | Done | GET /api/website/repository; public /repository page; publish from KMS. |
| 3.7 News, events, contact forms | Done | Public /news, /news/:slug, /events, /contact with form; POST contact, newsletter. |
| 3.8 Newsletter & conflict map | Done | POST /api/website/newsletter; public /map (Epic 2). |

## Epic 4: Online Application Portal

| Story | Status | Notes |
|------|--------|--------|
| 4.1 Volunteer form | Done | Name, contact, area of interest, motivation, optional CV; POST /api/applications. |
| 4.2 Intern form | Done | Name, contact, institution, preferred department, CV required; POST /api/applications. |
| 4.3 Consultant form | Done | Name, contact, expertise area, optional CV/proposal; POST /api/applications. |
| 4.4 Confirmation email & staff notification | Done | Confirmation email to applicant; staff notification email. Requires SMTP env vars (optional; skipped when not configured). |
| Applicant status lookup | Done | GET /api/applications/status?id=&email=; public /application-status page; ID shown after submit. |
| Admin user management | Done | GET/POST /api/auth/users, GET /api/auth/roles; Users page (admin only); create users with email, password, role. |
| Change password | Done | PATCH /api/auth/password; Change password page; link in dashboard header. |

## Post-epic enhancements

| Enhancement | Status | Notes |
|-------------|--------|--------|
| Public document download | Done | GET `/api/website/repository/:id/download`; Download button on public /repository. |
| Contact form storage | Done | `contact_messages` table; POST /contact stores; admin Contact messages page. |
| Newsletter subscribers admin | Done | GET /admin/newsletter-subscribers; admin page with Export CSV. |
| Content approval workflow | Done | Approvals page; Request approval on documents, pages, news, events; Approve sets published/published_to_website. |
| Combined dev script | Done | `npm run dev` starts API + frontend (concurrently). |
| Env validation (production) | Done | DATABASE_URL and JWT_SECRET (≥32 chars) required when NODE_ENV=production. |
| Health-check script | Done | `npm run health-check` hits /api/health; exit 0 if db ok (API_URL for remote). |
| API tests | Done | Node built-in test runner; health, lgas, auth, KMS 401, applications (submit/validation), website (galleries, repository, news). `npm run test`. Requires PostgreSQL + migrations. |
| Request approval feedback | Done | Brief “Request submitted” message on Documents, Pages, News, Events after Request approval. |
| Docker (local dev) | Done | `backend/Dockerfile`, `docker-compose.yml` (api + postgres); migrations on api start. |
| Backup script (NFR-R1) | Done | `scripts/backup.sh` — pg_dump + optional uploads; 30-day retention; run via cron. |

## How to run

1. `npm install`
2. Create DB: `createdb pspba`
3. `backend/.env`: `DATABASE_URL`, `JWT_SECRET`, optional `UPLOAD_DIR`, `LOCAL_BACKUP_DIR`
4. `npm run db:migrate`
5. `curl -X POST http://localhost:4000/api/auth/seed` (dev seed admin; API must be running once)
6. `npm run dev` — API (4000) + frontend (3000). Public: http://localhost:3000 · Admin: http://localhost:3000/admin (admin@pspba.org / admin123)

## Documentation

- **Operational manual:** [doc/OPERATIONAL-MANUAL.md](../doc/OPERATIONAL-MANUAL.md) — For PSPBA staff: admin usage, documents, content, applications, approvals. (NFR-M2.)

## CI

- **GitHub Actions:** `.github/workflows/ci.yml` — runs on push/PR to main/master: npm ci, db:migrate, npm test, npm run build. Uses PostgreSQL 16 service.

## Optional next steps

- **Tests:** Add tests for authenticated routes (KMS, admin) or E2E.
- **Deployment:** Docker prod (see README), reverse proxy, backups (NFR-R1).
