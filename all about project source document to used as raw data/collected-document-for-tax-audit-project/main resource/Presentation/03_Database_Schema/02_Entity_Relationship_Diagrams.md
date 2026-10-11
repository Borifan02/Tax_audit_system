# ITAS Tax Audit System — Complete Entity-Relationship (ER) Diagrams

This document contains the complete Entity-Relationship (ER) diagrams for the Ethiopian Ministry of Revenues (MOR) **Integrated Tax Audit System (ITAS)** database (`itas_audit`, **124 tables**, **1,729 columns**, **103 foreign keys**, **327 indexes**).

---

## 1. Master Core Enterprise ER Diagram (Cross-Cluster Backbone)

```mermaid
erDiagram
    REGIONS ||--o{ TAX_CENTERS : "contains"
    ORGANIZATIONAL_UNITS ||--o{ ORGANIZATIONAL_UNITS : "parent_id"
    T_USER }o--|| ROLES : "assigned_role"
    ROLES ||--o{ ROLE_PERMISSIONS : "grants"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "included_in"
    T_USER ||--o{ USER_ORGANIZATIONAL_ASSIGNMENTS : "scoped_to"
    ORGANIZATIONAL_UNITS ||--o{ USER_ORGANIZATIONAL_ASSIGNMENTS : "hosts"

    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_PLAN_ALLOCATIONS : "distributes_to"
    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_REGIONAL_DEPLOYMENTS : "deploys_to_regions"
    AP_REGIONAL_DEPLOYMENTS ||--o{ AP_REGIONAL_TC_DEPLOYMENTS : "cascades_to_tax_centers"
    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_AUDIT_CASES : "generates"
    AP_PLAN_ALLOCATIONS ||--o{ AP_AUDIT_CASES : "allocates"

    AP_AUDIT_CASES ||--o{ CASE_ASSIGNMENTS : "assigned_via"
    AP_AUDIT_CASES ||--o{ CASE_HANDOFF : "handed_off_via"
    AP_AUDIT_CASES ||--o{ T_COMMITTEE_CASE : "governed_by_jac"
    AP_AUDIT_CASES ||--o{ CA_CASE_SNAPSHOTS : "ca_workspace"
    AP_AUDIT_CASES ||--o{ DA_CASE_SNAPSHOTS : "da_workspace"
    AP_AUDIT_CASES ||--o{ TP_RISK_ASSESSMENT : "tp_workspace"
    AP_AUDIT_CASES ||--o{ ISSUE_AUDIT_DETAILS : "issue_workspace"
    AP_AUDIT_CASES ||--o{ QA_REVIEW_CASE : "sampled_for_qa"

    QA_REVIEW_CASE ||--o{ QA_REVIEW_DIMENSION : "evaluated_on_7_dimensions"
    QA_REVIEW_CASE ||--o{ QA_DEFICIENCIES : "logs_deficiencies"
    QA_REVIEW_CASE ||--o| QA_REPORTS : "generates_report"
    QA_REVIEW_CASE ||--o{ QA_REVIEW_EVENT : "records_audit_trail"
```

---

## 2. Domain 1: Identity, RBAC, Security & Organizational Hierarchy

