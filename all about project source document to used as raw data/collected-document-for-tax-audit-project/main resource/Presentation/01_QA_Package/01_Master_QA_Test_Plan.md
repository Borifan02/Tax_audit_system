# ITAS Tax Audit System — Master Quality Assurance (QA) Test Plan

## 1. Document Purpose & Scope
This Master QA Test Plan defines the verification and validation strategy, test scope, test levels, environment architecture, entry/exit criteria, and risk mitigation plan for the **Ethiopian Ministry of Revenues (MOR) Integrated Tax Audit System (ITAS)**.

All test specifications in this package are derived directly from the actual source code (`backend/bs-taxaudit-core-server` and `frontend/back-office-ui`), database migrations (`V0` through `V41`, **124 PostgreSQL tables**), and statutory requirements (`SOR FR-04.1` through `FR-04.9.2` and `ISO 19011`).

---

## 2. System Architecture Under Test

| Layer | Technology Stack | Verified Scope |
| :--- | :--- | :--- |
| **Backend Core Server** | Java 21, Spring Boot 3.4.3, Spring Security, Spring Data JPA / Hibernate, Maven | **838 Java source files**, **42 REST Controllers**, **406 API endpoints** |
| **Frontend Back-Office UI** | React 19, TypeScript / ES2022, Vite 8.2.1, Tailwind CSS, Lucide Icons, SSE | **2,054 compiled modules** across 8 role-based workspaces |
| **Relational Database** | PostgreSQL 16 (`itas_audit`), Flyway Migrations (`V0`–`V41`) | **124 Base Tables**, **1,729 Columns**, **103 Foreign Keys**, **327 Indexes** |
| **Security & Identity** | BCrypt (Strength 10) Password Engine, 5-Attempt Account Lockout, Signed HMAC-SHA256 JWT (`BackofficeSecurityService`), Mock/Keycloak OAuth2 Resource Server | **95+ Seeded MOR Accounts** across Federal LTOs (`federal-lto1`, `federal-lto2`) and 6 Regions (`AA`, `OR`, `AM`, `DD`, `SN`, `SM`) |

---

## 3. Modules Covered in Scope

1. **Module 01 — Authentication, Security, RBAC & System Administration**:
   - Login (`POST /api/v1/backoffice/auth/login`) with email, canonical username, legacy username, or UUID alias.
   - BCrypt password verification, default initial password (`Mor@2026!`), custom password policy enforcement (`>=10` chars, uppercase, lowercase, digit, special character), 5-attempt account lockout (30-minute lock), and System Administrator console (`/sys-admin`, `/api/v1/backoffice/auth/admin/*`).
2. **Module 02 — Annual Audit Planning & Risk Engine (`SOR FR-04.1`)**:
   - National annual plan creation, risk-based taxpayer classification (`MockTaxpayerAdapter` / `taxpayers_deep_550.json`), Director approval, regional deployment cascade (`ap_regional_deployments`), and tax center allocation adjustments (`ap_regional_tc_deployments`).
3. **Module 03 — Case Management, Team Leader Assignment & Handoff**:
   - Tax center case registry (`ap_audit_cases`), Team Leader dashboard, Auditor workload assignment, and multi-alias ownership verification (`matchesCaseTeamLeader` / `matchesCaseAuditor`).
