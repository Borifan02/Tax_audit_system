# Master Presentation Guide: End-to-End Annual Planning (AP) Lifecycle

**Audience**: Executive Leadership, Project Sponsors, Audit Directors, Enterprise Architects, and Technical Reviewers  
**Subject**: End-to-End Annual Tax Audit Planning, Risk Allocation, Multi-Tier Approval, and Case Cascading System  
**Document Classification**: Comprehensive Presentation Master & Live Demonstration Runbook  

---

## 1. Executive Summary & Strategic Business Context

Under the **Federal Tax Administration Proclamation No. 979/2016** and the **Ministry of Revenue (MoR) Audit Manual**, tax audit resources must be deployed systematically to maximize compliance yield, deter non-compliance, and enforce uniform tax laws across Ethiopia.

Historically, annual audit planning was conducted using fragmented spreadsheets, disconnected regional memos, and subjective case selection. The **ITAS Annual Planning Sub-System** transforms this process into an automated, risk-stratified, multi-tier governed enterprise workflow:

1. **Top-Down Risk Engine Intelligence**: Feeds empirical risk scores and recommended audit distributions across 7 regions.
2. **Four-Tier Approval & Feedback Gatekeeping**: Seamlessly unites the **Planning Team**, **Audit Director**, **Regional Coordinators**, and **Branch Tax Center Managers**.
3. **Automated Plan-to-Case Cascade Engine**: Converts abstract annual quota numbers directly into individual, court-admissible audit case records populated with real registered taxpayers.
4. **Targeted Notification Routing**: Real-time alerts dispatch across role boundaries, ensuring zero delays in hand-offs.
5. **Zero Mock Data**: 100% backed by live PostgreSQL tables with full ACID compliance and non-repudiable audit logs.

---

## 2. The 4-Level Statutory Governance Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │      LEVEL 1: PLANNING OFFICER / TEAM         │
                    │   • Pre-fill Risk Engine Estimates            │
                    │   • Formulate Multi-Region Target Quotas      │
                    │   • Submit Plan Draft to Director             │
                    └───────────────────────┬───────────────────────┘
                                            │ POST /submit-to-director
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      LEVEL 2: DIRECTOR OF TAX AUDIT           │
                    │   • Review National Compliance Target         │
                    │   • Executive Decision (Approve / Amend)      │
                    │   • Distribute Quotas to Regional Bureaus     │
                    └───────────────────────┬───────────────────────┘
                                            │ POST /submit-to-regional
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      LEVEL 3: REGIONAL COORDINATORS           │
                    │   • Receive Regional Ceiling Quotas           │
                    │   • Sub-Allocate Quotas to Branch Tax Centers │
                    │   • Aggregate Branch Feedback                 │
                    └───────────────────────┬───────────────────────┘
                                            │ POST /divide-allocations
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      LEVEL 4: TAX CENTER MANAGERS             │
                    │   • Review Staffing Capacity                  │
                    │   • Submit Quota Adjustments / Justifications │
                    │   • Lock Branch Allocation                    │
                    └───────────────────────┬───────────────────────┘
                                            │ POST /finalize & /cascade-to-cases
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      EXECUTION: AUDIT CASES GENERATED         │
                    │   • Taxpayers selected by Risk Stratification │
                    │   • Team Leaders pre-assigned by Audit Type   │
                    │   • Lead Auditors assigned & work commences   │
                    └───────────────────────────────────────────────┘