```mermaid
erDiagram
    REGIONS {
        uuid id PK
        varchar code UK
        varchar name
        boolean is_active
    }
    TAX_CENTERS {
        uuid id PK
        varchar code UK
        varchar name
        uuid region_id FK
        varchar center_type
    }
    ORGANIZATIONAL_UNITS {
        uuid id PK
        varchar code UK
        varchar name
        varchar unit_type
        uuid parent_id FK
    }
    T_USER {
        uuid user_id PK
        varchar username UK
        varchar email UK
        varchar full_name
        varchar user_type
        varchar audit_type
        varchar assigned_level
        varchar assigned_location
        varchar status
        varchar password_hash
        boolean must_change_password
        int failed_login_count
        timestamptz locked_until
    }
    ROLES {
        uuid id PK
        varchar code UK
        varchar name
        varchar description
    }
    PERMISSIONS {
        uuid id PK
        varchar code UK
        varchar module
        varchar description
    }
    ROLE_PERMISSIONS {
        uuid role_id PK,FK
        uuid permission_id PK,FK
    }
    USER_ORGANIZATIONAL_ASSIGNMENTS {
        uuid id PK
        uuid user_id FK
        uuid org_unit_id FK
        boolean is_primary
    }
    SECURITY_AUDIT_LOG {
        uuid id PK
        varchar event_type
        varchar actor_id
        varchar target_user
        varchar ip_address
        timestamptz occurred_at
    }

    REGIONS ||--o{ TAX_CENTERS : "region_id"
    ORGANIZATIONAL_UNITS ||--o{ ORGANIZATIONAL_UNITS : "parent_id"
    ROLES ||--o{ ROLE_PERMISSIONS : "role_id"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "permission_id"
    T_USER ||--o{ USER_ORGANIZATIONAL_ASSIGNMENTS : "user_id"
    ORGANIZATIONAL_UNITS ||--o{ USER_ORGANIZATIONAL_ASSIGNMENTS : "org_unit_id"
```

---

## 3. Domain 2: Annual Audit Planning & Regional/Tax-Center Cascade (`ap_*`)

```mermaid
erDiagram
    AP_ANNUAL_AUDIT_PLANS {
        uuid id PK
        int plan_year UK
        varchar title
        varchar status
        int total_target_audits
        bigint estimated_revenue
        jsonb distribution_data
        timestamptz created_at
    }
    AP_PLAN_ALLOCATIONS {
        uuid id PK
        uuid plan_id FK
        varchar region_code
        varchar tax_center_code
        varchar audit_type
        int allocated_count
        bigint target_revenue
    }
    AP_DIRECTOR_APPROVALS {
        uuid id PK
        uuid plan_id FK
        varchar director_id
        varchar decision
        text comments
        timestamptz decided_at
    }
    AP_REGIONAL_DEPLOYMENTS {
        uuid id PK
        uuid plan_id FK
        varchar region_code
        varchar status
        int total_allocated
        timestamptz deployed_at
    }
    AP_REGIONAL_TC_DEPLOYMENTS {
        uuid id PK
        uuid regional_deployment_id FK
        uuid plan_id FK
        varchar tax_center_code
        int allocated_cases
        varchar status
    }
    AP_REGIONAL_FEEDBACK {
        uuid id PK
        uuid plan_id FK
        varchar region_code
        varchar tax_center_code
        text feedback_notes
        varchar status
    }
    AP_PLAN_REVISIONS {
        uuid id PK
        uuid plan_id FK
        int revision_number
        varchar changed_by
        jsonb snapshot_before
        jsonb snapshot_after
    }

    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_PLAN_ALLOCATIONS : "plan_id"
    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_DIRECTOR_APPROVALS : "plan_id"
    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_REGIONAL_DEPLOYMENTS : "plan_id"
    AP_REGIONAL_DEPLOYMENTS ||--o{ AP_REGIONAL_TC_DEPLOYMENTS : "regional_deployment_id"
    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_REGIONAL_FEEDBACK : "plan_id"
    AP_ANNUAL_AUDIT_PLANS ||--o{ AP_PLAN_REVISIONS : "plan_id"
```

---

## 4. Domain 3: Case Management, Joint Audit Committee (JAC) & Handoff

