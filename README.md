# ITAS Audit System

**Integrated Tax Administration System – Tax Audit Module** (Ministry of Revenue, Ethiopia)

A full-stack web application that manages the complete tax-audit lifecycle: annual audit planning, case creation and routing, committee review, audit execution (Desk, Comprehensive, Transfer Pricing, Issue, Joint), quality assurance, and reporting.

The system is split into two parts that work together:

| Part | Location | Stack | Default URL |
|------|----------|-------|-------------|
| **Backend** (REST API) | `backend/bs-taxaudit-core-server` | Java 21, Spring Boot 3.2.5, PostgreSQL, Flyway | http://localhost:8080 |
| **Frontend** (Back-office UI) | `frontend/back-office-ui` | React 19, Vite, Tailwind CSS | http://localhost:3000 |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Repository Structure](#repository-structure)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Backend](#backend)
6. [Frontend](#frontend)
7. [How Frontend and Backend Communicate](#how-frontend-and-backend-communicate)
8. [Audit Workflow](#audit-workflow)
9. [Roles](#roles)
10. [Testing](#testing)
11. [Docker](#docker)
12. [Environment Variables](#environment-variables)
13. [Additional Documentation](#additional-documentation)
14. [Known Gaps / Notes](#known-gaps--notes)
15. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌──────────────────────────┐        HTTP / JSON        ┌────────────────────────────────┐
│  Back-Office UI          │  ───────────────────────► │  Core Server (Spring Boot)      │
│  React 19 + Vite :3000   │   /api/*  (Vite proxy)    │  :8080                          │
│                          │   X-Actor-Id header       │                                 │
│  features/ ap ca da tp   │ ◄───────────────────────  │  api → application → domain     │
│  issue ja qa committee   │        JSON / SSE         │  persistence (JPA) → PostgreSQL │
│  teamleader portal       │                           │  Flyway migrations (db/migration)│
└──────────────────────────┘                           └────────────────────────────────┘
                                                                  │
                                                         PostgreSQL (itas_audit)
```

**Backend layering** (package `mor.itas`):

| Package | Responsibility |
|---------|----------------|
| `api` | REST controllers, request/response DTOs, mappers, exception advice |
| `application` | Use cases, services, ports, events |
| `domain` | Aggregates, models, value objects, domain events and exceptions |
| `persistence` | JPA entities, Spring Data repositories, adapters, mappers |
| `infrastructure` | Security (Keycloak JWT, org-scope authorization), observability, config |
| `engineadapter` | Adapters to external engines (risk, workflow, DMS, taxpayer registry, analytics, notifications, etc.) |
| `observability` | Audit-trail logging and request filters |
| `seeders` / `config` | Mock-profile data seeders, security and OpenAPI config |

**Frontend layout** is feature-based: each audit type has its own folder under `src/features/` with its own components, hooks, services, and types.

---

## Repository Structure

```
itas-audit-system/
├── backend/
│   └── bs-taxaudit-core-server/        # Spring Boot application
│       ├── pom.xml
│       ├── Dockerfile
│       ├── start-dev.bat               # Windows dev launcher (mock profile)
│       └── src/main/
│           ├── java/mor/itas/...       # See architecture table above
│           └── resources/
│               ├── application.yml     # Profiles: default, mock, prod
│               ├── taxpayers_deep_550.json   # Sample taxpayer data
│               └── db/migration/       # Flyway SQL migrations (V0 … V41)
├── frontend/
│   ├── back-office-ui/                 # Main React application
│   │   ├── package.json
│   │   ├── vite.config.js              # Dev server :3000, proxies /api → :8080
│   │   ├── tailwind.config.js
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── components/             # Shared UI, layout, login, notifications
│   │       ├── config/navigation.js    # Role-based menus
│   │       ├── hooks/                  # useCases, useUsers, usePermission, ...
│   │       ├── services/apiClient.js   # Backend API client
│   │       └── features/
│   │           ├── ap/                 # Annual Planning
│   │           ├── da/                 # Desk Audit
│   │           ├── ca/                 # Comprehensive Audit
│   │           ├── tp/                 # Transfer Pricing
│   │           ├── issue/              # Issue Audit
│   │           ├── ja/                 # Joint Audit (committee + team leader)
│   │           ├── committee/          # Review Committee
│   │           ├── teamleader/         # Team Leader workflow
│   │           ├── qa/                 # Quality Assurance
│   │           └── portal/             # Portal pages
│   └── taxpayer-portal-ui/             # Taxpayer portal (placeholder: package.json + Dockerfile only)
├── deployment/scripts/                 # docker-build.sh, init-db.sql, seed-*.sql
├── start-backend.sh                    # Run backend in mock profile
├── start-frontend.sh                   # Run frontend dev server
├── setup_2026_plan.sh                  # Seed a 2026 annual plan through the API
├── e2e_test.sh, run_full_e2e_plan_2026.sh, test_e2e_*.sh, test-*routing*.sh
├── docker-compose.test.yml             # PostgreSQL for tests (port 5434)
└── *.md                                # Design / implementation documents
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | **21** |
| Maven | 3.9+ |
| Node.js | 18+ (20 LTS recommended) |
| npm | 9+ |
| PostgreSQL | 15+ (or Docker) |
| curl | for the e2e shell scripts |

---

## Quick Start

### 1. Start PostgreSQL

Using Docker:

```bash
docker run -d --name itas-db \
  -e POSTGRES_DB=itas_audit \
  -e POSTGRES_USER=itas_dev \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 postgres:15-alpine
```

The values above match the defaults in `application.yml`. Adjust them (and the [environment variables](#environment-variables)) if you use your own database.

### 2. Start the backend

```bash
./start-backend.sh
```

This runs `mvn spring-boot:run` with the **`mock`** profile and skips tests. Alternatively:

```bash
cd backend/bs-taxaudit-core-server
mvn spring-boot:run -Dspring-boot.run.profiles=mock -DskipTests
```

On Windows: `backend\bs-taxaudit-core-server\start-dev.bat`.

The API is available at http://localhost:8080 and the Swagger UI (springdoc) at http://localhost:8080/swagger-ui.html. Health: http://localhost:8080/actuator/health.

### 3. Start the frontend

```bash
cd frontend/back-office-ui
npm install
npm run dev          # or, from the repo root: ./start-frontend.sh
```

Open http://localhost:3000. The Vite dev server proxies `/api` to `http://localhost:8080`.

> Start the **backend first**. The UI requires valid users from the database, which the backend creates and seeds on startup.

---

## Backend

**Location:** `backend/bs-taxaudit-core-server`

### Spring profiles

| Profile | Purpose | Security | Schema |
|---------|---------|----------|--------|
| `mock` (default) | Local development | `MockSecurityConfig`: all requests permitted, CORS open to any origin | `ddl-auto: update`; mock data seeders run |
| `prod` | Production | OAuth2 resource server (Keycloak JWT) via `SecurityConfig` | `ddl-auto: validate`; Flyway migrations expected |

### Build and run

```bash
cd backend/bs-taxaudit-core-server
mvn clean package -DskipTests        # build the jar
java -jar target/bs-taxaudit-core-server-1.0.0-SNAPSHOT.jar --spring.profiles.active=mock
```

### Database migrations

Flyway SQL scripts live in `src/main/resources/db/migration` (V0 → V41). They cover, among others:

- Shared infrastructure, annual plan (AP) tables, regional deployments, tax-center adjustments, revenue tracking
- Identity & RBAC, workflow engine, organizational hierarchy and ownership
- Case hand-off workflow, planning configuration
- Execution schemas for Transfer Pricing, Desk Audit, QA, and Comprehensive Audit
- Seed data for users, organization structure, and sample cases

> In `application.yml`, Flyway is set to `enabled: false` by default and the `mock` profile relies on Hibernate `ddl-auto: update`. For production, enable Flyway and use `prod` so the schema is managed by migrations.

### Main API groups

All endpoints are under `/api/v1` (a public taxpayer API is under `/api/public/v1`).

| Base path | Area |
|-----------|------|
| `/api/v1/backoffice/auth` | Login, change password |
| `/api/v1/backoffice/ap/plans`, `/plans/workflow` | Annual audit plans and approval workflow |
| `/api/v1/backoffice/ap/regional`, `/tax-center`, `/revenue`, `/config/planning` | Regional/tax-center allocation, feedback, revenue, planning config |
| `/api/v1/backoffice/ap/cases`, `/committee(s)`, `/team-leader`, `/auditor` | Case management and role dashboards |
| `/api/v1/backoffice/cases`, `/cm` | Case assignment and cascade |
| `/api/v1/backoffice/da/cases` | Desk Audit |
| `/api/v1/backoffice/ca/cases` | Comprehensive Audit |
| `/api/v1/backoffice/tp/cases/{caseId}` | Transfer Pricing audit execution |
| `/api/v1/backoffice/issue/cases/{caseId}` | Issue audit execution |
| `/api/v1/backoffice/qa/cases` | Quality Assurance |
| `/api/v1/tasks`, `/api/v1/notifications`, `/api/v1/users`, `/api/v1/planning` | Workflow tasks, notifications, users, planning |

Browse the full, current list in Swagger UI.

---

## Frontend

**Location:** `frontend/back-office-ui`

**Stack:** React 19, Vite, Tailwind CSS 3, Axios, lucide-react.

### Scripts

```bash
npm install        # install dependencies
npm run dev        # dev server on http://localhost:3000 (strict port)
npm run build      # production build to dist/
npm run preview    # preview the production build
```

### Feature modules (`src/features`)

| Folder | Module |
|--------|--------|
| `ap` | Annual Planning: plans, regional allocation, approvals |
| `da` | Desk Audit workspace: stepper (overview → procedures → analysis → evidence → queries → findings → working papers → draft report → review & submit), team-leader workspace, audit-trail drawer |
| `ca` | Comprehensive Audit: workspace plus entry/exit conference, CAAT evidence, reconciliations; Team Leader, Director, and Fraud Investigator workspaces |
| `tp` | Transfer Pricing audit |
| `issue` | Issue-based audit |
| `ja` / `committee` / `teamleader` | Review committee (chairperson, voting, sessions, auditor nomination, research) and team-leader case execution with live updates (SSE) |
| `qa` | Quality Assurance director and team-leader workspaces |
| `portal` | Portal pages |

Navigation is role-based and configured in `src/config/navigation.js`.

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1/backoffice/ap` | Base URL used by `services/apiClient.js` |

Create `frontend/back-office-ui/.env` to override.

---

## How Frontend and Backend Communicate

1. **Dev proxy.** `vite.config.js` forwards any `/api` request from `:3000` to `http://localhost:8080`, avoiding CORS issues in development.
2. **Actor header.** In `mock` mode there is no JWT. After login the UI stores the user ID in `sessionStorage` and sends it on every request as **`X-Actor-Id`**. The backend uses it to identify the acting user and resolve role/org scope. An unknown ID returns **401**.
3. **Case queries need a filter.** The case-list endpoints require at least one filter (`taxCenter`, `teamLeader`, `committeeId`, or `auditor`).
4. **Real-time updates.** The committee modules use Server-Sent Events (`useCommitteeSSE`, `services/sse.js`) served by `CommitteeEventService`.
5. **Production.** With the `prod` profile the backend validates Keycloak-issued JWTs (`KEYCLOAK_URL`, realm `itas`), so the frontend must obtain and send a bearer token instead of relying on `X-Actor-Id`.

Example call:

```bash
curl http://localhost:8080/api/v1/backoffice/ap/plans \
  -H "X-Actor-Id: u-dir"
```

---

## Audit Workflow

### Annual plan routing

```
Planning Team creates plan  → DRAFT
  → Submit to Director      → SUBMITTED_TO_DIRECTOR
  → Director approves       → DIRECTOR_APPROVED
  → Routed to Regional Directors (each sees only its allocation)
                            → AWAITING_REGIONAL_FEEDBACK
  → Regions submit feedback → FEEDBACK_COLLECTED
  → Director final review   → FINAL_APPROVED
  → Plan active; cases generated and assigned to tax centers
```

### Case lifecycle

```
Case generated → Review Committee (chairperson assigns team leader, hand-off)
  → Team Leader assigns auditor(s)
  → Auditor executes (DA / CA / TP / Issue / Joint workspace)
  → Team Leader review → (Director review) → Quality Assurance
  → Report finalized
```

See `PLAN_ROUTING_WORKFLOW.md`, `IMPLEMENTATION_COMPLETE.md` (case hand-off and auditor assignment), and `JOINT_AUDIT_SYSTEM_PROMPT_AND_ARCHITECTURE_GUIDE.md` for details.

---

## Roles

Roles referenced in the backend and navigation include:

`SYSTEM_ADMIN`, `DIRECTOR`, `AUDIT_DIRECTOR`, `PLANNING_TEAM`, `TAX_CENTER_MANAGER`, `REVIEW_COMMITTEE`, `CHAIRPERSON`, `TEAM_LEADER`, `AUDITOR`, `USER`, plus Fraud Investigator and QA roles.

Users and the organizational hierarchy (federal/regional/tax-center) are seeded by Flyway migrations (`V16`, `V22`, `V23`, `V29`, `V32`–`V33`) and by the seeders in `mor.itas.seeders`. Usernames follow patterns such as `u-dir`, `u-po-aa1`, `u-pt-01`. Login accepts a username or email and password; accounts may be required to change their password at first login. Check the seeders and migrations for the current seeded accounts and initial-password policy.

---

## Testing

End-to-end tests are shell scripts that call the running API with `curl`. Start the backend first.

| Script | Purpose |
|--------|---------|
| `e2e_test.sh` | Plan creation → director approval → regional approval flow |
| `run_full_e2e_plan_2026.sh` | Full 2026 plan end-to-end run |
| `setup_2026_plan.sh` | Seed a 2026 plan via the API |
| `test_e2e_tp_lifecycle.sh` | Transfer Pricing audit lifecycle |
| `test_e2e_joint_lifecycle.sh` | Joint audit lifecycle |
| `test-plan-routing.sh`, `test-complete-routing.sh`, `test-routing-final.sh` | Plan routing to regional directors |
| `test-workflow.js` | Node workflow test |

```bash
chmod +x *.sh
./e2e_test.sh
```

Backend unit/integration tests use JUnit 5, Spring Security Test, and Testcontainers (Docker required):

```bash
cd backend/bs-taxaudit-core-server
mvn test
```

A standalone test database is provided:

```bash
docker compose -f docker-compose.test.yml up -d    # PostgreSQL on localhost:5434
```

---

## Docker

- `backend/bs-taxaudit-core-server/Dockerfile` – builds the backend image.
- `frontend/back-office-ui/Dockerfile` and `frontend/taxpayer-portal-ui/Dockerfile` – frontend images.
- `deployment/scripts/docker-build.sh` – image build helper.
- `deployment/scripts/init-db.sql`, `seed-data.sql`, `seed-auditors.sql` – database initialization and seed scripts.

Note: the root `docker-compose.yml` is currently empty (see [Known Gaps](#known-gaps--notes)), so the full stack is not yet launchable with a single `docker compose up`.

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `itas_audit` | Database name |
| `DB_USER` | `itas_dev` | Database user |
| `DB_PASSWORD` | `dev_password` | Database password (**change outside local dev**) |
| `KEYCLOAK_URL` | `http://localhost:8081` | Keycloak base URL (issuer is `${KEYCLOAK_URL}/realms/itas`) |
| `JAVA_HOME` | – | Must point to JDK 21 |

Select the profile with `--spring.profiles.active=mock|prod` (or `SPRING_PROFILES_ACTIVE`).

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1/backoffice/ap` | Backend API base URL |

---

## Additional Documentation

| File | Contents |
|------|----------|
| `SETUP_STATUS.md` | Early setup notes and fixes |
| `PLAN_ROUTING_WORKFLOW.md` | Plan routing to regional directors |
| `IMPLEMENTATION_COMPLETE.md` | Case hand-off & auditor assignment implementation |
| `PHASE_5_6_IMPLEMENTATION_SUMMARY.md`, `PHASE_7_8_IMPLEMENTATION_SUMMARY.md` | Phase summaries |
| `COMPREHENSIVE_AUDIT_INTEGRATION_REPORT.md` | Comprehensive Audit integration |
| `QA_AUDIT_INTEGRATION_GUIDE.md` | Quality Assurance integration |
| `EXCEPTION_LAYER_VERIFICATION.md` | Exception-handling layer verification |
| `JOINT_AUDIT_SYSTEM_PROMPT_AND_ARCHITECTURE_GUIDE.md` | Joint Audit architecture |
| `frontend/back-office-ui/src/components/case-details/README.md` | Case status display component |
| `frontend/back-office-ui/src/services/UI-INTEGRATION-GUIDE.md` | Frontend API integration |
| `all about project source document.../` | Raw source material (requirements, DB schema, cluster details, UI screenshots) |

---

## Known Gaps / Notes

- `docker-compose.yml`, `Makefile`, and `CONTRIBUTING.md` are currently empty.
- `frontend/taxpayer-portal-ui` contains only a `package.json` and `Dockerfile`; no source code is included yet.
- Flyway is disabled in the base config and the `mock` profile uses `ddl-auto: update`. Enable Flyway for staging/production.
- Mock mode permits all requests with open CORS. **Never deploy with the `mock` profile.**
- Default database credentials in `application.yml` are for local development only.
- Some shared components exist in two places (`components/` and `components/shared/`; `features/ja` and `features/committee`) and may be consolidated.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `401 Unauthorized` / "Invalid user" in the UI | Log in with a valid seeded user; the `X-Actor-Id` must exist in the `users` table |
| Backend cannot connect to the database | Check PostgreSQL is running and `DB_*` variables match |
| Frontend: port 3000 in use | `strictPort` is enabled; free port 3000 or change it in `vite.config.js` |
| Maven build fails on Java version | Set `JAVA_HOME` to JDK 21 |
| Schema validation errors | Use the `mock` profile for local dev, or reset the DB and re-run migrations |
| Empty case lists | Case endpoints require a filter (`taxCenter`, `teamLeader`, `committeeId`, or `auditor`) |
| CORS errors | Use the Vite proxy (`/api`) or run the backend with the `mock` profile |

---

## License

No license file is included in the project. Add one before distributing.