```

---

## 3. End-to-End 360-Degree Traceability Matrix

This table is the core reference for presenting how business intent, user actions, backend APIs, database mutations, and alerts connect seamlessly:

| Step | Business Milestone | Actor | UI Screen & Trigger | Backend Endpoint & Method | PostgreSQL Tables Mutated | Target Notification Sent |
|---|---|---|---|---|---|---|
| **1** | **Risk Recommendation** | Planning Team | Planning Dashboard $\rightarrow$ Click *"Pre-Fill Risk Quotas"* | `GET /api/v1/backoffice/ap/plans/workflow/pre-filled-data` | Reads `RiskEnginePort` & regional risk tables | — |
| **2** | **Plan Creation** | Planning Team | Create Plan Modal $\rightarrow$ Click *"Create & Initialize Plan"* | `POST /api/v1/backoffice/ap/plans/workflow`<br>`PlanWorkflowController.createPlan()` | `ap_annual_audit_plans`<br>`ap_plan_allocations`<br>`ap_plan_audit_logs` | — |
| **3** | **Submit to Director** | Planning Team | Planning Console $\rightarrow$ Click *"Submit to Director"* | `POST /plans/workflow/{id}/submit-to-director`<br>`PlanManagementUseCase.submitToDirector()` | `ap_annual_audit_plans`<br>(status = `'SUBMITTED_TO_DIRECTOR'`) | To `u-dir-audit`:<br>`Annual Audit Plan Submitted` |
| **4** | **Director Approval** | Director of Audit | Director Dashboard $\rightarrow$ Click *"Approve Annual Plan"* | `POST /plans/workflow/{id}/approve-by-director`<br>`PlanManagementUseCase.approveByDirector()` | `ap_annual_audit_plans`<br>`ap_director_approvals`<br>(status = `'DIRECTOR_APPROVED'`) | To `u-pt-01`:<br>`Annual Audit Plan Approved` |
| **4b**| **Amendment Request** | Director of Audit | Director Dashboard $\rightarrow$ Click *"Request Amendments"* | `POST /plans/{id}/request-amendment`<br>`PlanAmendmentController.requestAmendment()` | `ap_annual_audit_plans`<br>`ap_plan_revisions`<br>(status = `'AMENDMENT_REQUESTED'`) | To `u-pt-01`:<br>`Plan Amendment Requested` |
| **5** | **Regional Distribution**| Director of Audit | Director Distribution $\rightarrow$ Click *"Distribute to Regions"*| `POST /plans/workflow/{id}/submit-to-regional`<br>`PlanManagementUseCase.submitToRegional()` | `ap_annual_audit_plans`<br>`ap_regional_deployments`<br>(status = `'DISTRIBUTED_TO_REGIONS'`) | To all 7 Regional Coordinators (`u-rc-...`) |
| **6** | **Tax Center Breakdown** | Regional Coordinator | Regional Console $\rightarrow$ Click *"Submit Sub-Allocations"* | `POST /plans/workflow/{id}/divide-allocations`<br>`PlanManagementUseCase.divideAllocations()` | `ap_plan_allocations`<br>(sets `tax_center_code` & quotas) | To Tax Center Managers (`u-mgr-...`) |
| **7** | **Branch Feedback** | Tax Center Manager | Branch Console $\rightarrow$ Click *"Submit Capacity Feedback"* | `PATCH /plans/workflow/{id}/allocations/{tc}/feedback`<br>`PlanManagementUseCase.submitFeedback()` | `ap_plan_allocations`<br>`ap_regional_feedback` | To `u-pt-01` & `u-rc-...`:<br>`Tax Center Feedback Recorded` |
| **8** | **Finalize & Cascade** | Director / Planning | Finalization Console $\rightarrow$ Click *"Cascade to Cases"* | `POST /api/v1/backoffice/ap/plans/{id}/cascade-to-cases`<br>`CascadePlanToCasesUseCase.cascade()` | `ap_annual_audit_plans`<br>`ap_audit_cases`<br>(inserts 3,500 real case rows) | To all Team Leaders:<br>`New Audit Cases Assigned` |
| **9** | **Auditor Assignment** | Team Leader | Team Leader Console $\rightarrow$ Click *"Assign Lead Auditor"* | `POST /api/v1/backoffice/ap/cases/{id}/assign-auditor`<br>`CaseManagementController.assignAuditor()` | `ap_audit_cases`<br>`case_assignments`<br>(status = `'ASSIGNED'`) | To assigned Auditor (`u-aud-...`):<br>`Case Assigned for Audit` |

---

## 4. Live Presentation Runbook & Speaker Script

Use this 6-part agenda to deliver an engaging, authoritative demonstration of the Annual Planning system to stakeholders:

### Slide 1: Introduction & Policy Mandate
- **Speaker Script**:  
  *"Good morning. Today we present the end-to-end Annual Tax Audit Planning system of the Ethiopian Ministry of Revenue. Audit planning is where tax compliance begins: determining which sectors, which regions, and which taxpayers will undergo audit scrutiny in the upcoming fiscal year. Our solution delivers an automated, transparent, and auditable pipeline that transitions seamlessly from macro-economic risk estimation to active auditor workbenches."*

### Slide 2: Top-Down Risk Ingestion (Level 1)
- **Live Demo Action**:
  1. Open browser to `/ap/planning`.
  2. Show the Risk Engine summary card showing 3,500 recommended national audits.
  3. Click **"Pre-Fill Risk Quotas"**: Show how suggested numbers instantly populate across the 7 regions (`FED: 600`, `AA: 700`, `BA: 500`, etc.).
- **Speaker Point**:  
  *"Notice that planning is not guesswork. The system queries our National Risk Engine, pulling risk-stratified quotas tailored to historical tax performance and compliance risk profiles."*

### Slide 3: Collaborative Multi-Tier Governance (Levels 2, 3, & 4)
- **Live Demo Action**:
  1. Click **"Submit to Director"**; note the instant transition of the plan badge to `SUBMITTED_TO_DIRECTOR`.
  2. Switch persona to Director (`/ap/director`).
  3. Point out the newly received notification in the top bar: *"Annual Audit Plan Submitted: FY 2026"*.
  4. Open the approval dialog, enter the executive justification, and click **"Approve Annual Plan"**.
  5. Demonstrate the distribution flow down to Regional Bureaus and Branch Tax Centers.
- **Speaker Point**:  
  *"The system enforces constitutional and statutory segregation of duties. No single individual can unilaterally force an audit plan. Every milestone requires formal sign-off, recorded in immutable audit logs."*

### Slide 4: The Core Engine — Automated Plan-to-Case Cascade
- **Live Demo Action**:
  1. Navigate to the Finalization view and trigger **"Cascade Plan to Cases"**.
  2. Switch to PostgreSQL terminal or query console and execute:
     ```sql
     SELECT audit_type, COUNT(*) FROM ap_audit_cases WHERE plan_id = '...' GROUP BY audit_type;
     ```
  3. Show the resulting 3,500 cases created with real TINs, legal names, risk scores, and assigned Team Leaders.
- **Speaker Point**:  
  *"This is the technological heart of the system. Rather than having branch managers manually re-type quotas, our Cascade Engine automatically retrieves qualified taxpayers matching risk profiles and generates court-admissible audit cases, with pre-assigned Team Leaders."*

### Slide 5: Case Assignment & Hand-off to Execution
- **Live Demo Action**:
  1. Open Team Leader Console (`/ap/team-leader`).
  2. Show the unassigned case list for Tax Center `TC-AA-03`.
  3. Select a high-risk Transfer Pricing case (`Imperial Trade Ltd`).
  4. Assign Lead Auditor `u-aud-01` and click **"Assign Auditor"**.
  5. Log in as Auditor `u-aud-01` (`/ap/auditor`): Show the real-time notification *"Case Assigned for Audit"* and open the case directly in the workspace.
- **Speaker Point**:  
  *"Within seconds, the strategic mandate formulated at the Ministry level has materialized as an active case file on an auditor's screen with complete regulatory backing."*

### Slide 6: Technical Rigor & Enterprise Quality
- **Speaker Point**:  
  *"Under the hood, this is powered by Java 21, Spring Boot 3.3, and PostgreSQL 15. All transactions are atomic. Optimistic locking prevents race conditions. Notifications are routed directly to specific user IDs in PostgreSQL. Zero mock data exists—every number you see is stored in the database."*

---

## 5. Frequently Asked Questions (Anticipated Stakeholder Q&A)

**Q1: What happens if a branch tax center cannot meet its allocated quota due to staff shortages?**  
*Answer*: The system provides a formal feedback loop at Level 4. The Tax Center Manager submits an adjustment request with justifications via `PATCH /allocations/{tc}/feedback`. The Regional Coordinator reviews the request and re-balances quotas to other branches within the region, or requests an amendment from the Director.

**Q2: Can someone tamper with the plan allocations after the Director has approved?**  
*Answer*: No. Once the plan transitions to `DIRECTOR_APPROVED` or `FINALIZED`, the database and use case layer enforce state-machine locks. Any modification requires an official `PlanAmendment` round, which increments the version counter and records the actor ID in `ap_plan_revisions` and `ap_plan_audit_logs`.

**Q3: How are sensitive cases (e.g. Joint Audits or Transfer Pricing) handled during cascading?**  
*Answer*: The `CascadePlanToCasesUseCase` recognizes `TRANSFER_PRICING` and `JOINT_AUDIT` as statutory committee cases. Rather than assigning them to standard team leaders, it sets `is_committee_case = true` and routes them directly to the Review Committee Secretary and Process Owner for high-level oversight.