```mermaid
erDiagram
    AP_AUDIT_CASES {
        uuid id PK
        uuid plan_id FK
        uuid allocation_id FK
        varchar case_number UK
        varchar taxpayer_id
        varchar taxpayer_name
        varchar tin
        varchar tax_center_code
        varchar region_code
        varchar audit_type
        int risk_score
        varchar risk_priority
        bigint estimated_revenue
        varchar status
        varchar assigned_team_leader_id
        varchar assigned_auditor_id
        uuid committee_id
    }
    T_COMMITTEE_CASE {
        uuid id PK
        varchar case_number UK
        varchar taxpayer_name
        varchar tin
        varchar tax_center
        varchar status
        uuid assigned_team_id FK
    }
    T_COMMITTEE_SESSION {
        uuid id PK
        varchar session_code UK
        varchar title
        varchar tax_center
        varchar status
        timestamptz scheduled_at
    }
    T_COMMITTEE_VOTE {
        uuid id PK
        uuid case_id FK
        uuid session_id FK
        varchar member_id
        varchar decision
        text rationale
    }
    T_AUDITOR_NOMINATION {
        uuid id PK
        uuid case_id FK
        uuid auditor_id FK
        varchar role_in_team
        varchar status
    }
    T_HANDOFF_RECORD {
        uuid id PK
        uuid case_id FK
        varchar team_leader_id
        varchar lead_auditor_id
        varchar status
        timestamptz handoff_date
    }
    T_RESEARCH_NOTE {
        uuid id PK
        uuid case_id FK
        varchar author_id
        varchar title
        text content
    }

    AP_AUDIT_CASES ||--o| T_COMMITTEE_CASE : "case_number"
    T_COMMITTEE_CASE ||--o{ T_COMMITTEE_VOTE : "case_id"
    T_COMMITTEE_SESSION ||--o{ T_COMMITTEE_VOTE : "session_id"
    T_COMMITTEE_CASE ||--o{ T_AUDITOR_NOMINATION : "case_id"
    T_COMMITTEE_CASE ||--o{ T_HANDOFF_RECORD : "case_id"
    T_COMMITTEE_CASE ||--o{ T_RESEARCH_NOTE : "case_id"
```

---

## 5. Domain 4: Comprehensive Audit (`ca_*`) & Desk Audit (`da_*`) Execution

```mermaid
erDiagram
    AP_AUDIT_CASES ||--o{ CA_ENTRY_CONFERENCES : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_CAAT_ELIGIBILITY : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_CAAT_RUNS : "audit_case_id"
    CA_CAAT_RUNS ||--o{ CA_CAAT_EXCEPTIONS : "caat_run_id"
    AP_AUDIT_CASES ||--o{ CA_BENFORD_ANALYSIS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_RECONCILIATIONS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_SAMPLING_RECORDS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_AUDIT_FINDINGS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_WORKING_PAPERS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_QUERY_SHEETS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_DRAFT_REPORTS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_EXIT_CONFERENCES : "audit_case_id"
    AP_AUDIT_CASES ||--o{ CA_ASSESSMENT_NOTICES : "audit_case_id"
    AP_AUDIT_CASES ||--o| CA_CASE_SNAPSHOTS : "case_id"

    AP_AUDIT_CASES ||--o{ DA_AUDIT_PROCEDURES : "audit_case_id"
    AP_AUDIT_CASES ||--o{ DA_EVIDENCE : "audit_case_id"
    AP_AUDIT_CASES ||--o{ DA_FINDINGS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ DA_WORKING_PAPERS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ DA_QUERIES : "audit_case_id"
    AP_AUDIT_CASES ||--o{ DA_DRAFT_REPORTS : "audit_case_id"
    AP_AUDIT_CASES ||--o| DA_CASE_SNAPSHOTS : "case_id"
```

---

## 6. Domain 5: Transfer Pricing (`tp_*`) & Issue Audit (`issue_*`) Execution

```mermaid
erDiagram
    AP_AUDIT_CASES ||--o{ TP_PHASE_GATES : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_RISK_ASSESSMENT : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_WORKING_HYPOTHESIS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_PLANNING_MEETING : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_AUDIT_PLAN : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_FIELD_WORK_DATA : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_INFORMATION_REQUEST_LOG : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_EXTERNAL_PRICE_MATCH : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_COMPETITOR_PRICE_UPLOADS : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_ANALYSIS_DATA : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_EXIT_CONFERENCE : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_AUDIT_REPORT : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_AUDIT_NOTICE : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_OBJECTION : "audit_case_id"
    AP_AUDIT_CASES ||--o{ TP_AUDIT_ACTION_HISTORY : "audit_case_id"
    AP_AUDIT_CASES ||--o| ISSUE_AUDIT_DETAILS : "audit_case_id"
```

