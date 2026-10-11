# ITAS Tax Audit System — Engineering, QA, API & Database Deliverables Index

This directory contains the three complete, independent, and verified engineering deliverables generated from the actual **ITAS Tax Audit System** codebase, live PostgreSQL 16 database (`itas_audit`), and running Spring Boot 3.4.3 backend (`http://localhost:8080`).

---

## Deliverable 1: `01_QA_Package/` — Complete QA Plan, Test Cases, Execution Results & Bug Log
- [`01_QA_Package/01_Master_QA_Test_Plan.md`](./01_QA_Package/01_Master_QA_Test_Plan.md) — Master QA strategy, architecture under test, 8-module scope, test methodology, and entry/exit criteria.
- [`01_QA_Package/02_Comprehensive_Test_Cases_Catalog.md`](./01_QA_Package/02_Comprehensive_Test_Cases_Catalog.md) — Structured catalog of **62 test cases** covering Functional, Integration, Security, Performance, JUnit 5, and UI Regression testing.
- [`01_QA_Package/test_cases_catalog.csv`](./01_QA_Package/test_cases_catalog.csv) — Spreadsheet-importable CSV version of all 62 test cases.
- [`01_QA_Package/03_Automated_Test_Suite_and_Execution_Results.md`](./01_QA_Package/03_Automated_Test_Suite_and_Execution_Results.md) — Complete execution results (`41/41` Live API E2E tests passed, `16/16` JUnit 5 tests passed, `838` Java files compiled, `2,054` frontend modules built).
- [`01_QA_Package/live_test_results.json`](./01_QA_Package/live_test_results.json) — Machine-readable JSON report of the live API test execution.
- [`01_QA_Package/04_Defect_and_Bug_Report_Log.md`](./01_QA_Package/04_Defect_and_Bug_Report_Log.md) — Root-cause analysis and verification of 7 resolved defects (`DEF-001` to `DEF-007`) and 3 architectural observations (`OBS-001` to `OBS-003`).
- [`01_QA_Package/05_Final_QA_Summary_Report.md`](./01_QA_Package/05_Final_QA_Summary_Report.md) — Executive QA sign-off report and clear separation of verified work vs. external-infrastructure scope.

---

## Deliverable 2: `02_Postman_Collection/` — Complete Importable Postman Collection (406 Endpoints + E2E Suite)
- [`02_Postman_Collection/ITAS_Tax_Audit_Complete_API.postman_collection.json`](./02_Postman_Collection/ITAS_Tax_Audit_Complete_API.postman_collection.json) — Importable Postman Collection v2.1 containing **all 42 REST Controllers (406 endpoints)** plus **Folder 00: 41-Step Automated End-to-End Test Suite** with `pm.test()` assertions.
- [`02_Postman_Collection/ITAS_Local_Environment.postman_environment.json`](./02_Postman_Collection/ITAS_Local_Environment.postman_environment.json) — Importable Postman Environment with pre-configured URLs, role credentials, JWT token chaining, and real database UUIDs.
- [`02_Postman_Collection/validate_and_execute_collection.py`](./02_Postman_Collection/validate_and_execute_collection.py) — Standalone Python generator, validator, and live test runner.
- [`02_Postman_Collection/postman_execution_report.json`](./02_Postman_Collection/postman_execution_report.json) — Live execution results (`41/41 PASSED`, `100.0%`, `135.8 ms` average latency).
- [`02_Postman_Collection/README_Postman_Collection_and_Execution_Report.md`](./02_Postman_Collection/README_Postman_Collection_and_Execution_Report.md) — Complete usage guide, variable reference, controller inventory, and execution report.

---

## Deliverable 3: `03_Database_Schema/` — Complete Database Schema, DDL, Migrations & ER Diagrams
- [`03_Database_Schema/01_Complete_Database_Architecture_and_Data_Dictionary.md`](./03_Database_Schema/01_Complete_Database_Architecture_and_Data_Dictionary.md) — Complete data dictionary introspected from the live PostgreSQL database (**124 tables**, **1,729 columns**, **127 PK columns**, **103 foreign keys**, **327 indexes**).
- [`03_Database_Schema/02_Entity_Relationship_Diagrams.md`](./03_Database_Schema/02_Entity_Relationship_Diagrams.md) — Master Enterprise ER Diagram + 6 Domain-Specific Mermaid `erDiagram` models.
- [`03_Database_Schema/03_Complete_Consolidated_Schema_DDL.sql`](./03_Database_Schema/03_Complete_Consolidated_Schema_DDL.sql) — Complete **6,315-line** executable PostgreSQL DDL script (`pg_dump --schema-only`) covering all 124 tables, constraints, and indexes.
- [`03_Database_Schema/04_Flyway_Migrations_Catalog_and_Lineage.md`](./03_Database_Schema/04_Flyway_Migrations_Catalog_and_Lineage.md) — Complete catalog of all 41 Flyway SQL migrations (`V0` to `V41`) and JPA `@Entity` mappings.

---

## Architecture, User Directory & Code Flow Deep Dive
- [`05_System_User_Directory_and_Login_Accounts.md`](./05_System_User_Directory_and_Login_Accounts.md) — Official User Directory & Login Credentials (**821 accounts** across System Admin, Quality Assurance Directorate, National Planning, Directors, Tax Center Managers, Committees, Team Leaders, and Auditors, including the Quick-Reference Credentials table).
- [`06_Spring_Boot_Layered_Architecture_and_Code_Flow_Deep_Dive.md`](./06_Spring_Boot_Layered_Architecture_and_Code_Flow_Deep_Dive.md) — Complete walkthrough of all 7 Spring Boot layers (`Security/Filters`, `Controllers/DTOs`, `Application Services/Use Cases`, `Domain Core/DDD`, `Persistence/JPA Repositories`, `External Engine Adapters`, and `PostgreSQL/Flyway Seeders`) with Mermaid diagrams and real project code traces.
- [`07_Backend_Login_and_Authentication_Code_Flow.md`](./07_Backend_Login_and_Authentication_Code_Flow.md) — Line-by-line backend code walkthrough of user login (`POST /api/v1/backoffice/auth/login`), BCrypt verification, 5-attempt lockout, forced password change, and signed HMAC-SHA256 JWT generation.
- [`08_Transfer_Pricing_Workspace_End_to_End_Deep_Dive.md`](./08_Transfer_Pricing_Workspace_End_to_End_Deep_Dive.md) — End-to-end technical, functional, and statutory reference for the **Transfer Pricing (TP) Audit Workspace** (`TpAuditorWorkspace.jsx`, `TpTeamLeaderWorkspace.jsx`, `TpCommitteeWorkspace.jsx`, 8 governance phase gates, 48 sub-steps, IQR & Revenue-at-Risk formulas, 54 REST API endpoints, and 15 PostgreSQL tables).
