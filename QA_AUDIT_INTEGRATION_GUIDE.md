# Quality Assurance (QA) End-to-End Workflow & Test Guide

This guide details exactly how information exchanges between the Frontend (React/Vite) and the Backend (Spring Boot/PostgreSQL), and provides a step-by-step tutorial on how a QA Officer, QA Team Leader, and QA Director execute a full Quality Assurance review based on SOR Module D.

## Information Exchange Architecture

1. **Frontend (UI)**: React components in `src/features/qa/` collect user input. When a user clicks a button (e.g., "Submit Deficiency"), the component calls a function in `src/features/qa/services/api.ts`.
2. **Axios Transport**: `api.ts` translates the JavaScript object into a JSON payload and makes an HTTP POST/PUT/GET request to the Spring Boot backend (`http://localhost:8080/api/v1/backoffice/qa/cases/...`).
3. **Backend Controller**: `QaController.java` intercepts the request, validates the JSON against DTOs (`QaDeficiencyRequest`, `QaWorkflowRequest`, etc.), and checks security roles (`@PreAuthorize`).
4. **Service Layer**: `QaReviewService.java` applies business logic (e.g., triggering a disciplinary alert if a deficiency is CRITICAL, or auto-closing a deficiency if a follow-up is APPROVED).
5. **Database Persistence**: Hibernate translates the Java Entities into SQL queries, permanently saving the state to PostgreSQL (`qa_review_cases`, `qa_deficiencies`, `qa_reports`, etc.).

---

## Step-by-Step E2E Testing Guide

### Phase 1: QA Officer Review & Deficiencies
**Role:** QA Officer (`usr-qa-01` / `qa.officer1`)
**Goal:** Review an audit case, identify mistakes, and log deficiencies.

1. **Log in to the Frontend**: Go to `http://localhost:3000` and use `qa.officer1` (or `qa_officer`) at the mock login screen.
2. **Select a Case**: Click on any assigned QA Case from the dashboard.
   - *Backend Action*: Frontend sends `GET /api/v1/backoffice/qa/cases/{caseId}`.
3. **Add a Deficiency**: Navigate to the **Deficiencies** tab and add a new finding. Make sure to select **CRITICAL** severity for one of them to test the disciplinary trigger.
   - *Backend Action*: Frontend sends `POST /api/v1/backoffice/qa/cases/{caseId}/deficiencies` with a JSON payload containing dimension, severity, and corrective action.
   - *Database Impact*: A new row is inserted into the `qa_deficiencies` table. Because it is CRITICAL, the backend logs a warning to alert HR.
4. **Submit for Team Leader Review**: Click the "Submit to Team Leader" button.
   - *Backend Action*: Frontend sends `POST /api/v1/backoffice/qa/cases/{caseId}/workflow` with `{"action": "SUBMIT_FOR_REVIEW"}`.
   - *Database Impact*: The `qa_review_cases.status` updates to `PENDING_TL_REVIEW`.

### Phase 2: QA Team Leader Endorsement & Feedback
**Role:** QA Team Leader (`usr-qa-tl` / `qa.tl1`)
**Goal:** Review the QA Officer's work and approve or return it.

1. **Log in to the Frontend**: Log out and log back in as `qa.tl1` (or `qa_team_leader`).
2. **Review Case**: Open the case that was just submitted by the QA Officer.
3. **Endorse the Review**: After verifying the deficiencies, click "Endorse".
   - *Backend Action*: Frontend sends `POST /api/v1/backoffice/qa/cases/{caseId}/workflow` with `{"action": "ENDORSE"}`.
   - *Database Impact*: The `qa_review_cases.status` updates to `PASSED_COMPLIANT`.

### Phase 3: Exit Conference & Auditor Disagreement
**Role:** QA Officer (`usr-qa-01` / `qa.officer1`)
**Goal:** Meet with the original auditor to discuss the deficiencies.

1. **Log back in** as `qa.officer1`.
2. **Schedule/Record Exit Conference**: In the UI (or via Swagger), record the exit conference minutes.
   - *Backend Action*: Send `POST /api/v1/backoffice/qa/cases/{caseId}/exit-conference` with scheduled date, minutes, and auditor comments.
   - *Database Impact*: A new row is inserted into `qa_exit_conferences`. If `resolvedFlag` is false, it means the auditor disagrees with the findings.

### Phase 4: Follow-up & Corrective Action
**Role:** QA Team Leader / QA Officer
**Goal:** Ensure the original auditor actually fixed the mistakes.

1. **Submit Follow-Up Proof**: The auditor provides proof they fixed the file. 
   - *Backend Action*: Send `POST /api/v1/backoffice/qa/cases/{caseId}/follow-up` with `{"status": "APPROVED", "deficiencyId": "..."}`.
   - *Database Impact*: The `qa_follow_ups` table is updated. Crucially, `QaReviewService` intercepts the "APPROVED" status and automatically updates the `qa_deficiencies` table to mark that specific deficiency as `"CLOSED"`.

### Phase 5: Final QA Report Generation
**Role:** QA Officer or QA Team Leader / Director (`qa.director`)
**Goal:** Generate the final executive report for the Director.

1. **Generate Report**: Click "Generate Final Report".
   - *Backend Action*: Frontend sends `POST /api/v1/backoffice/qa/cases/{caseId}/report` containing the executive summary, total score, and systemic vulnerabilities identified.
   - *Database Impact*: A permanent record is stored in `qa_reports`. This is the final artifact of the QA process (FR-04.9.2-10).

---

## Verifying in PostgreSQL
To verify database state after executing the workflow:

```sql
-- Check the workflow status
SELECT id, case_number, status FROM qa_review_cases;

-- Check that deficiencies were saved
SELECT id, severity, finding_description, status FROM qa_deficiencies;

-- Check that the Exit Conference was recorded
SELECT * FROM qa_exit_conferences;

-- Check that the Final Report exists
SELECT * FROM qa_reports;
```