---

## 7. Domain 6: Audit Quality Assurance & ISO-19011 Review (`qa_*`)

```mermaid
erDiagram
    QA_SAMPLING_RULE {
        uuid id PK
        varchar rule_code UK
        varchar rule_name
        varchar strategy
        int sample_percentage
        boolean is_active
    }
    QA_SAMPLING_RUN {
        uuid id PK
        varchar run_code UK
        uuid rule_id FK
        int pool_size
        int sampled_count
        timestamptz executed_at
    }
    QA_REVIEW_CASE {
        uuid id PK
        varchar case_number UK
        uuid audit_case_id FK
        varchar audit_case_number
        varchar audit_type
        varchar taxpayer_name
        varchar trade_name
        varchar tin
        varchar tax_period
        numeric total_tax_assessment
        varchar lead_auditor
        varchar audit_team_leader
        varchar selection_reason
        varchar assigned_qa_officer
        varchar qa_team_leader
        varchar status
        int overall_score
        varchar rating
        text audit_team_response_notes
        text qa_team_leader_comment
        text director_executive_comment
        varchar director_statutory_order
    }
    QA_REVIEW_DIMENSION {
        uuid id PK
        uuid qa_review_case_id FK
        varchar dimension_code
        varchar category
        varchar title
        varchar standards_reference
        int weight
        int score
        varchar status
        text reviewer_notes
        jsonb checkpoints
    }
    QA_DEFICIENCIES {
        uuid id PK
        uuid qa_case_id FK
        varchar dimension_id
        varchar dimension_title
        varchar severity
        varchar title
        text finding_description
        varchar statutory_breach
        text corrective_action_mandate
        varchar status
    }
    QA_REPORTS {
        uuid id PK
        uuid qa_case_id FK
        varchar generated_date
        text executive_summary
        varchar overall_rating
        int total_weighted_score
        int critical_deficiencies_count
        int major_deficiencies_count
        text key_strengths
        text systemic_vulnerabilities
        text recommendations_for_director
        text mandatory_corrective_actions
    }
    QA_EXIT_CONFERENCES {
        uuid id PK
        uuid qa_case_id FK
        date conference_date
        text minutes_summary
        boolean audit_team_concurrence
    }
    QA_FOLLOW_UPS {
        uuid id PK
        uuid qa_case_id FK
        varchar action_status
        text verification_notes
        date follow_up_date
    }
    QA_REVIEW_EVENT {
        uuid id PK
        uuid qa_review_case_id FK
        varchar step_code
        varchar event_type
        varchar from_status
        varchar to_status
        varchar actor_id
        varchar actor_name
        varchar actor_role
        text notes
        timestamptz occurred_at
    }

    QA_SAMPLING_RULE ||--o{ QA_SAMPLING_RUN : "rule_id"
    AP_AUDIT_CASES ||--o{ QA_REVIEW_CASE : "audit_case_id"
    QA_REVIEW_CASE ||--o{ QA_REVIEW_DIMENSION : "qa_review_case_id"
    QA_REVIEW_CASE ||--o{ QA_DEFICIENCIES : "qa_case_id"
    QA_REVIEW_CASE ||--o| QA_REPORTS : "qa_case_id"
    QA_REVIEW_CASE ||--o{ QA_EXIT_CONFERENCES : "qa_case_id"
    QA_REVIEW_CASE ||--o{ QA_FOLLOW_UPS : "qa_case_id"
    QA_REVIEW_CASE ||--o{ QA_REVIEW_EVENT : "qa_review_case_id"
```
