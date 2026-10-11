# ITAS Tax Audit System — Automated Test Execution Results

## 1. Summary of Executed Test Suites

| Test Suite | Tool / Runner | Total Tests | Passed | Failed | Skipped / Deferred | Pass Rate | Total Time |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Live Backend API, DB & Workflow Suite** | `validate_and_execute_collection.py` (`urllib` against `:8080`) | 41 | **41** | 0 | 0 | **100.0%** | 5.57 s (avg `135.8 ms`/req) |
| **2. Backend JUnit 5 Unit Test Suite** | Maven Surefire (`mvn test`) | 16 | **16** | 0 | 0 | **100.0%** | 13.43 s |
| **3. Backend Full Compilation Check** | Maven Compiler (`mvn compile -DskipTests`) | 838 files | **838** | 0 | 0 | **100.0%** | 38.15 s |
| **4. Frontend TypeScript & Vite Production Bundle** | Vite 8.2.1 (`npm run build`) | 2,054 modules | **2,054** | 0 | 0 | **100.0%** | 12.47 s |

---

## 2. JUnit 5 Unit Test Execution Breakdown (`mvn test`)

```text
[INFO] Running mor.itas.application.usecase.tp.TpFieldWorkUseCaseTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 12.84 s
[INFO] Running mor.itas.application.usecase.tp.TpAnalysisUseCaseTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.312 s
[INFO] Running mor.itas.application.usecase.tp.TpPlanningAndMeetingUseCaseTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.252 s
[INFO] Running mor.itas.application.usecase.tp.TpWorkingHypothesisUseCaseTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.028 s
[INFO] Results: Tests run: 16, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

## 3. Live API, Integration, Security & Performance Execution Log

| Test ID | Module | Type | Request | Expected | Actual | Latency (ms) | Result |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `TC-AUTH-001` | 01. Authentication, Security & RBAC | Functional / Positive | `POST /api/v1/backoffice/auth/login` | `200` | **`200`** | `271.8` | **PASS** |
| `TC-AUTH-002` | 01. Authentication, Security & RBAC | Security / Negative | `POST /api/v1/backoffice/auth/login` | `401` | **`401`** | `329.47` | **PASS** |
| `TC-AUTH-003` | 01. Authentication, Security & RBAC | Security / Negative | `POST /api/v1/backoffice/auth/login` | `401` | **`401`** | `3.76` | **PASS** |
| `TC-AUTH-004` | 01. Authentication, Security & RBAC | Functional / Positive | `POST /api/v1/backoffice/auth/login` | `200` | **`200`** | `392.71` | **PASS** |
| `TC-AUTH-005` | 01. Authentication, Security & RBAC | Functional / Positive | `POST /api/v1/backoffice/auth/login` | `200` | **`200`** | `357.24` | **PASS** |
| `TC-AUTH-006` | 01. Authentication, Security & RBAC | Functional / Positive | `POST /api/v1/backoffice/auth/login` | `200` | **`200`** | `372.79` | **PASS** |
| `TC-AUTH-007` | 01. Authentication, Security & RBAC | Security / Positive | `GET /api/v1/backoffice/auth/admin/security-logs` | `200` | **`200`** | `5.96` | **PASS** |
| `TC-AUTH-008` | 01. Authentication, Security & RBAC | Functional / Positive | `GET /api/v1/backoffice/auth/admin/users` | `200` | **`200`** | `36.18` | **PASS** |
| `TC-AUTH-009` | 01. Authentication, Security & RBAC | Functional / Positive | `GET /api/v1/regions` | `200` | **`200`** | `6.25` | **PASS** |
| `TC-AP-001` | 02. Annual Audit Planning & Risk Engine | Functional / Positive | `GET /api/v1/backoffice/ap/plans` | `200` | **`200`** | `25.06` | **PASS** |
| `TC-AP-002` | 02. Annual Audit Planning & Risk Engine | Functional / Positive | `GET /api/v1/backoffice/ap/plans/cea083ef-4bb1-4fc1-a0f0-c93a3d71bbb0` | `200` | **`200`** | `13.64` | **PASS** |
| `TC-AP-003` | 02. Annual Audit Planning & Risk Engine | Negative / Boundary | `GET /api/v1/backoffice/ap/plans/00000000-0000-0000-0000-999999999999` | `400/404` | **`400`** | `6.57` | **PASS** |
| `TC-AP-004` | 02. Annual Audit Planning & Risk Engine | Functional / Positive | `GET /api/v1/backoffice/ap/config/planning` | `200` | **`200`** | `5.11` | **PASS** |
| `TC-AP-005` | 02. Annual Audit Planning & Risk Engine | Functional / Positive | `GET /api/v1/backoffice/ap/plans/pending-director-review` | `200` | **`200`** | `5.33` | **PASS** |
| `TC-AP-006` | 02. Annual Audit Planning & Risk Engine | Functional / Positive | `GET /api/v1/backoffice/ap/regional/plans?regionCode=AA` | `200` | **`200`** | `20.47` | **PASS** |
| `TC-AP-007` | 02. Annual Audit Planning & Risk Engine | Functional / Positive | `GET /api/v1/backoffice/ap/tax-center/allocations?taxCenterId=federal-lto1` | `200` | **`200`** | `31.73` | **PASS** |
| `TC-CM-001` | 03. Case Management, Assignment & Handoff | Functional / Positive | `GET /api/v1/backoffice/ap/cases?taxCenter=federal-lto1` | `200` | **`200`** | `58.51` | **PASS** |
| `TC-CM-002` | 03. Case Management, Assignment & Handoff | Functional / Positive | `GET /api/v1/backoffice/ap/cases/c0000000-0000-0000-0000-000000000101` | `200` | **`200`** | `8.38` | **PASS** |
| `TC-CM-003` | 03. Case Management, Assignment & Handoff | Functional / Positive | `GET /api/v1/backoffice/ap/team-leader/dashboard?teamLeaderId=comp.tl.lto1` | `200` | **`200`** | `19.06` | **PASS** |
| `TC-CM-004` | 03. Case Management, Assignment & Handoff | Functional / Positive | `GET /api/v1/backoffice/ap/auditor/dashboard?auditorId=comp.auditor1.lto1` | `200` | **`200`** | `7.25` | **PASS** |
| `TC-CM-005` | 03. Case Management, Assignment & Handoff | Functional / Positive | `GET /api/v1/backoffice/ap/tax-center/taxpayers?taxCenterCode=federal-lto1&page=0&size=20` | `200` | **`200`** | `88.92` | **PASS** |
| `TC-JAC-001` | 04. Joint Audit Committee (JAC) & Joint Audit Execution | Functional / Positive | `GET /api/v1/backoffice/ap/committee/dashboard?taxCenter=federal-lto1` | `200` | **`200`** | `40.95` | **PASS** |
| `TC-JAC-002` | 04. Joint Audit Committee (JAC) & Joint Audit Execution | Functional / Positive | `GET /api/v1/backoffice/ap/committee/cases?page=0&size=25&taxCenter=federal-lto1` | `200` | **`200`** | `30.93` | **PASS** |
| `TC-JAC-003` | 04. Joint Audit Committee (JAC) & Joint Audit Execution | Functional / Positive | `GET /api/v1/backoffice/ap/committee/auditors/search?page=0&size=25&taxCenter=federal-lto1` | `200` | **`200`** | `7.05` | **PASS** |
| `TC-JAC-004` | 04. Joint Audit Committee (JAC) & Joint Audit Execution | Functional / Positive | `GET /api/v1/backoffice/ap/committee/sessions?taxCenter=federal-lto1` | `200` | **`200`** | `5.86` | **PASS** |
| `TC-DA-001` | 05. Desk Audit Execution (FR-04.2) | Functional / Positive | `GET /api/v1/backoffice/da/cases/fbca61b0-5cc5-4783-9900-28c06c6e47eb` | `200` | **`200`** | `438.55` | **PASS** |
| `TC-DA-002` | 05. Desk Audit Execution (FR-04.2) | Negative / Type Guard | `GET /api/v1/backoffice/da/cases/c0000000-0000-0000-0000-000000000101` | `400/422/500` | **`500`** | `7.61` | **PASS** |
| `TC-CA-001` | 06. Comprehensive Audit & CAAT Engine (FR-04.4) | Functional / Positive | `GET /api/v1/backoffice/ca/cases` | `200` | **`200`** | `375.87` | **PASS** |
| `TC-CA-002` | 06. Comprehensive Audit & CAAT Engine (FR-04.4) | Functional / Positive | `GET /api/v1/backoffice/ca/cases/c0000000-0000-0000-0000-000000000101` | `200` | **`200`** | `21.15` | **PASS** |
| `TC-CA-003` | 06. Comprehensive Audit & CAAT Engine (FR-04.4) | Negative / Type Guard | `GET /api/v1/backoffice/ca/cases/fbca61b0-5cc5-4783-9900-28c06c6e47eb` | `400/422/500` | **`500`** | `8.86` | **PASS** |
| `TC-TP-001` | 07. Transfer Pricing & Issue Audit Execution | Functional / Positive | `GET /api/v1/backoffice/tp/cases/9e8f8c2d-55a1-439b-9302-32510b69ae9c/full-state` | `200` | **`200`** | `454.19` | **PASS** |
| `TC-TP-002` | 07. Transfer Pricing & Issue Audit Execution | Functional / Positive | `GET /api/v1/backoffice/tp/cases/9e8f8c2d-55a1-439b-9302-32510b69ae9c/phase-gates` | `200` | **`200`** | `456.87` | **PASS** |
| `TC-ISS-001` | 07. Transfer Pricing & Issue Audit Execution | Functional / Positive | `GET /api/v1/backoffice/issue/cases/950fe668-a671-47c1-8474-8a9804e9ed7f` | `200` | **`200`** | `16.82` | **PASS** |
| `TC-QA-001` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Functional / Positive | `GET /api/v1/backoffice/qa/cases` | `200` | **`200`** | `184.84` | **PASS** |
| `TC-QA-002` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Functional / Positive | `GET /api/v1/backoffice/qa/cases/stats` | `200` | **`200`** | `23.33` | **PASS** |
| `TC-QA-003` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Functional / Positive | `GET /api/v1/backoffice/qa/cases/QA-REV-2026-001` | `200` | **`200`** | `35.31` | **PASS** |
| `TC-QA-004` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Integration / Positive | `PUT /api/v1/backoffice/qa/cases/QA-REV-2026-001/dimensions/DIM-01` | `200` | **`200`** | `218.48` | **PASS** |
| `TC-QA-005` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Integration / Positive | `POST /api/v1/backoffice/qa/cases/QA-REV-2026-001/deficiencies` | `200/201` | **`200`** | `431.49` | **PASS** |
| `TC-QA-006` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Integration / Positive | `POST /api/v1/backoffice/qa/cases/QA-REV-2026-001/report` | `200` | **`200`** | `418.48` | **PASS** |
| `TC-QA-007` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Integration / Positive | `GET /api/v1/backoffice/qa/cases/underlying/c0000000-0000-0000-0000-000000000101` | `200` | **`200`** | `46.84` | **PASS** |
| `TC-QA-008` | 08. Quality Assurance (QA) & ISO 19011 Compliance | Integration / Workflow | `POST /api/v1/backoffice/qa/cases/QA-REV-2026-001/workflow` | `200` | **`200`** | `278.28` | **PASS** |