4. **Module 04 — Joint Audit Committee (JAC) & Joint Audit Execution (`ITAS_Joint_Audit_System.md`)**:
   - Committee dashboard, session scheduling, multi-member voting, auditor nomination, statutory case handoff, and dedicated Joint Audit workspace (`/ja-workspace`) with the 5-Module Inter-Agency CAAT Engine (`jaCaatEngine.ts`: Multi-Agency Data Ingestion, 5-Way Cross-Matching, Benford's Law & Z-Score Anomaly Detection, Automated Working Paper & Sampling, and Statutory 30%/50% Penalty & Interest Calculator).
5. **Module 05 — Desk Audit Execution (`SOR FR-04.2` / `da_*` tables)**:
   - Return discrepancy analysis, document requests, audit procedures, working papers, findings, and desk audit draft report workflow.
6. **Module 06 — Comprehensive Audit & CAAT Engine (`SOR FR-04.4` / `ca_*` tables)**:
   - 9-step comprehensive field audit lifecycle: Entry Conference, CAAT Ledger Ingestion & Benford Analysis, 3-Way Statutory Reconciliations (`StepCompReconciliations.tsx`), Substantive Procedures, Working Papers, Query Sheets, Audit Findings, Exit Conference, and Assessment Notice generation.
7. **Module 07 — Transfer Pricing (`SOR FR-04.7` / `tp_*`) & Issue Audit (`SOR FR-04.3` / `issue_*`)**:
   - Strict phase-gate governance (`tp_phase_gates`), Functional/FAR Analysis, Working Hypothesis, Planning Committee Approval, OECD Arm's-Length Benchmarking, Field Work, Objection handling, and targeted Issue Audit execution.
8. **Module 08 — Audit Quality Assurance & ISO-19011 Compliance (`SOR FR-04.5` & `FR-04.9.2` / `qa_*`)**:
   - Automated & manual case sampling (`QaSamplingService`), 7 ISO-19011 Quality Dimensions (`DIM-01` to `DIM-07`) with weighted checkpoint scoring, Deficiency Notice issuance (`qa_deficiencies`), QA Report generation (`qa_reports`), underlying field audit dossier inspection (`/api/v1/backoffice/qa/cases/underlying/{id}`), and 4-role workflow (`QA_OFFICER`, `QA_TEAM_LEADER`, `QA_DIRECTOR`, and Field Audit Team `/qa-portal`).

---

## 4. Test Levels & Methodology

| Test Level | Objective | Execution Method |
| :--- | :--- | :--- |
| **1. Unit Testing** | Verify isolated domain use cases, state transitions, and business rules (`TpFieldWorkUseCase`, `TpAnalysisUseCase`, `TpPlanningMeetingUseCase`, `TpWorkingHypothesisUseCase`). | Maven Surefire (`mvn test`) with JUnit 5 & Mockito |
| **2. Functional API Testing** | Verify all positive and negative request/response contracts across all 8 modules against live PostgreSQL persistence. | Automated Python/Postman Runner (`validate_and_execute_collection.py`) |
| **3. Integration & Workflow Testing** | Verify multi-step state transitions and cross-table persistence (e.g., QA Dimension update -> Weighted Score recalculation -> QA Report sync -> Workflow transition -> Audit Trail event creation). | Live E2E API + PostgreSQL verification |
| **4. Security & RBAC Testing** | Verify BCrypt authentication, invalid credential rejection (`401`), account lockout tracking, JWT token issuance, and security audit log recording. | Automated Security Test Cases (`TC-AUTH-001` to `TC-AUTH-009`) |
| **5. Performance & Latency Testing** | Verify API response times under sequential and burst load against the target SLA (`< 500ms` for standard queries, `< 2000ms` for complex aggregations). | Measured in live test execution (`avg: 135.8ms`, `max: 456.87ms`) |
| **6. Regression & Build Verification** | Verify that TypeScript/React frontend (`2,054 modules`) and Java 21 backend (`838 source files`) compile with zero errors after all bug fixes and feature integrations. | `mvn compile -DskipTests` & `npm run build` (`vite build`) |

---

## 5. Entry & Exit Criteria

### Entry Criteria
- PostgreSQL 16 service active on `localhost:5432/itas_audit` with all 124 tables initialized.
- Spring Boot Core Server active on `localhost:8080` (`mock` profile with live PostgreSQL persistence).
- Frontend Vite build & dev server active on `localhost:3000`.

### Exit Criteria
- 100% compilation success on both Backend (`838 Java files`) and Frontend (`2,054 modules`).
- 100% pass rate on executed JUnit unit tests (`16/16 Passed`) and live E2E API test cases (`41/41 Passed`).
- All critical/blocker defects resolved and verified.
- Any unexecuted or external-dependency tests clearly documented and separated from completed test results.
