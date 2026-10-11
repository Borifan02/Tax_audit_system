# ITAS Tax Audit System — Complete Database Architecture & Data Dictionary

## 1. Executive Database Architecture Overview

- **Database Engine**: PostgreSQL 16 (`org.postgresql.Driver` / `PostgreSQLDialect`)
- **Database Name**: `itas_audit` (`schema: public`)
- **Total Verified Tables**: **124 Base Tables**
- **Total Columns**: **1729 Columns**
- **Total Primary Key Columns**: **127**
- **Total Foreign Key Constraints**: **103**
- **Total Indexes**: **327**
- **Schema Management**: Flyway Versioned SQL Migrations (`V0__shared_infrastructure.sql` through `V41__ca_case_snapshots.sql`) + JPA/Hibernate Entity Validation

## 2. Summary of Database Domains

| Domain | Table Count | Key Tables |
| :--- | :---: | :--- |
| **01. Annual Audit Planning & Case Registry (ap_*)** | 12 | `ap_annual_audit_plans`, `ap_audit_cases`, `ap_director_approvals`, `ap_plan_allocations`, `ap_plan_audit_logs`, ... (+7 more) |
| **02. Comprehensive Audit & CAAT Engine (ca_*)** | 24 | `ca_approval_steps`, `ca_assessment_notices`, `ca_audit_assertions`, `ca_audit_findings`, `ca_balance_sheet_items`, ... (+19 more) |
| **03. Desk Audit Execution (da_*)** | 7 | `da_audit_procedures`, `da_case_snapshots`, `da_draft_reports`, `da_evidence`, `da_findings`, ... (+2 more) |
| **04. Transfer Pricing & Issue Audit Execution (tp_*, issue_*)** | 17 | `issue_audit_details`, `tp_analysis_data`, `tp_audit_action_history`, `tp_audit_notice`, `tp_audit_plan`, ... (+12 more) |
| **05. Audit Quality Assurance & ISO-19011 Review (qa_*)** | 13 | `qa_action_plans`, `qa_deficiencies`, `qa_exit_conferences`, `qa_follow_up_action`, `qa_follow_ups`, ... (+8 more) |
| **06. Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff)** | 29 | `case_assignments`, `case_auditor_assignment`, `case_handoff`, `committees`, `t_advisory_voting`, ... (+24 more) |
| **07. Identity, RBAC, Security & Organizational Hierarchy** | 10 | `audit_types`, `organizational_units`, `permissions`, `regions`, `role_permissions`, ... (+5 more) |
| **08. Workflow Engine, Notifications, SLA & Shared Infrastructure** | 12 | `flyway_schema_history`, `notifications`, `shared_audit_trail_entries`, `shared_outbox_entries`, `sla_tracking`, ... (+7 more) |

---

## 3. Master Table Inventory (All 124 Tables)

| # | Table Name | Domain | Columns | Primary Key(s) | Foreign Keys | Indexes |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| 1 | `ap_annual_audit_plans` | Annual Audit Planning & Case Registry (ap_*) | 28 | `id` | 0 | 7 |
| 2 | `ap_audit_cases` | Annual Audit Planning & Case Registry (ap_*) | 43 | `id` | 0 | 15 |
| 3 | `ap_director_approvals` | Annual Audit Planning & Case Registry (ap_*) | 9 | `id` | 0 | 6 |
| 4 | `ap_plan_allocations` | Annual Audit Planning & Case Registry (ap_*) | 19 | `id` | 1 | 10 |
| 5 | `ap_plan_audit_logs` | Annual Audit Planning & Case Registry (ap_*) | 8 | `id` | 1 | 4 |
| 6 | `ap_plan_revisions` | Annual Audit Planning & Case Registry (ap_*) | 6 | `id` | 0 | 2 |
| 7 | `ap_plan_timeline` | Annual Audit Planning & Case Registry (ap_*) | 7 | `id` | 0 | 2 |
| 8 | `ap_planning_configuration` | Annual Audit Planning & Case Registry (ap_*) | 5 | `id` | 0 | 2 |
| 9 | `ap_regional_deployments` | Annual Audit Planning & Case Registry (ap_*) | 18 | `id` | 1 | 9 |
| 10 | `ap_regional_feedback` | Annual Audit Planning & Case Registry (ap_*) | 11 | `id` | 0 | 4 |
| 11 | `ap_regional_plan_access` | Annual Audit Planning & Case Registry (ap_*) | 7 | `id` | 0 | 6 |
| 12 | `ap_regional_tc_deployments` | Annual Audit Planning & Case Registry (ap_*) | 6 | `id` | 1 | 6 |
| 13 | `audit_types` | Identity, RBAC, Security & Organizational Hierarchy | 7 | `id` | 0 | 3 |
| 14 | `ca_approval_steps` | Comprehensive Audit & CAAT Engine (ca_*) | 11 | `id` | 1 | 1 |
| 15 | `ca_assessment_notices` | Comprehensive Audit & CAAT Engine (ca_*) | 28 | `id` | 1 | 2 |
| 16 | `ca_audit_assertions` | Comprehensive Audit & CAAT Engine (ca_*) | 13 | `id` | 1 | 1 |
| 17 | `ca_audit_findings` | Comprehensive Audit & CAAT Engine (ca_*) | 29 | `id` | 1 | 2 |
| 18 | `ca_balance_sheet_items` | Comprehensive Audit & CAAT Engine (ca_*) | 13 | `id` | 1 | 1 |
| 19 | `ca_benchmark_analyses` | Comprehensive Audit & CAAT Engine (ca_*) | 13 | `id` | 1 | 1 |
| 20 | `ca_benford_analysis` | Comprehensive Audit & CAAT Engine (ca_*) | 10 | `id` | 2 | 1 |
| 21 | `ca_caat_eligibility` | Comprehensive Audit & CAAT Engine (ca_*) | 16 | `id` | 1 | 1 |
| 22 | `ca_caat_exceptions` | Comprehensive Audit & CAAT Engine (ca_*) | 19 | `id` | 2 | 1 |
| 23 | `ca_caat_rules` | Comprehensive Audit & CAAT Engine (ca_*) | 14 | `id` | 1 | 1 |
| 24 | `ca_caat_runs` | Comprehensive Audit & CAAT Engine (ca_*) | 16 | `id` | 1 | 1 |
| 25 | `ca_case_snapshots` | Comprehensive Audit & CAAT Engine (ca_*) | 4 | `id` | 1 | 3 |
| 26 | `ca_document_requests` | Comprehensive Audit & CAAT Engine (ca_*) | 10 | `id` | 1 | 1 |
| 27 | `ca_draft_reports` | Comprehensive Audit & CAAT Engine (ca_*) | 30 | `id` | 1 | 2 |
| 28 | `ca_entry_conferences` | Comprehensive Audit & CAAT Engine (ca_*) | 18 | `id` | 1 | 1 |
| 29 | `ca_execution_reports` | Comprehensive Audit & CAAT Engine (ca_*) | 9 | `id` | 1 | 1 |
| 30 | `ca_exit_conferences` | Comprehensive Audit & CAAT Engine (ca_*) | 16 | `id` | 1 | 1 |
| 31 | `ca_multi_zone_allocations` | Comprehensive Audit & CAAT Engine (ca_*) | 11 | `id` | 2 | 1 |
| 32 | `ca_query_sheets` | Comprehensive Audit & CAAT Engine (ca_*) | 11 | `id` | 1 | 1 |
| 33 | `ca_reconciliations` | Comprehensive Audit & CAAT Engine (ca_*) | 17 | `id` | 1 | 1 |
| 34 | `ca_sampling_records` | Comprehensive Audit & CAAT Engine (ca_*) | 13 | `id` | 1 | 1 |
| 35 | `ca_taxpayer_responses` | Comprehensive Audit & CAAT Engine (ca_*) | 14 | `id` | 3 | 1 |
| 36 | `ca_third_party_matches` | Comprehensive Audit & CAAT Engine (ca_*) | 12 | `id` | 1 | 1 |
| 37 | `ca_working_papers` | Comprehensive Audit & CAAT Engine (ca_*) | 15 | `id` | 1 | 1 |
| 38 | `case_assignments` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 16 | `id` | 1 | 3 |
| 39 | `case_auditor_assignment` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 9 | `id` | 3 | 5 |
| 40 | `case_handoff` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 12 | `id` | 3 | 6 |
| 41 | `committees` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 7 | `id` | 2 | 4 |
| 42 | `da_audit_procedures` | Desk Audit Execution (da_*) | 10 | `id` | 1 | 1 |
| 43 | `da_case_snapshots` | Desk Audit Execution (da_*) | 4 | `id` | 0 | 2 |
| 44 | `da_draft_reports` | Desk Audit Execution (da_*) | 14 | `id` | 1 | 1 |
| 45 | `da_evidence` | Desk Audit Execution (da_*) | 10 | `id` | 1 | 1 |
| 46 | `da_findings` | Desk Audit Execution (da_*) | 25 | `id` | 0 | 1 |
| 47 | `da_queries` | Desk Audit Execution (da_*) | 12 | `id` | 0 | 1 |
| 48 | `da_working_papers` | Desk Audit Execution (da_*) | 14 | `id` | 0 | 1 |
| 49 | `flyway_schema_history` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 10 | `installed_rank` | 0 | 2 |
| 50 | `issue_audit_details` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 24 | `id` | 1 | 2 |
| 51 | `notifications` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 12 | `id` | 0 | 4 |
| 52 | `organizational_units` | Identity, RBAC, Security & Organizational Hierarchy | 8 | `id` | 1 | 5 |
| 53 | `permissions` | Identity, RBAC, Security & Organizational Hierarchy | 5 | `id` | 0 | 2 |
| 54 | `qa_action_plans` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 25 | `id` | 1 | 1 |
| 55 | `qa_deficiencies` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 10 | `id` | 0 | 1 |
| 56 | `qa_exit_conferences` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 7 | `id` | 0 | 1 |
| 57 | `qa_follow_up_action` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 20 | `id` | 0 | 4 |
| 58 | `qa_follow_ups` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 7 | `id` | 0 | 1 |
| 59 | `qa_recommendations` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 26 | `id` | 1 | 1 |
| 60 | `qa_reports` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 12 | `id` | 0 | 1 |
| 61 | `qa_review_case` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 51 | `id` | 0 | 6 |
| 62 | `qa_review_dimension` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 16 | `id` | 0 | 1 |
| 63 | `qa_review_event` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 12 | `id` | 0 | 4 |
| 64 | `qa_review_report` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 30 | `id` | 0 | 3 |
| 65 | `qa_sampling_rule` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 15 | `id` | 0 | 2 |
| 66 | `qa_sampling_run` | Audit Quality Assurance & ISO-19011 Review (qa_*) | 12 | `id` | 0 | 2 |
| 67 | `regions` | Identity, RBAC, Security & Organizational Hierarchy | 6 | `id` | 0 | 3 |
| 68 | `role_permissions` | Identity, RBAC, Security & Organizational Hierarchy | 4 | `role_id`, `permission_id` | 2 | 1 |
| 69 | `roles` | Identity, RBAC, Security & Organizational Hierarchy | 8 | `id` | 0 | 2 |
| 70 | `security_audit_log` | Identity, RBAC, Security & Organizational Hierarchy | 11 | `id` | 0 | 5 |
| 71 | `shared_audit_trail_entries` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 9 | `id` | 0 | 4 |
| 72 | `shared_outbox_entries` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 7 | `id` | 0 | 2 |
| 73 | `sla_tracking` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 9 | `task_id` | 1 | 3 |
| 74 | `t_advisory_voting` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 7 | `voting_id` | 1 | 2 |
| 75 | `t_audit_document` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 13 | `id` | 0 | 3 |
| 76 | `t_audit_finding` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 24 | `id` | 0 | 2 |
| 77 | `t_audit_plan_record` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 18 | `id` | 0 | 4 |
| 78 | `t_audit_team` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 13 | `team_id` | 0 | 2 |
| 79 | `t_auditor` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 14 | `auditor_id` | 0 | 1 |
| 80 | `t_auditor_nomination` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 9 | `nomination_id` | 1 | 1 |
| 81 | `t_caat_anomaly` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 22 | `id` | 0 | 2 |
| 82 | `t_case_status_history` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 7 | `history_id` | 1 | 1 |
| 83 | `t_committee_audit_log` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 10 | `log_id` | 1 | 1 |
| 84 | `t_committee_case` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 41 | `case_id` | 0 | 3 |
| 85 | `t_committee_session` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 13 | `session_id` | 0 | 1 |
| 86 | `t_committee_vote` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 8 | `vote_id` | 2 | 2 |
| 87 | `t_conference_record` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 13 | `id` | 0 | 2 |
| 88 | `t_document_request_record` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 11 | `id` | 0 | 2 |
| 89 | `t_handoff_record` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 12 | `handoff_id` | 1 | 2 |
| 90 | `t_handoff_team_member` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 5 | `member_id` | 1 | 1 |
| 91 | `t_research_attachment` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 8 | `attachment_id` | 1 | 1 |
| 92 | `t_research_comment` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 8 | `comment_id` | 2 | 1 |
| 93 | `t_research_note` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 9 | `note_id` | 1 | 1 |
| 94 | `t_session_attendee` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 7 | `attendee_id` | 1 | 1 |
| 95 | `t_user` | Identity, RBAC, Security & Organizational Hierarchy | 17 | `user_id` | 0 | 3 |
| 96 | `t_voting_tally` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 9 | `tally_id` | 1 | 2 |
| 97 | `t_working_paper` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 11 | `id` | 0 | 2 |
| 98 | `tax_centers` | Identity, RBAC, Security & Organizational Hierarchy | 7 | `id` | 1 | 4 |
| 99 | `team_members` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 11 | `team_id`, `user_id` | 4 | 6 |
| 100 | `teams` | Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff) | 9 | `id` | 2 | 4 |
| 101 | `tp_analysis_data` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 20 | `id` | 1 | 1 |
| 102 | `tp_audit_action_history` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 14 | `id` | 1 | 5 |
| 103 | `tp_audit_notice` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 22 | `id` | 1 | 2 |
| 104 | `tp_audit_plan` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 15 | `id` | 1 | 2 |
| 105 | `tp_audit_report` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 19 | `id` | 1 | 1 |
| 106 | `tp_competitor_price_uploads` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 16 | `id` | 1 | 5 |
| 107 | `tp_exit_conference` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 26 | `id` | 1 | 3 |
| 108 | `tp_external_price_match` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 19 | `id` | 1 | 3 |
| 109 | `tp_field_work_data` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 16 | `id` | 1 | 1 |
| 110 | `tp_information_request_log` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 22 | `id` | 1 | 5 |
| 111 | `tp_management_report_snapshot` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 8 | `id` | 0 | 3 |
| 112 | `tp_objection` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 18 | `id` | 1 | 1 |
| 113 | `tp_phase_gates` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 15 | `id` | 1 | 4 |
| 114 | `tp_planning_meeting` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 11 | `id` | 1 | 1 |
| 115 | `tp_risk_assessment` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 11 | `id` | 1 | 2 |
| 116 | `tp_working_hypothesis` | Transfer Pricing & Issue Audit Execution (tp_*, issue_*) | 13 | `id` | 1 | 2 |
| 117 | `user_organizational_assignments` | Identity, RBAC, Security & Organizational Hierarchy | 14 | `id` | 5 | 4 |
| 118 | `user_roles` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 4 | `user_id`, `role_id` | 2 | 2 |
| 119 | `user_sessions` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 9 | `id` | 1 | 5 |
| 120 | `users` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 13 | `id` | 1 | 7 |
| 121 | `workflow_definitions` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 10 | `id` | 0 | 2 |
| 122 | `workflow_instances` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 12 | `id` | 2 | 4 |
| 123 | `workflow_steps` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 18 | `id` | 1 | 3 |
| 124 | `workflow_tasks` | Workflow Engine, Notifications, SLA & Shared Infrastructure | 23 | `id` | 3 | 8 |

---

## 4. Foreign Key Relationship Matrix (All 103 Foreign Keys)

| Child Table | Child Column | Parent Table | Parent Column | Constraint Name |
| :--- | :--- | :--- | :--- | :--- |
| `ap_plan_allocations` | `plan_id` | `ap_annual_audit_plans` | `id` | `ap_plan_allocations_plan_id_fkey` |
| `ap_plan_audit_logs` | `plan_id` | `ap_annual_audit_plans` | `id` | `fkonbjsudf7mrjig9p6el6gdt4a` |
| `ap_regional_deployments` | `plan_id` | `ap_annual_audit_plans` | `id` | `ap_regional_deployments_plan_id_fkey` |
| `ap_regional_tc_deployments` | `plan_id` | `ap_annual_audit_plans` | `id` | `ap_regional_tc_deployments_plan_id_fkey` |
| `ca_approval_steps` | `audit_case_id` | `ap_audit_cases` | `id` | `fkofpinqpkaf175lex5q1yul0nh` |
| `ca_assessment_notices` | `audit_case_id` | `ap_audit_cases` | `id` | `fkom4aotqp5nhm65k8kxbfrnlce` |
| `ca_audit_assertions` | `audit_case_id` | `ap_audit_cases` | `id` | `fk2qiaqx40ay9c3xfsx8crv9c9c` |
| `ca_audit_findings` | `audit_case_id` | `ap_audit_cases` | `id` | `fkcp1jshk9m3ckji4xed9nb9l2x` |
| `ca_balance_sheet_items` | `audit_case_id` | `ap_audit_cases` | `id` | `fkcfr0elghxsbnih5h2ln3igsga` |
| `ca_benchmark_analyses` | `audit_case_id` | `ap_audit_cases` | `id` | `fkqwqsbh6at4bfwxjgb9uj6mrmv` |
| `ca_benford_analysis` | `audit_case_id` | `ap_audit_cases` | `id` | `fk1fyet9in9tt1rvgfaadfre9ve` |
| `ca_benford_analysis` | `caat_run_id` | `ca_caat_runs` | `id` | `fk7fho9jge846u89cxui214mthi` |
| `ca_caat_eligibility` | `audit_case_id` | `ap_audit_cases` | `id` | `fk2o5s855jqrvt5aq1uacpd92tj` |
| `ca_caat_exceptions` | `audit_case_id` | `ap_audit_cases` | `id` | `fk4c4p0etv95o89pwainan9itgu` |
| `ca_caat_exceptions` | `caat_run_id` | `ca_caat_runs` | `id` | `fkdav6a6ydl25090hrq5943l806` |
| `ca_caat_rules` | `caat_run_id` | `ca_caat_runs` | `id` | `fk46d9m62ww543bpje8gnm6i2q8` |
| `ca_caat_runs` | `audit_case_id` | `ap_audit_cases` | `id` | `fk5572vdl4mgxbb12gdd18l5s11` |
| `ca_case_snapshots` | `case_id` | `ap_audit_cases` | `id` | `ca_case_snapshots_case_id_fkey` |
| `ca_document_requests` | `audit_case_id` | `ap_audit_cases` | `id` | `fkcwqy6s0bdphtjjt9ovj5vucnn` |
| `ca_draft_reports` | `audit_case_id` | `ap_audit_cases` | `id` | `fki28oq1x0up8v0poqhibx5hvx5` |
| `ca_entry_conferences` | `audit_case_id` | `ap_audit_cases` | `id` | `fkgrioibmkvln0nciin5o8lt2tj` |
| `ca_execution_reports` | `audit_case_id` | `ap_audit_cases` | `id` | `fktrbuy24gk6yhhfacqvmfq63a2` |
| `ca_exit_conferences` | `audit_case_id` | `ap_audit_cases` | `id` | `fkeklrdlwk7deron6lo6oq2ianv` |
| `ca_multi_zone_allocations` | `audit_case_id` | `ap_audit_cases` | `id` | `fk3nkxtg1t5pwdo6k90paroev6n` |
| `ca_multi_zone_allocations` | `notice_id` | `ca_assessment_notices` | `id` | `fkpb930r9jvqeocrncndq5vu1qt` |
| `ca_query_sheets` | `audit_case_id` | `ap_audit_cases` | `id` | `fk7fig9qelbt67wfuxqhruhbyok` |
| `ca_reconciliations` | `audit_case_id` | `ap_audit_cases` | `id` | `fk1lulnefr14cnhc4advhiiw62h` |
| `ca_sampling_records` | `audit_case_id` | `ap_audit_cases` | `id` | `fk7exiann3nwatq5yuik5wr7s8i` |
| `ca_taxpayer_responses` | `audit_case_id` | `ap_audit_cases` | `id` | `fkdost1575isvlkunnd8ww085j2` |
| `ca_taxpayer_responses` | `draft_report_id` | `ca_draft_reports` | `id` | `fk52aij5iyvappa59yj47p6vos` |
| `ca_taxpayer_responses` | `notice_id` | `ca_assessment_notices` | `id` | `fkok4ba3eu6f5ylx41ehm2jygq6` |
| `ca_third_party_matches` | `audit_case_id` | `ap_audit_cases` | `id` | `fkks3g0i4o1vgh1yb6onpobd14p` |
| `ca_working_papers` | `audit_case_id` | `ap_audit_cases` | `id` | `fkqq44yfi0xv3uihol7cd6t4xtg` |
| `case_assignments` | `case_id` | `ap_audit_cases` | `id` | `fk_ca_case` |
| `case_auditor_assignment` | `assigned_by_id` | `users` | `id` | `fk_auditor_assign_assigned_by` |
| `case_auditor_assignment` | `auditor_id` | `users` | `id` | `fk_auditor_assign_auditor` |
| `case_auditor_assignment` | `case_id` | `ap_audit_cases` | `id` | `fk_auditor_assign_case` |
| `case_handoff` | `assigned_by_id` | `users` | `id` | `fk_handoff_assigned_by` |
| `case_handoff` | `case_id` | `ap_audit_cases` | `id` | `fk_handoff_case` |
| `case_handoff` | `team_leader_id` | `users` | `id` | `fk_handoff_team_leader` |
| `committees` | `audit_type_id` | `audit_types` | `id` | `fk_com_at` |
| `committees` | `tax_center_id` | `tax_centers` | `id` | `fk_com_tc` |
| `da_audit_procedures` | `audit_case_id` | `ap_audit_cases` | `id` | `fk5d1y7awhw8wai2fyi0hdgnvpo` |
| `da_draft_reports` | `audit_case_id` | `ap_audit_cases` | `id` | `fkedov6gd1hvih2rsj56kg8kuxm` |
| `da_evidence` | `audit_case_id` | `ap_audit_cases` | `id` | `fk2uyb9ih0xw19i17e6lqgeqfyd` |
| `issue_audit_details` | `audit_case_id` | `ap_audit_cases` | `id` | `fkjqcxl6kq7ib5gk0h0hci5lb2f` |
| `organizational_units` | `parent_id` | `organizational_units` | `id` | `fk_org_parent` |
| `qa_action_plans` | `audit_case_id` | `ap_audit_cases` | `id` | `fkry7lwcphwsb31ba7my570c0kc` |
| `qa_recommendations` | `audit_case_id` | `ap_audit_cases` | `id` | `fkeu6h372ljyvrqldn3ia1au3gt` |
| `role_permissions` | `permission_id` | `permissions` | `id` | `fk_rp_permission` |
| `role_permissions` | `role_id` | `roles` | `id` | `fk_rp_role` |
| `sla_tracking` | `task_id` | `workflow_tasks` | `id` | `fk_sla_task` |
| `t_advisory_voting` | `case_id` | `t_committee_case` | `case_id` | `fkbtnm6tsblx4bth000jabmi5gy` |
| `t_auditor_nomination` | `case_id` | `t_committee_case` | `case_id` | `fkny63jdjh6hvxpmft8w64pdm1g` |
| `t_case_status_history` | `case_id` | `t_committee_case` | `case_id` | `fkcpjkgkeuds2wp6cs1h4k8c11j` |
| `t_committee_audit_log` | `case_id` | `t_committee_case` | `case_id` | `fkrt1qrn5rs336clhg69cb8bifu` |
| `t_committee_vote` | `case_id` | `t_committee_case` | `case_id` | `fksbyna6vbjcahkr8j4ryscldb9` |
| `t_committee_vote` | `voting_id` | `t_advisory_voting` | `voting_id` | `fkke96tmubkpb9y64d5aqmcdldy` |
| `t_handoff_record` | `case_id` | `t_committee_case` | `case_id` | `fkfmajdxdwsv8urq1qxcigogpr1` |
| `t_handoff_team_member` | `handoff_id` | `t_handoff_record` | `handoff_id` | `fkkn81nx78gmcdobptypbosavwm` |
| `t_research_attachment` | `note_id` | `t_research_note` | `note_id` | `fkia4ou7xfqq2gdw7okruvpop8o` |
| `t_research_comment` | `note_id` | `t_research_note` | `note_id` | `fk16teqoslyltouaulj2jqfkw5i` |
| `t_research_comment` | `replied_to_comment_id` | `t_research_comment` | `comment_id` | `fk2pk1mb1091emhs7k3q2n80dov` |
| `t_research_note` | `case_id` | `t_committee_case` | `case_id` | `fkd8ebkitecaq6pe3mvfnu2t570` |
| `t_session_attendee` | `session_id` | `t_committee_session` | `session_id` | `fk15fifino13it9cmgrc4dsyxq` |
| `t_voting_tally` | `voting_id` | `t_advisory_voting` | `voting_id` | `fk330bww3xbiq30mo3gegeg2ht0` |
| `tax_centers` | `region_id` | `regions` | `id` | `fk_tc_region` |
| `team_members` | `auditor_id` | `users` | `id` | `team_members_auditor_id_fkey` |
| `team_members` | `team_id` | `teams` | `id` | `fk_tm_team` |
| `team_members` | `team_leader_id` | `users` | `id` | `team_members_team_leader_id_fkey` |
| `team_members` | `user_id` | `users` | `id` | `fk_tm_user` |
| `teams` | `org_unit_id` | `organizational_units` | `id` | `fk_team_org_unit` |
| `teams` | `team_leader_id` | `users` | `id` | `fk_team_team_leader` |
| `tp_analysis_data` | `audit_case_id` | `ap_audit_cases` | `id` | `fkcx61joljhaesp6h4djxy8ms7j` |
| `tp_audit_action_history` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_tah_case` |
| `tp_audit_notice` | `audit_case_id` | `ap_audit_cases` | `id` | `fk8pjbdwjgl5mp2ue5khqiyqklp` |
| `tp_audit_plan` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_tp_audit_plan_case` |
| `tp_audit_report` | `audit_case_id` | `ap_audit_cases` | `id` | `fktb82k70m7wosfce9nwba9c48k` |
| `tp_competitor_price_uploads` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_cpu_case` |
| `tp_exit_conference` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_exc_case` |
| `tp_external_price_match` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_epm_case` |
| `tp_field_work_data` | `audit_case_id` | `ap_audit_cases` | `id` | `fki3e6hvjuw8psf5kaev0d6y4fb` |
| `tp_information_request_log` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_idrl_case` |
| `tp_objection` | `audit_case_id` | `ap_audit_cases` | `id` | `fkf99wyh6btgd7yo0lkjuyycw75` |
| `tp_phase_gates` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_tp_phase_gates_case` |
| `tp_planning_meeting` | `audit_case_id` | `ap_audit_cases` | `id` | `fkh2ip8qmpebh2jfkc5orf433ca` |
| `tp_risk_assessment` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_tp_risk_assessment_case` |
| `tp_working_hypothesis` | `audit_case_id` | `ap_audit_cases` | `id` | `fk_tp_working_hypothesis_case` |
| `user_organizational_assignments` | `audit_type_id` | `audit_types` | `id` | `fk_uoa_at` |
| `user_organizational_assignments` | `committee_id` | `committees` | `id` | `fk_uoa_com` |
| `user_organizational_assignments` | `region_id` | `regions` | `id` | `fk_uoa_region` |
| `user_organizational_assignments` | `tax_center_id` | `tax_centers` | `id` | `fk_uoa_tc` |
| `user_organizational_assignments` | `user_id` | `users` | `id` | `fk_uoa_user` |
| `user_roles` | `role_id` | `roles` | `id` | `fk_ur_role` |
| `user_roles` | `user_id` | `users` | `id` | `fk_ur_user` |
| `user_sessions` | `user_id` | `users` | `id` | `fk_session_user` |
| `users` | `org_unit_id` | `organizational_units` | `id` | `fk_user_org_unit` |
| `workflow_instances` | `case_id` | `ap_audit_cases` | `id` | `fk_wi_case` |
| `workflow_instances` | `definition_id` | `workflow_definitions` | `id` | `fk_wi_definition` |
| `workflow_steps` | `definition_id` | `workflow_definitions` | `id` | `fk_ws_definition` |
| `workflow_tasks` | `case_id` | `ap_audit_cases` | `id` | `fk_wt_case` |
| `workflow_tasks` | `instance_id` | `workflow_instances` | `id` | `fk_wt_instance` |
| `workflow_tasks` | `step_id` | `workflow_steps` | `id` | `fk_wt_step` |

---

## 5. Complete Table-by-Table Data Dictionary

### 01. Annual Audit Planning & Case Registry (ap_*)

#### Table: `ap_annual_audit_plans` (28 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_year` | `integer` | NO | - | `-` |
| `plan_name` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `'DRAFT'::character varying` |
| `created_by` | `character varying` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `submitted_to_director_by` | `character varying` | YES | - | `-` |
| `submitted_to_director_at` | `timestamp with time zone` | YES | - | `-` |
| `director_approved_by` | `character varying` | YES | - | `-` |
| `director_approved_at` | `timestamp with time zone` | YES | - | `-` |
| `director_approval_reason` | `text` | YES | - | `-` |
| `submitted_to_regional_by` | `character varying` | YES | - | `-` |
| `submitted_to_regional_at` | `timestamp with time zone` | YES | - | `-` |
| `regional_director_approved_by` | `character varying` | YES | - | `-` |
| `regional_director_approved_at` | `timestamp with time zone` | YES | - | `-` |
| `regional_director_approval_reason` | `text` | YES | - | `-` |
| `sent_to_tax_center_at` | `timestamp with time zone` | YES | - | `-` |
| `distribution_json` | `jsonb` | YES | - | `-` |
| `sent_to_regions_at` | `timestamp with time zone` | YES | - | `-` |
| `sent_to_regions_by` | `character varying` | YES | - | `-` |
| `regions_received_count` | `integer` | YES | - | `0` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | YES | - | `0` |
| `director_comment` | `text` | YES | - | `-` |
| `senior_comment` | `text` | YES | - | `-` |
| `amendment_comment` | `text` | YES | - | `-` |
| `estimated_revenue` | `numeric` | YES | - | `-` |
| `estimated_revenue_distribution` | `jsonb` | YES | - | `-` |

**Indexes:**
- `ap_annual_audit_plans_pkey`: `CREATE UNIQUE INDEX ap_annual_audit_plans_pkey ON public.ap_annual_audit_plans USING btree (id)`
- `idx_ap_plans_created_at`: `CREATE INDEX idx_ap_plans_created_at ON public.ap_annual_audit_plans USING btree (created_at)`
- `idx_ap_plans_created_by`: `CREATE INDEX idx_ap_plans_created_by ON public.ap_annual_audit_plans USING btree (created_by)`
- `idx_ap_plans_status`: `CREATE INDEX idx_ap_plans_status ON public.ap_annual_audit_plans USING btree (status)`
- `idx_ap_plans_year`: `CREATE INDEX idx_ap_plans_year ON public.ap_annual_audit_plans USING btree (plan_year)`
- `uk_annual_plans_year`: `CREATE UNIQUE INDEX uk_annual_plans_year ON public.ap_annual_audit_plans USING btree (plan_year)`
- `uk_ap_plan_year_name`: `CREATE UNIQUE INDEX uk_ap_plan_year_name ON public.ap_annual_audit_plans USING btree (plan_year, plan_name)`


#### Table: `ap_audit_cases` (43 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | - | `-` |
| `allocation_id` | `uuid` | YES | - | `-` |
| `case_number` | `character varying` | NO | - | `-` |
| `taxpayer_id` | `character varying` | NO | - | `-` |
| `audit_type` | `character varying` | YES | - | `-` |
| `risk_score` | `integer` | YES | - | `-` |
| `status` | `character varying` | NO | - | `'PENDING_ASSIGNMENT'::character varying` |
| `assigned_team_leader_id` | `character varying` | YES | - | `-` |
| `assigned_auditor_id` | `character varying` | YES | - | `-` |
| `created_by` | `character varying` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `started_at` | `timestamp with time zone` | YES | - | `-` |
| `completed_at` | `timestamp with time zone` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `estimated_revenue` | `bigint` | YES | - | `-` |
| `tax_center_code` | `character varying` | YES | - | `-` |
| `region_code` | `character varying` | YES | - | `-` |
| `taxpayer_name` | `character varying` | YES | - | `-` |
| `sector` | `character varying` | YES | - | `-` |
| `tp_current_phase` | `character varying` | YES | - | `NULL::character varying` |
| `tp_working_hypothesis_id` | `uuid` | YES | - | `-` |
| `committee_id` | `uuid` | YES | - | `-` |
| `assigned_at` | `timestamp with time zone` | YES | - | `-` |
| `assigned_by` | `character varying` | YES | - | `-` |
| `handoff_at` | `timestamp with time zone` | YES | - | `-` |
| `handoff_by` | `character varying` | YES | - | `-` |
| `handoff_comment` | `text` | YES | - | `-` |
| `risk_priority` | `character varying` | YES | - | `-` |
| `segment` | `character varying` | YES | - | `-` |
| `handoff_date` | `timestamp with time zone` | YES | - | `-` |
| `handoff_reason` | `text` | YES | - | `-` |
| `audit_scope` | `text` | YES | - | `-` |
| `ca_current_phase` | `character varying` | YES | - | `-` |
| `ca_workflow_status` | `character varying` | YES | - | `-` |
| `da_current_phase` | `character varying` | YES | - | `-` |
| `due_date` | `date` | YES | - | `-` |
| `qa_current_phase` | `character varying` | YES | - | `-` |
| `risk_category` | `character varying` | YES | - | `-` |
| `start_date` | `date` | YES | - | `-` |
| `tax_center` | `character varying` | YES | - | `-` |
| `taxpayer_segment` | `character varying` | YES | - | `-` |
| `tin` | `character varying` | YES | - | `-` |

**Indexes:**
- `ap_audit_cases_case_number_key`: `CREATE UNIQUE INDEX ap_audit_cases_case_number_key ON public.ap_audit_cases USING btree (case_number)`
- `ap_audit_cases_pkey`: `CREATE UNIQUE INDEX ap_audit_cases_pkey ON public.ap_audit_cases USING btree (id)`
- `idx_ap_audit_cases_audit_type`: `CREATE INDEX idx_ap_audit_cases_audit_type ON public.ap_audit_cases USING btree (audit_type)`
- `idx_ap_audit_cases_auditor`: `CREATE INDEX idx_ap_audit_cases_auditor ON public.ap_audit_cases USING btree (assigned_auditor_id)`
- `idx_ap_audit_cases_case_number`: `CREATE INDEX idx_ap_audit_cases_case_number ON public.ap_audit_cases USING btree (case_number)`
- `idx_ap_audit_cases_plan_id`: `CREATE INDEX idx_ap_audit_cases_plan_id ON public.ap_audit_cases USING btree (plan_id)`
- `idx_ap_audit_cases_region`: `CREATE INDEX idx_ap_audit_cases_region ON public.ap_audit_cases USING btree (region_code)`
- `idx_ap_audit_cases_status`: `CREATE INDEX idx_ap_audit_cases_status ON public.ap_audit_cases USING btree (status)`
- `idx_ap_audit_cases_tax_center`: `CREATE INDEX idx_ap_audit_cases_tax_center ON public.ap_audit_cases USING btree (tax_center_code)`
- `idx_ap_audit_cases_tc_status`: `CREATE INDEX idx_ap_audit_cases_tc_status ON public.ap_audit_cases USING btree (tax_center_code, status)`
- `idx_ap_audit_cases_team_leader`: `CREATE INDEX idx_ap_audit_cases_team_leader ON public.ap_audit_cases USING btree (assigned_team_leader_id)`
- `idx_ap_audit_cases_tl_status`: `CREATE INDEX idx_ap_audit_cases_tl_status ON public.ap_audit_cases USING btree (assigned_team_leader_id, status)`
- `idx_ap_cases_auditor`: `CREATE INDEX idx_ap_cases_auditor ON public.ap_audit_cases USING btree (assigned_auditor_id)`
- `idx_ap_cases_team_leader`: `CREATE INDEX idx_ap_cases_team_leader ON public.ap_audit_cases USING btree (assigned_team_leader_id)`
- `idx_cases_estimated_revenue`: `CREATE INDEX idx_cases_estimated_revenue ON public.ap_audit_cases USING btree (estimated_revenue)`


#### Table: `ap_director_approvals` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | - | `-` |
| `director_id` | `character varying` | NO | - | `-` |
| `decision` | `character varying` | NO | - | `-` |
| `reason` | `text` | YES | - | `-` |
| `comment` | `text` | YES | - | `-` |
| `approved_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | YES | - | `0` |

**Indexes:**
- `ap_director_approvals_pkey`: `CREATE UNIQUE INDEX ap_director_approvals_pkey ON public.ap_director_approvals USING btree (id)`
- `idx_director_approvals_approved_at`: `CREATE INDEX idx_director_approvals_approved_at ON public.ap_director_approvals USING btree (approved_at)`
- `idx_director_approvals_decision`: `CREATE INDEX idx_director_approvals_decision ON public.ap_director_approvals USING btree (decision)`
- `idx_director_approvals_director`: `CREATE INDEX idx_director_approvals_director ON public.ap_director_approvals USING btree (director_id)`
- `idx_director_approvals_plan`: `CREATE INDEX idx_director_approvals_plan ON public.ap_director_approvals USING btree (plan_id)`
- `uk_director_approval_per_plan`: `CREATE UNIQUE INDEX uk_director_approval_per_plan ON public.ap_director_approvals USING btree (plan_id)`


#### Table: `ap_plan_allocations` (19 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | FK -> `ap_annual_audit_plans.id` | `-` |
| `tax_center_code` | `character varying` | YES | - | `-` |
| `region_code` | `character varying` | NO | - | `-` |
| `proposed_count` | `integer` | NO | - | `-` |
| `regional_divided_count` | `integer` | YES | - | `-` |
| `regional_division_reason` | `text` | YES | - | `-` |
| `tc_adjusted_count` | `integer` | YES | - | `-` |
| `tc_justification` | `text` | YES | - | `-` |
| `tc_feedback_submitted` | `boolean` | YES | - | `false` |
| `tc_feedback_submitted_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `tc_adjusted_allocations` | `jsonb` | YES | - | `-` |
| `tc_original_count` | `integer` | YES | - | `-` |
| `tc_adjustment_reason` | `character varying` | YES | - | `-` |
| `allocation_by_audit_type` | `jsonb` | YES | - | `-` |
| `estimated_revenue` | `numeric` | YES | - | `-` |
| `revenue_by_audit_type` | `jsonb` | YES | - | `-` |

**Indexes:**
- `ap_plan_allocations_pkey`: `CREATE UNIQUE INDEX ap_plan_allocations_pkey ON public.ap_plan_allocations USING btree (id)`
- `idx_allocation_by_audit_type`: `CREATE INDEX idx_allocation_by_audit_type ON public.ap_plan_allocations USING gin (allocation_by_audit_type)`
- `idx_allocations_revenue`: `CREATE INDEX idx_allocations_revenue ON public.ap_plan_allocations USING btree (estimated_revenue)`
- `idx_ap_allocations_plan`: `CREATE INDEX idx_ap_allocations_plan ON public.ap_plan_allocations USING btree (plan_id)`
- `idx_ap_allocations_region`: `CREATE INDEX idx_ap_allocations_region ON public.ap_plan_allocations USING btree (region_code)`
- `idx_ap_allocations_regional_only`: `CREATE INDEX idx_ap_allocations_regional_only ON public.ap_plan_allocations USING btree (plan_id, region_code) WHERE (tax_center_code IS NULL)`
- `idx_ap_allocations_tax_center`: `CREATE INDEX idx_ap_allocations_tax_center ON public.ap_plan_allocations USING btree (tax_center_code)`
- `idx_ap_allocations_tc_feedback`: `CREATE INDEX idx_ap_allocations_tc_feedback ON public.ap_plan_allocations USING btree (tc_feedback_submitted)`
- `idx_tc_adjusted_allocations`: `CREATE INDEX idx_tc_adjusted_allocations ON public.ap_plan_allocations USING gin (tc_adjusted_allocations)`
- `uk_ap_allocation_regional`: `CREATE UNIQUE INDEX uk_ap_allocation_regional ON public.ap_plan_allocations USING btree (plan_id, region_code, tax_center_code)`


#### Table: `ap_plan_audit_logs` (8 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | FK -> `ap_annual_audit_plans.id` | `-` |
| `action` | `character varying` | NO | - | `-` |
| `actor_id` | `character varying` | NO | - | `-` |
| `actor_role` | `character varying` | NO | - | `-` |
| `reason` | `text` | YES | - | `-` |
| `changed_fields` | `jsonb` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `ap_plan_audit_logs_pkey`: `CREATE UNIQUE INDEX ap_plan_audit_logs_pkey ON public.ap_plan_audit_logs USING btree (id)`
- `idx_ap_audit_logs_actor`: `CREATE INDEX idx_ap_audit_logs_actor ON public.ap_plan_audit_logs USING btree (actor_id)`
- `idx_ap_audit_logs_created_at`: `CREATE INDEX idx_ap_audit_logs_created_at ON public.ap_plan_audit_logs USING btree (created_at)`
- `idx_ap_audit_logs_plan`: `CREATE INDEX idx_ap_audit_logs_plan ON public.ap_plan_audit_logs USING btree (plan_id)`


#### Table: `ap_plan_revisions` (6 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | - | `-` |
| `comment` | `text` | NO | - | `-` |
| `revision_type` | `character varying` | YES | - | `-` |
| `created_by` | `character varying` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `ap_plan_revisions_pkey`: `CREATE UNIQUE INDEX ap_plan_revisions_pkey ON public.ap_plan_revisions USING btree (id)`
- `idx_ap_plan_revisions_plan_id`: `CREATE INDEX idx_ap_plan_revisions_plan_id ON public.ap_plan_revisions USING btree (plan_id)`


#### Table: `ap_plan_timeline` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `actor_id` | `character varying` | NO | - | `-` |
| `comment` | `text` | YES | - | `-` |
| `event_timestamp` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `ap_plan_timeline_pkey`: `CREATE UNIQUE INDEX ap_plan_timeline_pkey ON public.ap_plan_timeline USING btree (id)`
- `idx_ap_plan_timeline_plan_id`: `CREATE INDEX idx_ap_plan_timeline_plan_id ON public.ap_plan_timeline USING btree (plan_id)`


#### Table: `ap_planning_configuration` (5 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `character varying` | NO | PK | `-` |
| `config_data` | `jsonb` | NO | - | `-` |
| `version` | `integer` | NO | - | `1` |
| `updated_by` | `character varying` | NO | - | `'SYSTEM_DEFAULT'::character varying` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `ap_planning_configuration_pkey`: `CREATE UNIQUE INDEX ap_planning_configuration_pkey ON public.ap_planning_configuration USING btree (id)`
- `idx_ap_planning_configuration_updated_at`: `CREATE INDEX idx_ap_planning_configuration_updated_at ON public.ap_planning_configuration USING btree (updated_at DESC)`


#### Table: `ap_regional_deployments` (18 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | FK -> `ap_annual_audit_plans.id` | `-` |
| `region_code` | `character varying` | NO | - | `-` |
| `director_id` | `character varying` | NO | - | `-` |
| `sent_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `deployment_note` | `text` | YES | - | `-` |
| `region_allocated_cases` | `jsonb` | YES | - | `-` |
| `received_at` | `timestamp with time zone` | YES | - | `-` |
| `acknowledged_by` | `character varying` | YES | - | `-` |
| `acknowledged_at` | `timestamp with time zone` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | YES | - | `0` |
| `estimated_revenue` | `bigint` | YES | - | `0` |
| `revenue_by_audit_type` | `jsonb` | YES | - | `-` |
| `deployed_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `deployed_by` | `character varying` | YES | - | `-` |
| `region_id` | `character varying` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |

**Indexes:**
- `ap_regional_deployments_pkey`: `CREATE UNIQUE INDEX ap_regional_deployments_pkey ON public.ap_regional_deployments USING btree (id)`
- `idx_ap_regional_deployments_plan_id`: `CREATE INDEX idx_ap_regional_deployments_plan_id ON public.ap_regional_deployments USING btree (plan_id)`
- `idx_regional_deployments_director`: `CREATE INDEX idx_regional_deployments_director ON public.ap_regional_deployments USING btree (director_id)`
- `idx_regional_deployments_plan`: `CREATE INDEX idx_regional_deployments_plan ON public.ap_regional_deployments USING btree (plan_id)`
- `idx_regional_deployments_region`: `CREATE INDEX idx_regional_deployments_region ON public.ap_regional_deployments USING btree (region_code)`
- `idx_regional_deployments_region_plan`: `CREATE INDEX idx_regional_deployments_region_plan ON public.ap_regional_deployments USING btree (region_code, plan_id)`
- `idx_regional_deployments_sent_at`: `CREATE INDEX idx_regional_deployments_sent_at ON public.ap_regional_deployments USING btree (sent_at)`
- `uk_regional_deployment_per_plan`: `CREATE UNIQUE INDEX uk_regional_deployment_per_plan ON public.ap_regional_deployments USING btree (plan_id, region_code)`
- `unique_regional_deployment`: `CREATE UNIQUE INDEX unique_regional_deployment ON public.ap_regional_deployments USING btree (plan_id, region_id)`


#### Table: `ap_regional_feedback` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | - | `-` |
| `region_id` | `character varying` | NO | - | `-` |
| `feedback_text` | `text` | YES | - | `-` |
| `submitted_by` | `character varying` | YES | - | `-` |
| `submitted_at` | `timestamp with time zone` | YES | - | `-` |
| `is_overridden` | `boolean` | YES | - | `false` |
| `override_comment` | `text` | YES | - | `-` |
| `override_by` | `character varying` | YES | - | `-` |
| `override_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `ap_regional_feedback_pkey`: `CREATE UNIQUE INDEX ap_regional_feedback_pkey ON public.ap_regional_feedback USING btree (id)`
- `idx_ap_regional_feedback_plan_id`: `CREATE INDEX idx_ap_regional_feedback_plan_id ON public.ap_regional_feedback USING btree (plan_id)`
- `idx_ap_regional_feedback_region`: `CREATE INDEX idx_ap_regional_feedback_region ON public.ap_regional_feedback USING btree (region_id)`
- `unique_regional_feedback`: `CREATE UNIQUE INDEX unique_regional_feedback ON public.ap_regional_feedback USING btree (plan_id, region_id)`


#### Table: `ap_regional_plan_access` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | - | `-` |
| `region_code` | `character varying` | NO | - | `-` |
| `access_granted_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `access_expires_at` | `timestamp with time zone` | YES | - | `-` |
| `reason` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `ap_regional_plan_access_pkey`: `CREATE UNIQUE INDEX ap_regional_plan_access_pkey ON public.ap_regional_plan_access USING btree (id)`
- `idx_regional_access_granted_at`: `CREATE INDEX idx_regional_access_granted_at ON public.ap_regional_plan_access USING btree (access_granted_at)`
- `idx_regional_access_plan`: `CREATE INDEX idx_regional_access_plan ON public.ap_regional_plan_access USING btree (plan_id)`
- `idx_regional_access_region`: `CREATE INDEX idx_regional_access_region ON public.ap_regional_plan_access USING btree (region_code)`
- `idx_regional_access_region_active`: `CREATE INDEX idx_regional_access_region_active ON public.ap_regional_plan_access USING btree (region_code, access_expires_at) WHERE (access_expires_at IS NULL)`
- `uk_regional_access_per_plan`: `CREATE UNIQUE INDEX uk_regional_access_per_plan ON public.ap_regional_plan_access USING btree (plan_id, region_code)`


#### Table: `ap_regional_tc_deployments` (6 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `plan_id` | `uuid` | NO | FK -> `ap_annual_audit_plans.id` | `-` |
| `region_id` | `character varying` | NO | - | `-` |
| `deployed_by` | `character varying` | NO | - | `-` |
| `deployed_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `status` | `character varying` | YES | - | `'DEPLOYED'::character varying` |

**Indexes:**
- `ap_regional_tc_deployments_pkey`: `CREATE UNIQUE INDEX ap_regional_tc_deployments_pkey ON public.ap_regional_tc_deployments USING btree (id)`
- `idx_ap_regional_tc_deployments_deployed_by`: `CREATE INDEX idx_ap_regional_tc_deployments_deployed_by ON public.ap_regional_tc_deployments USING btree (deployed_by)`
- `idx_ap_regional_tc_deployments_plan_id`: `CREATE INDEX idx_ap_regional_tc_deployments_plan_id ON public.ap_regional_tc_deployments USING btree (plan_id)`
- `idx_ap_regional_tc_deployments_region_id`: `CREATE INDEX idx_ap_regional_tc_deployments_region_id ON public.ap_regional_tc_deployments USING btree (region_id)`
- `uk_regional_tc_deployment_per_plan`: `CREATE UNIQUE INDEX uk_regional_tc_deployment_per_plan ON public.ap_regional_tc_deployments USING btree (plan_id, region_id)`
- `unique_regional_tc_deployment`: `CREATE UNIQUE INDEX unique_regional_tc_deployment ON public.ap_regional_tc_deployments USING btree (plan_id, region_id)`


### 02. Comprehensive Audit & CAAT Engine (ca_*)

#### Table: `ca_approval_steps` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `approval_level` | `smallint` | NO | - | `-` |
| `approver_id` | `character varying` | NO | - | `-` |
| `approver_role` | `character varying` | NO | - | `-` |
| `comments` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `decided_at` | `timestamp with time zone` | YES | - | `-` |
| `decision` | `character varying` | NO | - | `-` |
| `entity_id` | `uuid` | NO | - | `-` |
| `entity_type` | `character varying` | NO | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_approval_steps_pkey`: `CREATE UNIQUE INDEX ca_approval_steps_pkey ON public.ca_approval_steps USING btree (id)`


#### Table: `ca_assessment_notices` (28 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `fraud_referral_at` | `timestamp with time zone` | YES | - | `-` |
| `fraud_referral_reason` | `character varying` | YES | - | `-` |
| `fraud_referral_triggered` | `boolean` | YES | - | `-` |
| `interest_amount` | `numeric` | YES | - | `-` |
| `interest_days` | `integer` | YES | - | `-` |
| `interest_rate_annual` | `numeric` | YES | - | `-` |
| `issue_date` | `date` | NO | - | `-` |
| `issued_by` | `character varying` | YES | - | `-` |
| `notice_number` | `character varying` | NO | - | `-` |
| `objection_details` | `text` | YES | - | `-` |
| `objection_lodged_at` | `timestamp with time zone` | YES | - | `-` |
| `objection_status` | `character varying` | YES | - | `-` |
| `penalty_amount` | `numeric` | YES | - | `-` |
| `penalty_pct` | `numeric` | YES | - | `-` |
| `principal_cit` | `numeric` | YES | - | `-` |
| `principal_paye` | `numeric` | YES | - | `-` |
| `principal_total` | `numeric` | YES | - | `-` |
| `principal_vat` | `numeric` | YES | - | `-` |
| `principal_wht` | `numeric` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `statutory_due_date` | `date` | NO | - | `-` |
| `taxpayer_signed` | `boolean` | YES | - | `-` |
| `taxpayer_signed_at` | `timestamp with time zone` | YES | - | `-` |
| `total_assessment_due` | `numeric` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_assessment_notices_pkey`: `CREATE UNIQUE INDEX ca_assessment_notices_pkey ON public.ca_assessment_notices USING btree (id)`
- `uk_pgswyeeip8j00y7oqflkob0re`: `CREATE UNIQUE INDEX uk_pgswyeeip8j00y7oqflkob0re ON public.ca_assessment_notices USING btree (notice_number)`


#### Table: `ca_audit_assertions` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `actual_value` | `numeric` | YES | - | `-` |
| `assertion_type` | `character varying` | NO | - | `-` |
| `conclusion` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `expected_value` | `numeric` | YES | - | `-` |
| `explanation` | `character varying` | YES | - | `-` |
| `financial_area` | `character varying` | NO | - | `-` |
| `finding` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `verification_result` | `character varying` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_audit_assertions_pkey`: `CREATE UNIQUE INDEX ca_audit_assertions_pkey ON public.ca_audit_assertions USING btree (id)`


#### Table: `ca_audit_findings` (29 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `audit_area` | `character varying` | NO | - | `-` |
| `auditor_analysis` | `text` | YES | - | `-` |
| `caat_exception_id` | `uuid` | YES | - | `-` |
| `cause` | `text` | YES | - | `-` |
| `conclusion` | `text` | YES | - | `-` |
| `condition` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `criteria` | `text` | YES | - | `-` |
| `description` | `text` | NO | - | `-` |
| `effect` | `text` | YES | - | `-` |
| `finding_reference` | `character varying` | NO | - | `-` |
| `fraud_indicators` | `text` | YES | - | `-` |
| `fraud_referral_date` | `timestamp with time zone` | YES | - | `-` |
| `indicates_fraud` | `boolean` | YES | - | `-` |
| `interest_amount` | `numeric` | YES | - | `-` |
| `is_significant` | `boolean` | YES | - | `-` |
| `penalty_amount` | `numeric` | YES | - | `-` |
| `penalty_rate` | `numeric` | YES | - | `-` |
| `recommendation` | `text` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `tax_type` | `character varying` | YES | - | `-` |
| `title` | `character varying` | NO | - | `-` |
| `total_tax_impact` | `numeric` | YES | - | `-` |
| `under_declared_amount` | `numeric` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `zone_code` | `character varying` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_audit_findings_pkey`: `CREATE UNIQUE INDEX ca_audit_findings_pkey ON public.ca_audit_findings USING btree (id)`
- `uk_te8jjshttjtxdx8um4wxesx65`: `CREATE UNIQUE INDEX uk_te8jjshttjtxdx8um4wxesx65 ON public.ca_audit_findings USING btree (finding_reference)`


#### Table: `ca_balance_sheet_items` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `assertion_type` | `character varying` | NO | - | `-` |
| `audited_balance` | `numeric` | YES | - | `-` |
| `auditee_balance` | `numeric` | YES | - | `-` |
| `auditor_conclusion` | `character varying` | YES | - | `-` |
| `component` | `character varying` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `ifrs_compliance` | `character varying` | YES | - | `-` |
| `notes` | `text` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `variance` | `numeric` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_balance_sheet_items_pkey`: `CREATE UNIQUE INDEX ca_balance_sheet_items_pkey ON public.ca_balance_sheet_items USING btree (id)`


#### Table: `ca_benchmark_analyses` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `benchmark_value` | `numeric` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `data_year` | `smallint` | YES | - | `-` |
| `industry_code` | `character varying` | YES | - | `-` |
| `interpretation` | `text` | YES | - | `-` |
| `ratio_name` | `character varying` | NO | - | `-` |
| `risk_level` | `character varying` | YES | - | `-` |
| `taxpayer_value` | `numeric` | YES | - | `-` |
| `unit` | `character varying` | YES | - | `-` |
| `variance_pct` | `numeric` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_benchmark_analyses_pkey`: `CREATE UNIQUE INDEX ca_benchmark_analyses_pkey ON public.ca_benchmark_analyses USING btree (id)`


#### Table: `ca_benford_analysis` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `deviation` | `numeric` | YES | - | `-` |
| `digit` | `smallint` | NO | - | `-` |
| `expected_pct` | `numeric` | NO | - | `-` |
| `is_anomalous` | `boolean` | YES | - | `-` |
| `observed_count` | `integer` | YES | - | `-` |
| `observed_pct` | `numeric` | NO | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `caat_run_id` | `uuid` | NO | FK -> `ca_caat_runs.id` | `-` |

**Indexes:**
- `ca_benford_analysis_pkey`: `CREATE UNIQUE INDEX ca_benford_analysis_pkey ON public.ca_benford_analysis USING btree (id)`


#### Table: `ca_caat_eligibility` (16 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `annual_turnover` | `numeric` | YES | - | `-` |
| `assessed_at` | `timestamp with time zone` | YES | - | `-` |
| `assessed_by` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `eligibility_reason` | `text` | YES | - | `-` |
| `has_electronic_records` | `boolean` | YES | - | `-` |
| `has_erp_system` | `boolean` | YES | - | `-` |
| `is_eligible` | `boolean` | NO | - | `-` |
| `overridden` | `boolean` | YES | - | `-` |
| `override_by` | `character varying` | YES | - | `-` |
| `override_reason` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `taxpayer_segment` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_caat_eligibility_pkey`: `CREATE UNIQUE INDEX ca_caat_eligibility_pkey ON public.ca_caat_eligibility USING btree (id)`


#### Table: `ca_caat_exceptions` (19 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `account_name` | `character varying` | YES | - | `-` |
| `action_taken_notes` | `text` | YES | - | `-` |
| `amount` | `numeric` | YES | - | `-` |
| `anomaly_type` | `character varying` | NO | - | `-` |
| `converted_to_finding` | `boolean` | YES | - | `-` |
| `counterparty` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `details` | `text` | YES | - | `-` |
| `finding_id` | `uuid` | YES | - | `-` |
| `risk_level` | `character varying` | NO | - | `-` |
| `rule_code` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `tax_head` | `character varying` | YES | - | `-` |
| `transaction_date` | `date` | YES | - | `-` |
| `transaction_ref` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `caat_run_id` | `uuid` | NO | FK -> `ca_caat_runs.id` | `-` |

**Indexes:**
- `ca_caat_exceptions_pkey`: `CREATE UNIQUE INDEX ca_caat_exceptions_pkey ON public.ca_caat_exceptions USING btree (id)`


#### Table: `ca_caat_rules` (14 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `category` | `character varying` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `details` | `text` | YES | - | `-` |
| `discrepancies_count` | `integer` | YES | - | `-` |
| `last_executed_at` | `timestamp with time zone` | YES | - | `-` |
| `rule_code` | `character varying` | NO | - | `-` |
| `rule_name` | `character varying` | NO | - | `-` |
| `sample_size` | `integer` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `target_ledger` | `character varying` | YES | - | `-` |
| `threshold_amount` | `numeric` | YES | - | `-` |
| `variance_amount` | `numeric` | YES | - | `-` |
| `caat_run_id` | `uuid` | NO | FK -> `ca_caat_runs.id` | `-` |

**Indexes:**
- `ca_caat_rules_pkey`: `CREATE UNIQUE INDEX ca_caat_rules_pkey ON public.ca_caat_rules USING btree (id)`


#### Table: `ca_caat_runs` (16 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `auditor_notes` | `text` | YES | - | `-` |
| `caat_tool_name` | `character varying` | NO | - | `-` |
| `completed_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `executed_by` | `character varying` | YES | - | `-` |
| `execution_log` | `text` | YES | - | `-` |
| `run_reference` | `character varying` | NO | - | `-` |
| `sampling_method` | `character varying` | NO | - | `-` |
| `started_at` | `timestamp with time zone` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `total_flagged` | `integer` | YES | - | `-` |
| `total_flagged_exposure` | `numeric` | YES | - | `-` |
| `total_records_mined` | `integer` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_caat_runs_pkey`: `CREATE UNIQUE INDEX ca_caat_runs_pkey ON public.ca_caat_runs USING btree (id)`


#### Table: `ca_case_snapshots` (4 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `snapshot_data` | `text` | YES | - | `-` |
| `last_saved_at` | `timestamp with time zone` | NO | - | `now()` |

**Indexes:**
- `ca_case_snapshots_case_id_key`: `CREATE UNIQUE INDEX ca_case_snapshots_case_id_key ON public.ca_case_snapshots USING btree (case_id)`
- `ca_case_snapshots_pkey`: `CREATE UNIQUE INDEX ca_case_snapshots_pkey ON public.ca_case_snapshots USING btree (id)`
- `idx_ca_case_snapshots_case_id`: `CREATE INDEX idx_ca_case_snapshots_case_id ON public.ca_case_snapshots USING btree (case_id)`


#### Table: `ca_document_requests` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `due_date` | `timestamp with time zone` | YES | - | `-` |
| `request_description` | `character varying` | NO | - | `-` |
| `requested_document` | `character varying` | NO | - | `-` |
| `requesting_auditor` | `character varying` | YES | - | `-` |
| `response_notes` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_document_requests_pkey`: `CREATE UNIQUE INDEX ca_document_requests_pkey ON public.ca_document_requests USING btree (id)`


#### Table: `ca_draft_reports` (30 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `director_comments` | `text` | YES | - | `-` |
| `director_reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `director_reviewed_by` | `character varying` | YES | - | `-` |
| `executive_summary` | `text` | YES | - | `-` |
| `findings_summary` | `text` | YES | - | `-` |
| `ifrs_compliance_notes` | `text` | YES | - | `-` |
| `methodology` | `text` | YES | - | `-` |
| `recommended_adjustments` | `text` | YES | - | `-` |
| `report_reference` | `character varying` | NO | - | `-` |
| `scope_and_objectives` | `text` | YES | - | `-` |
| `sent_by` | `character varying` | YES | - | `-` |
| `sent_to_taxpayer_at` | `timestamp with time zone` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `statutory_recommendations` | `text` | YES | - | `-` |
| `taxpayer_objection_deadline` | `timestamp with time zone` | YES | - | `-` |
| `taxpayer_signed_at` | `timestamp with time zone` | YES | - | `-` |
| `team_leader_comments` | `text` | YES | - | `-` |
| `team_leader_reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `team_leader_reviewed_by` | `character varying` | YES | - | `-` |
| `total_assessment` | `numeric` | YES | - | `-` |
| `total_interest` | `numeric` | YES | - | `-` |
| `total_penalty` | `numeric` | YES | - | `-` |
| `total_principal_tax` | `numeric` | YES | - | `-` |
| `undelivered` | `boolean` | YES | - | `-` |
| `undelivered_reason` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_draft_reports_pkey`: `CREATE UNIQUE INDEX ca_draft_reports_pkey ON public.ca_draft_reports USING btree (id)`
- `uk_m1kp3thsoea0fi0pu2ca5stet`: `CREATE UNIQUE INDEX uk_m1kp3thsoea0fi0pu2ca5stet ON public.ca_draft_reports USING btree (report_reference)`


#### Table: `ca_entry_conferences` (18 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `attendees` | `jsonb` | YES | - | `-` |
| `audio_recording_url` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `internal_controls_review` | `text` | YES | - | `-` |
| `premises_inspection_notes` | `text` | YES | - | `-` |
| `reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `reviewed_by` | `character varying` | YES | - | `-` |
| `scheduled_date` | `date` | NO | - | `-` |
| `scheduled_time` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `taxpayer_confirmed_receipt` | `boolean` | YES | - | `-` |
| `taxpayer_receipt_date` | `date` | YES | - | `-` |
| `team_leader_approved` | `boolean` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `venue` | `character varying` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_entry_conferences_pkey`: `CREATE UNIQUE INDEX ca_entry_conferences_pkey ON public.ca_entry_conferences USING btree (id)`


#### Table: `ca_execution_reports` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `approval_level` | `integer` | YES | - | `-` |
| `caat_eligible` | `boolean` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `report_content` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_execution_reports_pkey`: `CREATE UNIQUE INDEX ca_execution_reports_pkey ON public.ca_execution_reports USING btree (id)`


#### Table: `ca_exit_conferences` (16 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `agenda_items` | `jsonb` | YES | - | `-` |
| `attendance_confirmed` | `boolean` | YES | - | `-` |
| `attendees` | `jsonb` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `discussion_notes` | `text` | YES | - | `-` |
| `scheduled_date` | `date` | NO | - | `-` |
| `scheduled_time` | `character varying` | YES | - | `-` |
| `signed_by_taxpayer` | `boolean` | YES | - | `-` |
| `signed_date` | `date` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `taxpayer_response_notes` | `text` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `venue` | `character varying` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_exit_conferences_pkey`: `CREATE UNIQUE INDEX ca_exit_conferences_pkey ON public.ca_exit_conferences USING btree (id)`


#### Table: `ca_multi_zone_allocations` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `audit_adjustment` | `numeric` | YES | - | `-` |
| `branch_code` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `net_payable` | `numeric` | YES | - | `-` |
| `period_covered` | `character varying` | YES | - | `-` |
| `tax_declared` | `numeric` | YES | - | `-` |
| `tax_type` | `character varying` | YES | - | `-` |
| `zone_name` | `character varying` | NO | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `notice_id` | `uuid` | YES | FK -> `ca_assessment_notices.id` | `-` |

**Indexes:**
- `ca_multi_zone_allocations_pkey`: `CREATE UNIQUE INDEX ca_multi_zone_allocations_pkey ON public.ca_multi_zone_allocations USING btree (id)`


#### Table: `ca_query_sheets` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `auditor_comments` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `due_date` | `timestamp with time zone` | YES | - | `-` |
| `question` | `character varying` | NO | - | `-` |
| `requested_information` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `supporting_context` | `character varying` | YES | - | `-` |
| `taxpayer_response` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_query_sheets_pkey`: `CREATE UNIQUE INDEX ca_query_sheets_pkey ON public.ca_query_sheets USING btree (id)`


#### Table: `ca_reconciliations` (17 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `auditor_notes` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `period_covered` | `character varying` | YES | - | `-` |
| `reconciliation_type` | `character varying` | NO | - | `-` |
| `sourceaamount` | `numeric` | NO | - | `-` |
| `sourcealabel` | `character varying` | NO | - | `-` |
| `sourcebamount` | `numeric` | NO | - | `-` |
| `sourceblabel` | `character varying` | NO | - | `-` |
| `sourcecamount` | `numeric` | YES | - | `-` |
| `sourceclabel` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `variance` | `numeric` | YES | - | `-` |
| `variance_pct` | `numeric` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_reconciliations_pkey`: `CREATE UNIQUE INDEX ca_reconciliations_pkey ON public.ca_reconciliations USING btree (id)`


#### Table: `ca_sampling_records` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `findings_summary` | `text` | YES | - | `-` |
| `population_size` | `integer` | YES | - | `-` |
| `sample_description` | `text` | YES | - | `-` |
| `sample_size` | `integer` | YES | - | `-` |
| `sampling_type` | `character varying` | NO | - | `-` |
| `selection_criteria` | `text` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `target_population` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_sampling_records_pkey`: `CREATE UNIQUE INDEX ca_sampling_records_pkey ON public.ca_sampling_records USING btree (id)`


#### Table: `ca_taxpayer_responses` (14 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `auditor_notes` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `document_urls` | `jsonb` | YES | - | `-` |
| `response_text` | `text` | NO | - | `-` |
| `response_type` | `character varying` | NO | - | `-` |
| `reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `reviewed_by` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `submitted_at` | `timestamp with time zone` | YES | - | `-` |
| `submitted_by` | `character varying` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `draft_report_id` | `uuid` | YES | FK -> `ca_draft_reports.id` | `-` |
| `notice_id` | `uuid` | YES | FK -> `ca_assessment_notices.id` | `-` |

**Indexes:**
- `ca_taxpayer_responses_pkey`: `CREATE UNIQUE INDEX ca_taxpayer_responses_pkey ON public.ca_taxpayer_responses USING btree (id)`


#### Table: `ca_third_party_matches` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `data_source` | `character varying` | NO | - | `-` |
| `declared_value` | `numeric` | YES | - | `-` |
| `discrepancy_notes` | `text` | YES | - | `-` |
| `match_status` | `character varying` | NO | - | `-` |
| `period_covered` | `character varying` | YES | - | `-` |
| `third_party_value` | `numeric` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `variance` | `numeric` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_third_party_matches_pkey`: `CREATE UNIQUE INDEX ca_third_party_matches_pkey ON public.ca_third_party_matches USING btree (id)`


#### Table: `ca_working_papers` (15 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `category` | `character varying` | NO | - | `-` |
| `conclusions` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `document_url` | `character varying` | YES | - | `-` |
| `paper_reference` | `character varying` | NO | - | `-` |
| `prepared_at` | `timestamp with time zone` | YES | - | `-` |
| `prepared_by` | `character varying` | YES | - | `-` |
| `reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `reviewed_by` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `title` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `work_performed` | `text` | NO | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `ca_working_papers_pkey`: `CREATE UNIQUE INDEX ca_working_papers_pkey ON public.ca_working_papers USING btree (id)`


### 03. Desk Audit Execution (da_*)

#### Table: `da_audit_procedures` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `conclusion` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `finding` | `text` | YES | - | `-` |
| `issue_identified` | `boolean` | YES | - | `-` |
| `observation` | `text` | YES | - | `-` |
| `procedure_description` | `text` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `da_audit_procedures_pkey`: `CREATE UNIQUE INDEX da_audit_procedures_pkey ON public.da_audit_procedures USING btree (id)`


#### Table: `da_case_snapshots` (4 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `last_saved_at` | `timestamp with time zone` | YES | - | `-` |
| `snapshot_data` | `text` | YES | - | `-` |

**Indexes:**
- `da_case_snapshots_pkey`: `CREATE UNIQUE INDEX da_case_snapshots_pkey ON public.da_case_snapshots USING btree (id)`
- `uk_dt4cbwo8mkin0evldwy9tor6t`: `CREATE UNIQUE INDEX uk_dt4cbwo8mkin0evldwy9tor6t ON public.da_case_snapshots USING btree (case_id)`


#### Table: `da_draft_reports` (14 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `escalated_to_comprehensive` | `boolean` | YES | - | `-` |
| `escalation_reason` | `text` | YES | - | `-` |
| `report_content` | `text` | NO | - | `-` |
| `reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `reviewed_by` | `character varying` | YES | - | `-` |
| `significant_issues_identified` | `boolean` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `submitted_at` | `timestamp with time zone` | YES | - | `-` |
| `team_leader_comments` | `text` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `da_draft_reports_pkey`: `CREATE UNIQUE INDEX da_draft_reports_pkey ON public.da_draft_reports USING btree (id)`


#### Table: `da_evidence` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `document_name` | `character varying` | NO | - | `-` |
| `document_source` | `character varying` | NO | - | `-` |
| `document_url` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `uploaded_at` | `timestamp with time zone` | YES | - | `-` |
| `uploaded_by` | `character varying` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `da_evidence_pkey`: `CREATE UNIQUE INDEX da_evidence_pkey ON public.da_evidence USING btree (id)`


#### Table: `da_findings` (25 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `audit_area` | `character varying` | YES | - | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `auditor_analysis` | `text` | YES | - | `-` |
| `cause` | `text` | YES | - | `-` |
| `conclusion` | `text` | YES | - | `-` |
| `condition` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `criteria` | `text` | YES | - | `-` |
| `description` | `text` | YES | - | `-` |
| `effect` | `text` | YES | - | `-` |
| `finding_reference` | `character varying` | YES | - | `-` |
| `interest_amount` | `double precision` | YES | - | `-` |
| `is_significant` | `boolean` | YES | - | `-` |
| `penalty_amount` | `double precision` | YES | - | `-` |
| `penalty_rate` | `double precision` | YES | - | `-` |
| `recommendation` | `text` | YES | - | `-` |
| `related_procedure_id` | `character varying` | YES | - | `-` |
| `related_query_id` | `character varying` | YES | - | `-` |
| `related_working_paper_id` | `character varying` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `title` | `text` | YES | - | `-` |
| `total_tax_impact` | `double precision` | YES | - | `-` |
| `under_declared_amount` | `double precision` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `da_findings_pkey`: `CREATE UNIQUE INDEX da_findings_pkey ON public.da_findings USING btree (id)`


#### Table: `da_queries` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `due_date` | `character varying` | YES | - | `-` |
| `question` | `text` | YES | - | `-` |
| `reference` | `character varying` | YES | - | `-` |
| `resolution_notes` | `text` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `statutory_basis` | `text` | YES | - | `-` |
| `subject` | `character varying` | YES | - | `-` |
| `taxpayer_response` | `text` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `da_queries_pkey`: `CREATE UNIQUE INDEX da_queries_pkey ON public.da_queries USING btree (id)`


#### Table: `da_working_papers` (14 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `category` | `character varying` | YES | - | `-` |
| `conclusions` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `paper_date` | `character varying` | YES | - | `-` |
| `prepared_by` | `character varying` | YES | - | `-` |
| `reference` | `character varying` | YES | - | `-` |
| `related_finding_id` | `character varying` | YES | - | `-` |
| `related_procedure_id` | `character varying` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `title` | `text` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `work_performed` | `text` | YES | - | `-` |

**Indexes:**
- `da_working_papers_pkey`: `CREATE UNIQUE INDEX da_working_papers_pkey ON public.da_working_papers USING btree (id)`


### 04. Transfer Pricing & Issue Audit Execution (tp_*, issue_*)

#### Table: `issue_audit_details` (24 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `current_phase` | `character varying` | YES | - | `-` |
| `decision_date` | `timestamp with time zone` | YES | - | `-` |
| `director_comments` | `text` | YES | - | `-` |
| `evidence_data_json` | `text` | YES | - | `-` |
| `field_visit_findings_json` | `text` | YES | - | `-` |
| `field_visit_required` | `boolean` | YES | - | `-` |
| `follow_up_decision` | `character varying` | YES | - | `-` |
| `identified_issue` | `character varying` | YES | - | `-` |
| `notification_date` | `timestamp with time zone` | YES | - | `-` |
| `notification_recipient_channel` | `character varying` | YES | - | `-` |
| `notification_required` | `boolean` | YES | - | `-` |
| `notification_sent` | `boolean` | YES | - | `-` |
| `process_owner_comments` | `text` | YES | - | `-` |
| `referral_reference_number` | `character varying` | YES | - | `-` |
| `report_status` | `character varying` | YES | - | `-` |
| `report_summary` | `text` | YES | - | `-` |
| `report_title` | `character varying` | YES | - | `-` |
| `report_version` | `integer` | YES | - | `-` |
| `selection_data_json` | `text` | YES | - | `-` |
| `selection_rationale` | `text` | YES | - | `-` |
| `team_leader_comments` | `text` | YES | - | `-` |
| `total_adjusted_amount` | `double precision` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `issue_audit_details_pkey`: `CREATE UNIQUE INDEX issue_audit_details_pkey ON public.issue_audit_details USING btree (id)`
- `uk_j799ip695vf7f2xrht7u837vw`: `CREATE UNIQUE INDEX uk_j799ip695vf7f2xrht7u837vw ON public.issue_audit_details USING btree (audit_case_id)`


#### Table: `tp_analysis_data` (20 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `arms_length_analysis` | `jsonb` | YES | - | `-` |
| `arms_length_range_max` | `numeric` | YES | - | `-` |
| `arms_length_range_min` | `numeric` | YES | - | `-` |
| `audit_case_id` | `uuid` | YES | FK -> `ap_audit_cases.id` | `-` |
| `benchmark_comparisons` | `jsonb` | YES | - | `-` |
| `cost_expense_selections` | `jsonb` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `cross_border_assessments` | `jsonb` | YES | - | `-` |
| `customs_valuation_matches` | `jsonb` | YES | - | `-` |
| `method_selection` | `jsonb` | YES | - | `-` |
| `ratio_analyses` | `jsonb` | YES | - | `-` |
| `selected_tp_method` | `character varying` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `taxpayer_actual_result` | `numeric` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `updated_by` | `character varying` | YES | - | `-` |
| `variance_amount` | `numeric` | YES | - | `-` |
| `variance_percentage` | `numeric` | YES | - | `-` |

**Indexes:**
- `tp_analysis_data_pkey`: `CREATE UNIQUE INDEX tp_analysis_data_pkey ON public.tp_analysis_data USING btree (id)`


#### Table: `tp_audit_action_history` (14 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `action_sequence` | `integer` | NO | - | `nextval('tp_audit_action_history_action_seque` |
| `action_type` | `character varying` | NO | - | `-` |
| `action_phase` | `character varying` | YES | - | `-` |
| `actor_id` | `character varying` | NO | - | `-` |
| `actor_role` | `character varying` | YES | - | `-` |
| `summary` | `text` | NO | - | `-` |
| `detail` | `jsonb` | YES | - | `-` |
| `before_status` | `character varying` | YES | - | `-` |
| `after_status` | `character varying` | YES | - | `-` |
| `reference_id` | `uuid` | YES | - | `-` |
| `reference_type` | `character varying` | YES | - | `-` |
| `action_timestamp` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_tp_tah_actor`: `CREATE INDEX idx_tp_tah_actor ON public.tp_audit_action_history USING btree (actor_id)`
- `idx_tp_tah_case`: `CREATE INDEX idx_tp_tah_case ON public.tp_audit_action_history USING btree (audit_case_id)`
- `idx_tp_tah_phase`: `CREATE INDEX idx_tp_tah_phase ON public.tp_audit_action_history USING btree (action_phase)`
- `idx_tp_tah_timestamp`: `CREATE INDEX idx_tp_tah_timestamp ON public.tp_audit_action_history USING btree (action_timestamp DESC)`
- `tp_audit_action_history_pkey`: `CREATE UNIQUE INDEX tp_audit_action_history_pkey ON public.tp_audit_action_history USING btree (id)`


#### Table: `tp_audit_notice` (22 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `action_plan_details` | `text` | YES | - | `-` |
| `assessed_principal_tax` | `numeric` | YES | - | `-` |
| `audit_case_id` | `uuid` | YES | FK -> `ap_audit_cases.id` | `-` |
| `audit_period` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `delivery_method` | `character varying` | YES | - | `-` |
| `delivery_status` | `character varying` | YES | - | `-` |
| `delivery_timestamp` | `timestamp with time zone` | YES | - | `-` |
| `interest` | `numeric` | YES | - | `-` |
| `issue_date` | `date` | YES | - | `-` |
| `issues_summary` | `text` | YES | - | `-` |
| `notice_reference_number` | `character varying` | YES | - | `-` |
| `penalties` | `numeric` | YES | - | `-` |
| `proposed_adjustments_summary` | `text` | YES | - | `-` |
| `response_deadline` | `date` | YES | - | `-` |
| `returned_reason` | `text` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `taxpayer_name` | `character varying` | YES | - | `-` |
| `tin` | `character varying` | YES | - | `-` |
| `total_assessment_amount` | `numeric` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `tp_audit_notice_pkey`: `CREATE UNIQUE INDEX tp_audit_notice_pkey ON public.tp_audit_notice USING btree (id)`
- `uk_5vcld26yudhj3hxtgclissvic`: `CREATE UNIQUE INDEX uk_5vcld26yudhj3hxtgclissvic ON public.tp_audit_notice USING btree (notice_reference_number)`


#### Table: `tp_audit_plan` (15 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `objective` | `text` | YES | - | `-` |
| `scope` | `text` | YES | - | `-` |
| `materiality_details` | `jsonb` | YES | - | `-` |
| `industry_research` | `jsonb` | YES | - | `-` |
| `sampling_method` | `jsonb` | YES | - | `-` |
| `planned_procedures` | `jsonb` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `approved_by` | `character varying` | YES | - | `-` |
| `approved_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `created_by` | `character varying` | YES | - | `-` |
| `updated_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_tp_audit_plan_case`: `CREATE INDEX idx_tp_audit_plan_case ON public.tp_audit_plan USING btree (audit_case_id)`
- `tp_audit_plan_pkey`: `CREATE UNIQUE INDEX tp_audit_plan_pkey ON public.tp_audit_plan USING btree (id)`


#### Table: `tp_audit_report` (19 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `audit_background` | `text` | YES | - | `-` |
| `audit_case_id` | `uuid` | YES | FK -> `ap_audit_cases.id` | `-` |
| `author_id` | `character varying` | YES | - | `-` |
| `authorized_official_review` | `jsonb` | YES | - | `-` |
| `compliance_assessment` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `executive_summary` | `text` | YES | - | `-` |
| `exit_conference` | `jsonb` | YES | - | `-` |
| `findings_and_conclusions` | `text` | YES | - | `-` |
| `issues_analyzed` | `jsonb` | YES | - | `-` |
| `procedures_performed` | `text` | YES | - | `-` |
| `process_owner_review` | `jsonb` | YES | - | `-` |
| `scope` | `text` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `taxpayer_response` | `jsonb` | YES | - | `-` |
| `team_leader_review` | `jsonb` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `integer` | NO | - | `-` |

**Indexes:**
- `tp_audit_report_pkey`: `CREATE UNIQUE INDEX tp_audit_report_pkey ON public.tp_audit_report USING btree (id)`


#### Table: `tp_competitor_price_uploads` (16 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `upload_reference` | `character varying` | NO | - | `-` |
| `product_name` | `character varying` | NO | - | `-` |
| `product_hs_code` | `character varying` | YES | - | `-` |
| `competitor_name` | `character varying` | NO | - | `-` |
| `competitor_tin` | `character varying` | YES | - | `-` |
| `import_price` | `numeric` | NO | - | `-` |
| `currency` | `character varying` | NO | - | `'USD'::character varying` |
| `price_date` | `date` | NO | - | `-` |
| `source` | `character varying` | NO | - | `'MANUAL'::character varying` |
| `data_source_ref` | `character varying` | YES | - | `-` |
| `uploaded_by` | `character varying` | NO | - | `-` |
| `upload_notes` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_tp_cpu_case`: `CREATE INDEX idx_tp_cpu_case ON public.tp_competitor_price_uploads USING btree (audit_case_id)`
- `idx_tp_cpu_hs_code`: `CREATE INDEX idx_tp_cpu_hs_code ON public.tp_competitor_price_uploads USING btree (product_hs_code)`
- `idx_tp_cpu_price_date`: `CREATE INDEX idx_tp_cpu_price_date ON public.tp_competitor_price_uploads USING btree (price_date)`
- `tp_competitor_price_uploads_pkey`: `CREATE UNIQUE INDEX tp_competitor_price_uploads_pkey ON public.tp_competitor_price_uploads USING btree (id)`
- `tp_competitor_price_uploads_upload_reference_key`: `CREATE UNIQUE INDEX tp_competitor_price_uploads_upload_reference_key ON public.tp_competitor_price_uploads USING btree (upload_reference)`


#### Table: `tp_exit_conference` (26 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `conference_reference` | `character varying` | NO | - | `-` |
| `proposed_date` | `timestamp with time zone` | YES | - | `-` |
| `confirmed_date` | `timestamp with time zone` | YES | - | `-` |
| `venue` | `character varying` | NO | - | `'MoR Tax Office — Interview Room'::character ` |
| `agenda_template` | `character varying` | YES | - | `'STD_TP_EXIT'::character varying` |
| `taxpayer_contact` | `character varying` | YES | - | `-` |
| `scheduling_status` | `character varying` | NO | - | `'PROPOSED'::character varying` |
| `taxpayer_rescheduled_to` | `timestamp with time zone` | YES | - | `-` |
| `reschedule_reason` | `text` | YES | - | `-` |
| `reschedule_approved` | `boolean` | YES | - | `-` |
| `notification_sent` | `boolean` | YES | - | `false` |
| `notification_sent_at` | `timestamp with time zone` | YES | - | `-` |
| `notification_channel` | `character varying` | YES | - | `-` |
| `meeting_held_at` | `timestamp with time zone` | YES | - | `-` |
| `auditor_notes` | `text` | YES | - | `-` |
| `taxpayer_observations` | `text` | YES | - | `-` |
| `agreed_adjustments` | `jsonb` | YES | - | `-` |
| `audio_record_ref` | `character varying` | YES | - | `-` |
| `taxpayer_signed` | `boolean` | YES | - | `false` |
| `taxpayer_signed_at` | `timestamp with time zone` | YES | - | `-` |
| `taxpayer_signature_ref` | `character varying` | YES | - | `-` |
| `created_by` | `character varying` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `tp_exit_conference_audit_case_id_key`: `CREATE UNIQUE INDEX tp_exit_conference_audit_case_id_key ON public.tp_exit_conference USING btree (audit_case_id)`
- `tp_exit_conference_conference_reference_key`: `CREATE UNIQUE INDEX tp_exit_conference_conference_reference_key ON public.tp_exit_conference USING btree (conference_reference)`
- `tp_exit_conference_pkey`: `CREATE UNIQUE INDEX tp_exit_conference_pkey ON public.tp_exit_conference USING btree (id)`


#### Table: `tp_external_price_match` (19 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `match_reference` | `character varying` | NO | - | `-` |
| `product_hs_code` | `character varying` | YES | - | `-` |
| `product_name` | `character varying` | YES | - | `-` |
| `taxpayer_import_price` | `numeric` | NO | - | `-` |
| `market_price_min` | `numeric` | YES | - | `-` |
| `market_price_max` | `numeric` | YES | - | `-` |
| `market_price_median` | `numeric` | YES | - | `-` |
| `price_variance_amount` | `numeric` | YES | - | `-` |
| `price_variance_pct` | `numeric` | YES | - | `-` |
| `discrepancy_flag` | `boolean` | NO | - | `false` |
| `discrepancy_threshold` | `numeric` | YES | - | `5.00` |
| `validation_status` | `character varying` | NO | - | `'PENDING'::character varying` |
| `auditor_validation_notes` | `text` | YES | - | `-` |
| `validated_by` | `character varying` | YES | - | `-` |
| `validated_at` | `timestamp with time zone` | YES | - | `-` |
| `generated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `generated_by` | `character varying` | NO | - | `-` |

**Indexes:**
- `idx_tp_epm_case`: `CREATE INDEX idx_tp_epm_case ON public.tp_external_price_match USING btree (audit_case_id)`
- `tp_external_price_match_match_reference_key`: `CREATE UNIQUE INDEX tp_external_price_match_match_reference_key ON public.tp_external_price_match USING btree (match_reference)`
- `tp_external_price_match_pkey`: `CREATE UNIQUE INDEX tp_external_price_match_pkey ON public.tp_external_price_match USING btree (id)`


#### Table: `tp_field_work_data` (16 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `accounting_findings` | `jsonb` | YES | - | `-` |
| `accounting_methods` | `text` | YES | - | `-` |
| `audit_case_id` | `uuid` | YES | FK -> `ap_audit_cases.id` | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `fact_statement` | `jsonb` | YES | - | `-` |
| `fact_statement_status` | `character varying` | YES | - | `-` |
| `fact_statement_version` | `integer` | YES | - | `-` |
| `information_requests` | `jsonb` | YES | - | `-` |
| `sample_selections` | `jsonb` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `structured_discussions` | `jsonb` | YES | - | `-` |
| `transaction_trails` | `jsonb` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `updated_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `tp_field_work_data_pkey`: `CREATE UNIQUE INDEX tp_field_work_data_pkey ON public.tp_field_work_data USING btree (id)`


#### Table: `tp_information_request_log` (22 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `request_reference` | `character varying` | NO | - | `-` |
| `request_type` | `character varying` | NO | - | `-` |
| `subject` | `character varying` | NO | - | `-` |
| `description` | `text` | NO | - | `-` |
| `documents_requested` | `ARRAY` | YES | - | `-` |
| `deadline_date` | `date` | YES | - | `-` |
| `status` | `character varying` | NO | - | `'DRAFT'::character varying` |
| `submitted_by` | `character varying` | NO | - | `-` |
| `submitted_at` | `timestamp with time zone` | YES | - | `-` |
| `approved_by` | `character varying` | YES | - | `-` |
| `approved_at` | `timestamp with time zone` | YES | - | `-` |
| `approval_comments` | `text` | YES | - | `-` |
| `taxpayer_response` | `text` | YES | - | `-` |
| `evidence_uploaded` | `boolean` | YES | - | `false` |
| `evidence_file_refs` | `ARRAY` | YES | - | `-` |
| `response_received_at` | `timestamp with time zone` | YES | - | `-` |
| `is_overdue` | `boolean` | YES | - | `false` |
| `overdue_flagged_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_tp_idrl_case`: `CREATE INDEX idx_tp_idrl_case ON public.tp_information_request_log USING btree (audit_case_id)`
- `idx_tp_idrl_deadline`: `CREATE INDEX idx_tp_idrl_deadline ON public.tp_information_request_log USING btree (deadline_date) WHERE ((status)::text <> 'CLOSED'::text)`
- `idx_tp_idrl_status`: `CREATE INDEX idx_tp_idrl_status ON public.tp_information_request_log USING btree (status)`
- `tp_information_request_log_pkey`: `CREATE UNIQUE INDEX tp_information_request_log_pkey ON public.tp_information_request_log USING btree (id)`
- `tp_information_request_log_request_reference_key`: `CREATE UNIQUE INDEX tp_information_request_log_request_reference_key ON public.tp_information_request_log USING btree (request_reference)`


#### Table: `tp_management_report_snapshot` (8 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `report_type` | `character varying` | NO | - | `-` |
| `report_period` | `character varying` | NO | - | `-` |
| `tax_center_id` | `character varying` | YES | - | `-` |
| `report_data` | `jsonb` | NO | - | `-` |
| `generated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `generated_by` | `character varying` | NO | - | `-` |
| `is_current` | `boolean` | YES | - | `true` |

**Indexes:**
- `idx_tp_mrs_current`: `CREATE INDEX idx_tp_mrs_current ON public.tp_management_report_snapshot USING btree (is_current) WHERE (is_current = true)`
- `idx_tp_mrs_type_period`: `CREATE INDEX idx_tp_mrs_type_period ON public.tp_management_report_snapshot USING btree (report_type, report_period)`
- `tp_management_report_snapshot_pkey`: `CREATE UNIQUE INDEX tp_management_report_snapshot_pkey ON public.tp_management_report_snapshot USING btree (id)`


#### Table: `tp_objection` (18 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `adjusted_assessment_amount` | `numeric` | YES | - | `-` |
| `audit_case_id` | `uuid` | YES | FK -> `ap_audit_cases.id` | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `disputed_tp_analysis_sections` | `text` | YES | - | `-` |
| `factual_explanation` | `text` | YES | - | `-` |
| `legal_arguments` | `text` | YES | - | `-` |
| `notice_id` | `uuid` | YES | - | `-` |
| `notice_provision_referenced` | `text` | YES | - | `-` |
| `objection_date` | `timestamp with time zone` | YES | - | `-` |
| `review_comments` | `text` | YES | - | `-` |
| `review_result` | `character varying` | YES | - | `-` |
| `reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `reviewer_id` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `supporting_evidence_refs` | `jsonb` | YES | - | `-` |
| `taxpayer_id` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `tp_objection_pkey`: `CREATE UNIQUE INDEX tp_objection_pkey ON public.tp_objection USING btree (id)`


#### Table: `tp_phase_gates` (15 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `phase_id` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `'DRAFT'::character varying` |
| `sub_steps_completed` | `jsonb` | YES | - | `'[]'::jsonb` |
| `sub_step_data` | `jsonb` | YES | - | `'{}'::jsonb` |
| `submitted_at` | `timestamp with time zone` | YES | - | `-` |
| `submitted_by` | `character varying` | YES | - | `-` |
| `reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `reviewed_by` | `character varying` | YES | - | `-` |
| `reviewer_role` | `character varying` | YES | - | `-` |
| `review_decision` | `character varying` | YES | - | `-` |
| `review_comments` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_tp_phase_gates_case`: `CREATE INDEX idx_tp_phase_gates_case ON public.tp_phase_gates USING btree (audit_case_id)`
- `idx_tp_phase_gates_status`: `CREATE INDEX idx_tp_phase_gates_status ON public.tp_phase_gates USING btree (status)`
- `tp_phase_gates_pkey`: `CREATE UNIQUE INDEX tp_phase_gates_pkey ON public.tp_phase_gates USING btree (id)`
- `uk_tp_phase_gates_case_phase`: `CREATE UNIQUE INDEX uk_tp_phase_gates_case_phase ON public.tp_phase_gates USING btree (audit_case_id, phase_id)`


#### Table: `tp_planning_meeting` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `agenda` | `text` | YES | - | `-` |
| `audit_case_id` | `uuid` | YES | FK -> `ap_audit_cases.id` | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `decision` | `character varying` | YES | - | `-` |
| `decision_timestamp` | `timestamp with time zone` | YES | - | `-` |
| `discussion_notes` | `text` | YES | - | `-` |
| `participants` | `jsonb` | YES | - | `-` |
| `recorded_by` | `character varying` | YES | - | `-` |
| `scheduled_date` | `timestamp with time zone` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `tp_planning_meeting_pkey`: `CREATE UNIQUE INDEX tp_planning_meeting_pkey ON public.tp_planning_meeting USING btree (id)`


#### Table: `tp_risk_assessment` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `version` | `integer` | NO | - | `1` |
| `risk_level` | `character varying` | YES | - | `-` |
| `assessment_status` | `character varying` | NO | - | `-` |
| `risk_details` | `jsonb` | YES | - | `-` |
| `comments` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `created_by` | `character varying` | YES | - | `-` |
| `updated_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_tp_risk_assessment_case`: `CREATE INDEX idx_tp_risk_assessment_case ON public.tp_risk_assessment USING btree (audit_case_id)`
- `tp_risk_assessment_pkey`: `CREATE UNIQUE INDEX tp_risk_assessment_pkey ON public.tp_risk_assessment USING btree (id)`


#### Table: `tp_working_hypothesis` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `hypothesis_description` | `text` | YES | - | `-` |
| `identified_issue` | `text` | YES | - | `-` |
| `economic_rationale` | `text` | YES | - | `-` |
| `revenue_at_risk` | `numeric` | YES | - | `-` |
| `currency` | `character varying` | YES | - | `'ETB'::character varying` |
| `status` | `character varying` | NO | - | `-` |
| `calculation_details` | `jsonb` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | YES | - | `CURRENT_TIMESTAMP` |
| `created_by` | `character varying` | YES | - | `-` |
| `updated_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_tp_working_hypothesis_case`: `CREATE INDEX idx_tp_working_hypothesis_case ON public.tp_working_hypothesis USING btree (audit_case_id)`
- `tp_working_hypothesis_pkey`: `CREATE UNIQUE INDEX tp_working_hypothesis_pkey ON public.tp_working_hypothesis USING btree (id)`


### 05. Audit Quality Assurance & ISO-19011 Review (qa_*)

#### Table: `qa_action_plans` (25 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `approved_at` | `timestamp with time zone` | YES | - | `-` |
| `checklist_items` | `jsonb` | NO | - | `-` |
| `comments` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `decision` | `character varying` | YES | - | `-` |
| `decision_comments` | `text` | YES | - | `-` |
| `objectives` | `text` | NO | - | `-` |
| `plan_title` | `character varying` | YES | - | `-` |
| `qa_review_case_id` | `uuid` | YES | - | `-` |
| `returned_count` | `integer` | NO | - | `-` |
| `review_methodology` | `text` | YES | - | `-` |
| `review_scope` | `text` | NO | - | `-` |
| `reviewed_at` | `timestamp with time zone` | YES | - | `-` |
| `reviewed_by` | `character varying` | YES | - | `-` |
| `reviewer` | `character varying` | YES | - | `-` |
| `risk_focus_areas` | `jsonb` | NO | - | `-` |
| `sample_criteria` | `text` | YES | - | `-` |
| `sample_size` | `integer` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `submitted_at` | `timestamp with time zone` | YES | - | `-` |
| `submitted_by` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | NO | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `qa_action_plans_pkey`: `CREATE UNIQUE INDEX qa_action_plans_pkey ON public.qa_action_plans USING btree (id)`


#### Table: `qa_deficiencies` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `corrective_action_mandate` | `character varying` | YES | - | `-` |
| `dimension_id` | `character varying` | YES | - | `-` |
| `dimension_title` | `character varying` | YES | - | `-` |
| `finding_description` | `character varying` | YES | - | `-` |
| `qa_case_id` | `uuid` | YES | - | `-` |
| `severity` | `character varying` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `statutory_breach` | `character varying` | YES | - | `-` |
| `title` | `character varying` | YES | - | `-` |

**Indexes:**
- `qa_deficiencies_pkey`: `CREATE UNIQUE INDEX qa_deficiencies_pkey ON public.qa_deficiencies USING btree (id)`


#### Table: `qa_exit_conferences` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `auditor_comments` | `text` | YES | - | `-` |
| `minutes` | `text` | YES | - | `-` |
| `qa_case_id` | `uuid` | NO | - | `-` |
| `resolved_flag` | `boolean` | YES | - | `-` |
| `scheduled_date` | `character varying` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |

**Indexes:**
- `qa_exit_conferences_pkey`: `CREATE UNIQUE INDEX qa_exit_conferences_pkey ON public.qa_exit_conferences USING btree (id)`


#### Table: `qa_follow_up_action` (20 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `action_kind` | `character varying` | NO | - | `-` |
| `audit_case_id` | `uuid` | YES | - | `-` |
| `completed_at` | `timestamp with time zone` | YES | - | `-` |
| `completed_by` | `character varying` | YES | - | `-` |
| `completion_evidence` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `decided_at` | `timestamp with time zone` | NO | - | `-` |
| `decided_by` | `character varying` | YES | - | `-` |
| `due_date` | `date` | YES | - | `-` |
| `narrative` | `text` | YES | - | `-` |
| `qa_review_case_id` | `uuid` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `target_actor_id` | `character varying` | YES | - | `-` |
| `target_actor_name` | `character varying` | YES | - | `-` |
| `target_department` | `character varying` | YES | - | `-` |
| `title` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `verified_at` | `timestamp with time zone` | YES | - | `-` |
| `verified_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_qa_followup_kind`: `CREATE INDEX idx_qa_followup_kind ON public.qa_follow_up_action USING btree (action_kind)`
- `idx_qa_followup_review`: `CREATE INDEX idx_qa_followup_review ON public.qa_follow_up_action USING btree (qa_review_case_id)`
- `idx_qa_followup_status`: `CREATE INDEX idx_qa_followup_status ON public.qa_follow_up_action USING btree (status)`
- `qa_follow_up_action_pkey`: `CREATE UNIQUE INDEX qa_follow_up_action_pkey ON public.qa_follow_up_action USING btree (id)`


#### Table: `qa_follow_ups` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `corrective_action_proof` | `text` | YES | - | `-` |
| `deficiency_id` | `uuid` | NO | - | `-` |
| `due_date` | `character varying` | YES | - | `-` |
| `original_auditor_id` | `character varying` | YES | - | `-` |
| `qa_case_id` | `uuid` | NO | - | `-` |
| `status` | `character varying` | YES | - | `-` |

**Indexes:**
- `qa_follow_ups_pkey`: `CREATE UNIQUE INDEX qa_follow_ups_pkey ON public.qa_follow_ups USING btree (id)`


#### Table: `qa_recommendations` (26 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `assigned_to` | `character varying` | YES | - | `-` |
| `auditor_response` | `text` | YES | - | `-` |
| `corrective_action_mandate` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | YES | - | `-` |
| `created_by` | `character varying` | YES | - | `-` |
| `deadline` | `timestamp with time zone` | YES | - | `-` |
| `dimension_code` | `character varying` | YES | - | `-` |
| `dimension_title` | `character varying` | YES | - | `-` |
| `display_order` | `integer` | NO | - | `-` |
| `due_date` | `date` | YES | - | `-` |
| `evidence_of_correction` | `text` | YES | - | `-` |
| `finding_description` | `text` | YES | - | `-` |
| `qa_review_case_id` | `uuid` | YES | - | `-` |
| `recommendation` | `text` | NO | - | `-` |
| `remediation_evidence_ref` | `character varying` | YES | - | `-` |
| `resolved_at` | `timestamp with time zone` | YES | - | `-` |
| `responded_at` | `timestamp with time zone` | YES | - | `-` |
| `responded_by` | `character varying` | YES | - | `-` |
| `severity` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `statutory_breach` | `text` | YES | - | `-` |
| `title` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | NO | - | `-` |
| `audit_case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |

**Indexes:**
- `qa_recommendations_pkey`: `CREATE UNIQUE INDEX qa_recommendations_pkey ON public.qa_recommendations USING btree (id)`


#### Table: `qa_reports` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `critical_deficiencies_count` | `integer` | YES | - | `-` |
| `executive_summary` | `text` | YES | - | `-` |
| `generated_date` | `character varying` | YES | - | `-` |
| `key_strengths` | `text` | YES | - | `-` |
| `major_deficiencies_count` | `integer` | YES | - | `-` |
| `mandatory_corrective_actions` | `text` | YES | - | `-` |
| `overall_rating` | `character varying` | YES | - | `-` |
| `qa_case_id` | `uuid` | YES | - | `-` |
| `recommendations_for_director` | `text` | YES | - | `-` |
| `systemic_vulnerabilities` | `text` | YES | - | `-` |
| `total_weighted_score` | `integer` | YES | - | `-` |

**Indexes:**
- `qa_reports_pkey`: `CREATE UNIQUE INDEX qa_reports_pkey ON public.qa_reports USING btree (id)`


#### Table: `qa_review_case` (51 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `assigned_at` | `timestamp with time zone` | YES | - | `-` |
| `assigned_by` | `character varying` | YES | - | `-` |
| `assigned_qa_officer` | `character varying` | YES | - | `-` |
| `assigned_qa_officer_id` | `character varying` | YES | - | `-` |
| `audit_case_id` | `uuid` | NO | - | `-` |
| `audit_case_number` | `character varying` | YES | - | `-` |
| `audit_team_leader` | `character varying` | YES | - | `-` |
| `audit_team_leader_id` | `character varying` | YES | - | `-` |
| `audit_team_responded_by` | `character varying` | YES | - | `-` |
| `audit_team_response_date` | `timestamp with time zone` | YES | - | `-` |
| `audit_team_response_notes` | `text` | YES | - | `-` |
| `audit_type` | `character varying` | YES | - | `-` |
| `case_number` | `character varying` | NO | - | `-` |
| `closed_at` | `timestamp with time zone` | YES | - | `-` |
| `closure_checked_at` | `timestamp with time zone` | YES | - | `-` |
| `closure_checked_by` | `character varying` | YES | - | `-` |
| `closure_note` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `created_by` | `character varying` | NO | - | `-` |
| `current_step` | `character varying` | YES | - | `-` |
| `director_executive_comment` | `text` | YES | - | `-` |
| `director_executive_decision_date` | `timestamp with time zone` | YES | - | `-` |
| `director_statutory_order` | `character varying` | YES | - | `-` |
| `due_date` | `date` | YES | - | `-` |
| `last_saved_at` | `timestamp with time zone` | YES | - | `-` |
| `lead_auditor` | `character varying` | YES | - | `-` |
| `lead_auditor_id` | `character varying` | YES | - | `-` |
| `overall_score` | `integer` | NO | - | `-` |
| `qa_director_id` | `character varying` | YES | - | `-` |
| `qa_team_leader` | `character varying` | YES | - | `-` |
| `qa_team_leader_comment` | `text` | YES | - | `-` |
| `qa_team_leader_decision_date` | `timestamp with time zone` | YES | - | `-` |
| `qa_team_leader_id` | `character varying` | YES | - | `-` |
| `rating` | `character varying` | YES | - | `-` |
| `recommendations_addressed` | `boolean` | YES | - | `-` |
| `sampling_rule_code` | `character varying` | YES | - | `-` |
| `sampling_score` | `integer` | YES | - | `-` |
| `sampling_strategy` | `character varying` | NO | - | `-` |
| `selected_by` | `character varying` | YES | - | `-` |
| `selection_date` | `date` | NO | - | `-` |
| `selection_reason` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `status_reason` | `text` | YES | - | `-` |
| `tax_period` | `character varying` | YES | - | `-` |
| `taxpayer_name` | `character varying` | YES | - | `-` |
| `tin` | `character varying` | YES | - | `-` |
| `total_tax_assessment` | `numeric` | NO | - | `-` |
| `trade_name` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | NO | - | `-` |

**Indexes:**
- `idx_qa_review_case_audit_case`: `CREATE INDEX idx_qa_review_case_audit_case ON public.qa_review_case USING btree (audit_case_id)`
- `idx_qa_review_case_officer`: `CREATE INDEX idx_qa_review_case_officer ON public.qa_review_case USING btree (assigned_qa_officer_id)`
- `idx_qa_review_case_status`: `CREATE INDEX idx_qa_review_case_status ON public.qa_review_case USING btree (status)`
- `idx_qa_review_case_tl`: `CREATE INDEX idx_qa_review_case_tl ON public.qa_review_case USING btree (qa_team_leader_id)`
- `qa_review_case_pkey`: `CREATE UNIQUE INDEX qa_review_case_pkey ON public.qa_review_case USING btree (id)`
- `uk_pf9ttv9p14axvik927smjudda`: `CREATE UNIQUE INDEX uk_pf9ttv9p14axvik927smjudda ON public.qa_review_case USING btree (case_number)`


#### Table: `qa_review_dimension` (16 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `category` | `character varying` | NO | - | `-` |
| `checkpoints` | `jsonb` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `dimension_code` | `character varying` | NO | - | `-` |
| `display_order` | `integer` | NO | - | `-` |
| `qa_review_case_id` | `uuid` | NO | - | `-` |
| `reviewer_notes` | `text` | YES | - | `-` |
| `score` | `integer` | NO | - | `-` |
| `scored_at` | `timestamp with time zone` | YES | - | `-` |
| `scored_by` | `character varying` | YES | - | `-` |
| `standards_reference` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `title` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `weight` | `integer` | NO | - | `-` |

**Indexes:**
- `qa_review_dimension_pkey`: `CREATE UNIQUE INDEX qa_review_dimension_pkey ON public.qa_review_dimension USING btree (id)`


#### Table: `qa_review_event` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `actor_id` | `character varying` | YES | - | `-` |
| `actor_name` | `character varying` | YES | - | `-` |
| `actor_role` | `character varying` | YES | - | `-` |
| `event_type` | `character varying` | NO | - | `-` |
| `from_status` | `character varying` | YES | - | `-` |
| `metadata` | `jsonb` | YES | - | `-` |
| `notes` | `text` | YES | - | `-` |
| `occurred_at` | `timestamp with time zone` | NO | - | `-` |
| `qa_review_case_id` | `uuid` | NO | - | `-` |
| `step_code` | `character varying` | YES | - | `-` |
| `to_status` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_qa_review_event_review`: `CREATE INDEX idx_qa_review_event_review ON public.qa_review_event USING btree (qa_review_case_id)`
- `idx_qa_review_event_step`: `CREATE INDEX idx_qa_review_event_step ON public.qa_review_event USING btree (step_code)`
- `idx_qa_review_event_time`: `CREATE INDEX idx_qa_review_event_time ON public.qa_review_event USING btree (occurred_at DESC)`
- `qa_review_event_pkey`: `CREATE UNIQUE INDEX qa_review_event_pkey ON public.qa_review_event USING btree (id)`


#### Table: `qa_review_report` (30 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `adjusted_at` | `timestamp with time zone` | YES | - | `-` |
| `adjusted_by` | `character varying` | YES | - | `-` |
| `adjustment_reason` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `critical_deficiencies_count` | `integer` | NO | - | `-` |
| `director_approval_signature` | `character varying` | YES | - | `-` |
| `executive_summary` | `text` | YES | - | `-` |
| `generated_by` | `character varying` | YES | - | `-` |
| `generated_date` | `date` | NO | - | `-` |
| `key_strengths` | `jsonb` | NO | - | `-` |
| `kind` | `character varying` | NO | - | `-` |
| `lead_qa_officer_signature` | `character varying` | YES | - | `-` |
| `major_deficiencies_count` | `integer` | NO | - | `-` |
| `mandatory_corrective_actions` | `jsonb` | NO | - | `-` |
| `overall_rating` | `character varying` | YES | - | `-` |
| `qa_review_case_id` | `uuid` | NO | - | `-` |
| `qa_team_leader_signature` | `character varying` | YES | - | `-` |
| `recommendations_for_director` | `text` | YES | - | `-` |
| `report_reference` | `character varying` | YES | - | `-` |
| `return_reason` | `text` | YES | - | `-` |
| `signed_date` | `timestamp with time zone` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `systemic_vulnerabilities` | `jsonb` | NO | - | `-` |
| `tl_comment` | `text` | YES | - | `-` |
| `tl_decided_by` | `character varying` | YES | - | `-` |
| `tl_decision_at` | `timestamp with time zone` | YES | - | `-` |
| `total_weighted_score` | `integer` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | NO | - | `-` |

**Indexes:**
- `idx_qa_report_kind`: `CREATE INDEX idx_qa_report_kind ON public.qa_review_report USING btree (qa_review_case_id, kind)`
- `idx_qa_report_review`: `CREATE INDEX idx_qa_report_review ON public.qa_review_report USING btree (qa_review_case_id)`
- `qa_review_report_pkey`: `CREATE UNIQUE INDEX qa_review_report_pkey ON public.qa_review_report USING btree (id)`


#### Table: `qa_sampling_rule` (15 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `is_active` | `boolean` | NO | - | `-` |
| `audit_types` | `jsonb` | NO | - | `-` |
| `code` | `character varying` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `created_by` | `character varying` | NO | - | `-` |
| `effective_from` | `date` | YES | - | `-` |
| `effective_to` | `date` | YES | - | `-` |
| `exposure_threshold` | `numeric` | YES | - | `-` |
| `max_sample_size` | `integer` | YES | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `sample_percentage` | `numeric` | YES | - | `-` |
| `selection_reason` | `character varying` | NO | - | `-` |
| `strategy` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `qa_sampling_rule_pkey`: `CREATE UNIQUE INDEX qa_sampling_rule_pkey ON public.qa_sampling_rule USING btree (id)`
- `uk_3jqigm331qi33ccuqvfhrf9qq`: `CREATE UNIQUE INDEX uk_3jqigm331qi33ccuqvfhrf9qq ON public.qa_sampling_rule USING btree (code)`


#### Table: `qa_sampling_run` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `created_count` | `integer` | NO | - | `-` |
| `dry_run` | `boolean` | NO | - | `-` |
| `evaluated_count` | `integer` | NO | - | `-` |
| `notes` | `text` | YES | - | `-` |
| `rule_code` | `character varying` | YES | - | `-` |
| `selected_count` | `integer` | NO | - | `-` |
| `strategy` | `character varying` | YES | - | `-` |
| `triggered_by` | `character varying` | YES | - | `-` |
| `window_from` | `date` | YES | - | `-` |
| `window_to` | `date` | YES | - | `-` |

**Indexes:**
- `idx_qa_sampling_run_created`: `CREATE INDEX idx_qa_sampling_run_created ON public.qa_sampling_run USING btree (created_at DESC)`
- `qa_sampling_run_pkey`: `CREATE UNIQUE INDEX qa_sampling_run_pkey ON public.qa_sampling_run USING btree (id)`


### 06. Joint Audit Committee (JAC), Teams & Handoff (t_*, committees, handoff)

#### Table: `case_assignments` (16 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `region_id` | `uuid` | YES | - | `-` |
| `tax_center_id` | `uuid` | YES | - | `-` |
| `audit_type_id` | `uuid` | YES | - | `-` |
| `committee_id` | `uuid` | YES | - | `-` |
| `team_id` | `uuid` | YES | - | `-` |
| `team_leader_id` | `uuid` | YES | - | `-` |
| `assigned_user_id` | `uuid` | YES | - | `-` |
| `assigned_by` | `character varying` | NO | - | `-` |
| `assignment_type` | `character varying` | NO | - | `-` |
| `assignment_reason` | `text` | YES | - | `-` |
| `effective_from` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `effective_to` | `timestamp with time zone` | YES | - | `-` |
| `status` | `character varying` | NO | - | `'ACTIVE'::character varying` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `case_assignments_pkey`: `CREATE UNIQUE INDEX case_assignments_pkey ON public.case_assignments USING btree (id)`
- `idx_ca_assigned_user`: `CREATE INDEX idx_ca_assigned_user ON public.case_assignments USING btree (assigned_user_id)`
- `idx_ca_case`: `CREATE INDEX idx_ca_case ON public.case_assignments USING btree (case_id)`


#### Table: `case_auditor_assignment` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `auditor_id` | `uuid` | NO | FK -> `users.id` | `-` |
| `assigned_by_id` | `uuid` | NO | FK -> `users.id` | `-` |
| `assigned_date` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `status` | `character varying` | NO | - | `'ACTIVE'::character varying` |
| `superseded_at` | `timestamp with time zone` | YES | - | `-` |
| `superseded_by_id` | `uuid` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `case_auditor_assignment_pkey`: `CREATE UNIQUE INDEX case_auditor_assignment_pkey ON public.case_auditor_assignment USING btree (id)`
- `idx_auditor_assign_auditor`: `CREATE INDEX idx_auditor_assign_auditor ON public.case_auditor_assignment USING btree (auditor_id)`
- `idx_auditor_assign_case`: `CREATE INDEX idx_auditor_assign_case ON public.case_auditor_assignment USING btree (case_id)`
- `idx_auditor_assign_status`: `CREATE INDEX idx_auditor_assign_status ON public.case_auditor_assignment USING btree (status)`
- `uk_case_auditor_active`: `CREATE UNIQUE INDEX uk_case_auditor_active ON public.case_auditor_assignment USING btree (case_id) WHERE ((status)::text = 'ACTIVE'::text)`


#### Table: `case_handoff` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `team_leader_id` | `uuid` | NO | FK -> `users.id` | `-` |
| `assigned_by_id` | `uuid` | NO | FK -> `users.id` | `-` |
| `assignment_date` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `assignment_reason` | `text` | YES | - | `-` |
| `status` | `character varying` | NO | - | `'ACTIVE'::character varying` |
| `cancelled_at` | `timestamp with time zone` | YES | - | `-` |
| `cancelled_by_id` | `uuid` | YES | - | `-` |
| `cancellation_reason` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `case_handoff_case_id_key`: `CREATE UNIQUE INDEX case_handoff_case_id_key ON public.case_handoff USING btree (case_id)`
- `case_handoff_pkey`: `CREATE UNIQUE INDEX case_handoff_pkey ON public.case_handoff USING btree (id)`
- `idx_case_handoff_case_id`: `CREATE INDEX idx_case_handoff_case_id ON public.case_handoff USING btree (case_id)`
- `idx_case_handoff_created_at`: `CREATE INDEX idx_case_handoff_created_at ON public.case_handoff USING btree (created_at)`
- `idx_case_handoff_status`: `CREATE INDEX idx_case_handoff_status ON public.case_handoff USING btree (status)`
- `idx_case_handoff_team_leader`: `CREATE INDEX idx_case_handoff_team_leader ON public.case_handoff USING btree (team_leader_id)`


#### Table: `committees` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `tax_center_id` | `uuid` | NO | FK -> `tax_centers.id` | `-` |
| `audit_type_id` | `uuid` | NO | FK -> `audit_types.id` | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `committees_code_key`: `CREATE UNIQUE INDEX committees_code_key ON public.committees USING btree (code)`
- `committees_pkey`: `CREATE UNIQUE INDEX committees_pkey ON public.committees USING btree (id)`
- `idx_committees_at`: `CREATE INDEX idx_committees_at ON public.committees USING btree (audit_type_id)`
- `idx_committees_tc`: `CREATE INDEX idx_committees_tc ON public.committees USING btree (tax_center_id)`


#### Table: `t_advisory_voting` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `voting_id` | `uuid` | NO | PK | `-` |
| `consensus_threshold` | `integer` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `voting_closed_at` | `timestamp with time zone` | YES | - | `-` |
| `voting_started_at` | `timestamp with time zone` | NO | - | `-` |
| `case_id` | `uuid` | NO | FK -> `t_committee_case.case_id` | `-` |

**Indexes:**
- `t_advisory_voting_pkey`: `CREATE UNIQUE INDEX t_advisory_voting_pkey ON public.t_advisory_voting USING btree (voting_id)`
- `uk_e2v4n8bhqejfgppf1hyxa8xm8`: `CREATE UNIQUE INDEX uk_e2v4n8bhqejfgppf1hyxa8xm8 ON public.t_advisory_voting USING btree (case_id)`


#### Table: `t_audit_document` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `content_type` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `file_name` | `character varying` | NO | - | `-` |
| `file_size` | `bigint` | YES | - | `-` |
| `file_url` | `text` | YES | - | `-` |
| `rejection_reason` | `text` | YES | - | `-` |
| `request_id` | `uuid` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `uploaded_by` | `character varying` | NO | - | `-` |
| `verified_at` | `timestamp with time zone` | YES | - | `-` |
| `verified_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_audit_doc_case_id`: `CREATE INDEX idx_audit_doc_case_id ON public.t_audit_document USING btree (case_id)`
- `idx_audit_doc_request_id`: `CREATE INDEX idx_audit_doc_request_id ON public.t_audit_document USING btree (request_id)`
- `t_audit_document_pkey`: `CREATE UNIQUE INDEX t_audit_document_pkey ON public.t_audit_document USING btree (id)`


#### Table: `t_audit_finding` (24 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `approved_at` | `timestamp with time zone` | YES | - | `-` |
| `approved_by` | `character varying` | YES | - | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `category` | `character varying` | YES | - | `-` |
| `concluded_at` | `timestamp with time zone` | YES | - | `-` |
| `concluded_by` | `character varying` | YES | - | `-` |
| `conclusion` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `created_by` | `character varying` | NO | - | `-` |
| `description` | `text` | YES | - | `-` |
| `final_amount` | `numeric` | YES | - | `-` |
| `responded_at` | `timestamp with time zone` | YES | - | `-` |
| `response_type` | `character varying` | YES | - | `-` |
| `revision_notes` | `text` | YES | - | `-` |
| `severity` | `character varying` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `taxpayer_evidence` | `text` | YES | - | `-` |
| `taxpayer_explanation` | `text` | YES | - | `-` |
| `title` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `interest_amount` | `numeric` | YES | - | `-` |
| `penalty_amount` | `numeric` | YES | - | `-` |
| `principal_amount` | `numeric` | YES | - | `-` |

**Indexes:**
- `idx_finding_case_id`: `CREATE INDEX idx_finding_case_id ON public.t_audit_finding USING btree (case_id)`
- `t_audit_finding_pkey`: `CREATE UNIQUE INDEX t_audit_finding_pkey ON public.t_audit_finding USING btree (id)`


#### Table: `t_audit_plan_record` (18 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `approved_at` | `timestamp with time zone` | YES | - | `-` |
| `approved_by` | `character varying` | YES | - | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `methodology` | `text` | YES | - | `-` |
| `objectives` | `text` | YES | - | `-` |
| `resource_plan` | `text` | YES | - | `-` |
| `review_comments` | `text` | YES | - | `-` |
| `review_timestamp` | `timestamp with time zone` | YES | - | `-` |
| `reviewed_by` | `character varying` | YES | - | `-` |
| `revision_notes` | `text` | YES | - | `-` |
| `scope` | `text` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `submitted_by` | `character varying` | NO | - | `-` |
| `team_lead_id` | `character varying` | YES | - | `-` |
| `timeline` | `text` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `idx_audit_plan_case_id`: `CREATE INDEX idx_audit_plan_case_id ON public.t_audit_plan_record USING btree (case_id)`
- `idx_plan_created_at_desc`: `CREATE INDEX idx_plan_created_at_desc ON public.t_audit_plan_record USING btree (created_at DESC)`
- `idx_plan_team_lead_status`: `CREATE INDEX idx_plan_team_lead_status ON public.t_audit_plan_record USING btree (team_lead_id, status)`
- `t_audit_plan_record_pkey`: `CREATE UNIQUE INDEX t_audit_plan_record_pkey ON public.t_audit_plan_record USING btree (id)`


#### Table: `t_audit_team` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `team_id` | `uuid` | NO | PK | `-` |
| `active` | `boolean` | NO | - | `-` |
| `auditor_ids` | `text` | NO | - | `-` |
| `auditor_names` | `text` | YES | - | `-` |
| `capacity` | `integer` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `current_cases` | `integer` | NO | - | `-` |
| `description` | `character varying` | YES | - | `-` |
| `team_leader_id` | `uuid` | NO | - | `-` |
| `team_leader_name` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | NO | - | `-` |
| `version` | `bigint` | YES | - | `-` |
| `tax_center` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_audit_team_tax_center`: `CREATE INDEX idx_audit_team_tax_center ON public.t_audit_team USING btree (tax_center)`
- `t_audit_team_pkey`: `CREATE UNIQUE INDEX t_audit_team_pkey ON public.t_audit_team USING btree (team_id)`


#### Table: `t_auditor` (14 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `auditor_id` | `uuid` | NO | PK | `-` |
| `active` | `boolean` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `current_cases` | `integer` | YES | - | `-` |
| `email` | `character varying` | YES | - | `-` |
| `expertise` | `character varying` | NO | - | `-` |
| `first_name` | `character varying` | NO | - | `-` |
| `last_name` | `character varying` | NO | - | `-` |
| `max_cases` | `integer` | YES | - | `-` |
| `phone` | `character varying` | YES | - | `-` |
| `seniority` | `character varying` | NO | - | `-` |
| `tax_center` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `years_of_experience` | `integer` | NO | - | `-` |

**Indexes:**
- `t_auditor_pkey`: `CREATE UNIQUE INDEX t_auditor_pkey ON public.t_auditor USING btree (auditor_id)`


#### Table: `t_auditor_nomination` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `nomination_id` | `uuid` | NO | PK | `-` |
| `justification` | `text` | NO | - | `-` |
| `nominated_at` | `timestamp with time zone` | NO | - | `-` |
| `nominated_auditor_id` | `uuid` | NO | - | `-` |
| `nominating_member_id` | `uuid` | NO | - | `-` |
| `role` | `character varying` | NO | - | `-` |
| `selected` | `boolean` | NO | - | `-` |
| `version` | `bigint` | YES | - | `-` |
| `case_id` | `uuid` | NO | FK -> `t_committee_case.case_id` | `-` |

**Indexes:**
- `t_auditor_nomination_pkey`: `CREATE UNIQUE INDEX t_auditor_nomination_pkey ON public.t_auditor_nomination USING btree (nomination_id)`


#### Table: `t_caat_anomaly` (22 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `analysis_type` | `character varying` | NO | - | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `description` | `text` | NO | - | `-` |
| `details` | `text` | YES | - | `-` |
| `run_at` | `timestamp with time zone` | NO | - | `-` |
| `run_by` | `character varying` | NO | - | `-` |
| `severity` | `character varying` | YES | - | `-` |
| `validated_at` | `timestamp with time zone` | YES | - | `-` |
| `validated_by` | `character varying` | YES | - | `-` |
| `validation_notes` | `text` | YES | - | `-` |
| `validation_status` | `character varying` | YES | - | `-` |
| `amended_amount` | `numeric` | YES | - | `-` |
| `data_source` | `character varying` | YES | - | `-` |
| `evidence_ref` | `character varying` | YES | - | `-` |
| `expected_amount` | `numeric` | YES | - | `-` |
| `original_amount` | `numeric` | YES | - | `-` |
| `reported_amount` | `numeric` | YES | - | `-` |
| `rule_code` | `character varying` | YES | - | `-` |
| `tax_period` | `character varying` | YES | - | `-` |
| `tax_type` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_caat_case_id`: `CREATE INDEX idx_caat_case_id ON public.t_caat_anomaly USING btree (case_id)`
- `t_caat_anomaly_pkey`: `CREATE UNIQUE INDEX t_caat_anomaly_pkey ON public.t_caat_anomaly USING btree (id)`


#### Table: `t_case_status_history` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `history_id` | `uuid` | NO | PK | `-` |
| `new_status` | `character varying` | NO | - | `-` |
| `old_status` | `character varying` | YES | - | `-` |
| `transition_reason` | `text` | YES | - | `-` |
| `transitioned_at` | `timestamp with time zone` | NO | - | `-` |
| `transitioned_by` | `uuid` | NO | - | `-` |
| `case_id` | `uuid` | NO | FK -> `t_committee_case.case_id` | `-` |

**Indexes:**
- `t_case_status_history_pkey`: `CREATE UNIQUE INDEX t_case_status_history_pkey ON public.t_case_status_history USING btree (history_id)`


#### Table: `t_committee_audit_log` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `log_id` | `uuid` | NO | PK | `-` |
| `action_hash` | `character varying` | YES | - | `-` |
| `action_reason` | `text` | YES | - | `-` |
| `action_timestamp` | `timestamp with time zone` | NO | - | `-` |
| `action_type` | `character varying` | NO | - | `-` |
| `actor_id` | `uuid` | NO | - | `-` |
| `after_state` | `jsonb` | YES | - | `-` |
| `before_state` | `jsonb` | YES | - | `-` |
| `ip_address` | `character varying` | YES | - | `-` |
| `case_id` | `uuid` | NO | FK -> `t_committee_case.case_id` | `-` |

**Indexes:**
- `t_committee_audit_log_pkey`: `CREATE UNIQUE INDEX t_committee_audit_log_pkey ON public.t_committee_audit_log USING btree (log_id)`


#### Table: `t_committee_case` (41 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `case_id` | `uuid` | NO | PK | `-` |
| `address` | `character varying` | YES | - | `-` |
| `assessment_score` | `character varying` | YES | - | `-` |
| `business_type` | `character varying` | YES | - | `-` |
| `case_code` | `character varying` | YES | - | `-` |
| `chairperson_id` | `uuid` | YES | - | `-` |
| `city` | `character varying` | YES | - | `-` |
| `committee_deadline` | `timestamp with time zone` | NO | - | `-` |
| `compliance_issues` | `jsonb` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `created_by` | `uuid` | NO | - | `-` |
| `created_date` | `timestamp with time zone` | NO | - | `-` |
| `current_owner_id` | `uuid` | YES | - | `-` |
| `decision` | `character varying` | YES | - | `-` |
| `decision_date` | `timestamp with time zone` | YES | - | `-` |
| `decision_reason` | `text` | YES | - | `-` |
| `description` | `text` | YES | - | `-` |
| `extended_deadline` | `timestamp with time zone` | YES | - | `-` |
| `extension_count` | `integer` | YES | - | `-` |
| `handoff_date` | `timestamp with time zone` | YES | - | `-` |
| `handoff_record_id` | `uuid` | YES | - | `-` |
| `industry` | `character varying` | YES | - | `-` |
| `original_case_id` | `uuid` | NO | - | `-` |
| `ownership_acquired_at` | `timestamp with time zone` | YES | - | `-` |
| `region` | `character varying` | YES | - | `-` |
| `representatives` | `jsonb` | YES | - | `-` |
| `risk_criteria` | `jsonb` | YES | - | `-` |
| `risk_indicators` | `jsonb` | YES | - | `-` |
| `risk_priority` | `character varying` | YES | - | `-` |
| `risk_score` | `integer` | NO | - | `-` |
| `segment` | `character varying` | YES | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `tax_center` | `character varying` | YES | - | `-` |
| `tax_id_number` | `character varying` | NO | - | `-` |
| `taxpayer_id` | `uuid` | NO | - | `-` |
| `taxpayer_name` | `character varying` | NO | - | `-` |
| `team_lead_id` | `uuid` | YES | - | `-` |
| `total_amount` | `numeric` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | YES | - | `-` |
| `team_id` | `uuid` | YES | - | `-` |

**Indexes:**
- `t_committee_case_pkey`: `CREATE UNIQUE INDEX t_committee_case_pkey ON public.t_committee_case USING btree (case_id)`
- `uk_h084hr3h56q66t4d1li1hvdwb`: `CREATE UNIQUE INDEX uk_h084hr3h56q66t4d1li1hvdwb ON public.t_committee_case USING btree (case_code)`
- `uk_o2dy57581jyxqqbsd3asvfr49`: `CREATE UNIQUE INDEX uk_o2dy57581jyxqqbsd3asvfr49 ON public.t_committee_case USING btree (tax_id_number)`


#### Table: `t_committee_session` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `session_id` | `uuid` | NO | PK | `-` |
| `actual_end_time` | `timestamp with time zone` | YES | - | `-` |
| `actual_start_time` | `timestamp with time zone` | YES | - | `-` |
| `agenda` | `text` | YES | - | `-` |
| `chairperson_id` | `uuid` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `location` | `character varying` | YES | - | `-` |
| `scheduled_date` | `timestamp with time zone` | NO | - | `-` |
| `session_minutes` | `text` | YES | - | `-` |
| `session_name` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | YES | - | `-` |

**Indexes:**
- `t_committee_session_pkey`: `CREATE UNIQUE INDEX t_committee_session_pkey ON public.t_committee_session USING btree (session_id)`


#### Table: `t_committee_vote` (8 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `vote_id` | `uuid` | NO | PK | `-` |
| `member_id` | `uuid` | NO | - | `-` |
| `reasoning` | `text` | YES | - | `-` |
| `version` | `bigint` | YES | - | `-` |
| `vote_option` | `character varying` | NO | - | `-` |
| `voted_at` | `timestamp with time zone` | NO | - | `-` |
| `case_id` | `uuid` | NO | FK -> `t_committee_case.case_id` | `-` |
| `voting_id` | `uuid` | NO | FK -> `t_advisory_voting.voting_id` | `-` |

**Indexes:**
- `t_committee_vote_pkey`: `CREATE UNIQUE INDEX t_committee_vote_pkey ON public.t_committee_vote USING btree (vote_id)`
- `uk67yls9sryytxod3vbb97rkgrm`: `CREATE UNIQUE INDEX uk67yls9sryytxod3vbb97rkgrm ON public.t_committee_vote USING btree (case_id, member_id)`


#### Table: `t_conference_record` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `agenda` | `text` | YES | - | `-` |
| `approved_at` | `timestamp with time zone` | YES | - | `-` |
| `approved_by` | `character varying` | YES | - | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `location` | `character varying` | YES | - | `-` |
| `minutes` | `text` | YES | - | `-` |
| `minutes_recorded_by` | `character varying` | YES | - | `-` |
| `scheduled_by` | `character varying` | YES | - | `-` |
| `scheduled_date` | `timestamp with time zone` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `idx_conference_case_id`: `CREATE INDEX idx_conference_case_id ON public.t_conference_record USING btree (case_id)`
- `t_conference_record_pkey`: `CREATE UNIQUE INDEX t_conference_record_pkey ON public.t_conference_record USING btree (id)`


#### Table: `t_document_request_record` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `description` | `text` | YES | - | `-` |
| `document_type` | `character varying` | NO | - | `-` |
| `due_date` | `timestamp with time zone` | YES | - | `-` |
| `follow_up_count` | `integer` | YES | - | `-` |
| `follow_up_message` | `text` | YES | - | `-` |
| `requested_by` | `character varying` | NO | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `idx_doc_req_case_id`: `CREATE INDEX idx_doc_req_case_id ON public.t_document_request_record USING btree (case_id)`
- `t_document_request_record_pkey`: `CREATE UNIQUE INDEX t_document_request_record_pkey ON public.t_document_request_record USING btree (id)`


#### Table: `t_handoff_record` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `handoff_id` | `uuid` | NO | PK | `-` |
| `case_code` | `character varying` | NO | - | `-` |
| `committee_summary` | `text` | YES | - | `-` |
| `created_by` | `uuid` | NO | - | `-` |
| `decision` | `character varying` | NO | - | `-` |
| `delivered_at` | `timestamp with time zone` | YES | - | `-` |
| `execution_case_id` | `uuid` | YES | - | `-` |
| `handoff_date` | `timestamp with time zone` | NO | - | `-` |
| `key_findings` | `text` | YES | - | `-` |
| `team_lead_id` | `uuid` | NO | - | `-` |
| `version` | `bigint` | YES | - | `-` |
| `case_id` | `uuid` | NO | FK -> `t_committee_case.case_id` | `-` |

**Indexes:**
- `t_handoff_record_pkey`: `CREATE UNIQUE INDEX t_handoff_record_pkey ON public.t_handoff_record USING btree (handoff_id)`
- `uk_hev8odsttn97q7t2pa9snin1r`: `CREATE UNIQUE INDEX uk_hev8odsttn97q7t2pa9snin1r ON public.t_handoff_record USING btree (case_code)`


#### Table: `t_handoff_team_member` (5 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `member_id` | `uuid` | NO | PK | `-` |
| `assigned_at` | `timestamp with time zone` | NO | - | `-` |
| `auditor_id` | `uuid` | NO | - | `-` |
| `role` | `character varying` | YES | - | `-` |
| `handoff_id` | `uuid` | NO | FK -> `t_handoff_record.handoff_id` | `-` |

**Indexes:**
- `t_handoff_team_member_pkey`: `CREATE UNIQUE INDEX t_handoff_team_member_pkey ON public.t_handoff_team_member USING btree (member_id)`


#### Table: `t_research_attachment` (8 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `attachment_id` | `uuid` | NO | PK | `-` |
| `file_name` | `character varying` | NO | - | `-` |
| `file_path` | `character varying` | NO | - | `-` |
| `file_size` | `bigint` | YES | - | `-` |
| `file_type` | `character varying` | YES | - | `-` |
| `uploaded_at` | `timestamp with time zone` | NO | - | `-` |
| `uploaded_by` | `uuid` | NO | - | `-` |
| `note_id` | `uuid` | NO | FK -> `t_research_note.note_id` | `-` |

**Indexes:**
- `t_research_attachment_pkey`: `CREATE UNIQUE INDEX t_research_attachment_pkey ON public.t_research_attachment USING btree (attachment_id)`


#### Table: `t_research_comment` (8 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `comment_id` | `uuid` | NO | PK | `-` |
| `author_id` | `uuid` | NO | - | `-` |
| `author_name` | `character varying` | YES | - | `-` |
| `content` | `text` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `version` | `bigint` | YES | - | `-` |
| `note_id` | `uuid` | NO | FK -> `t_research_note.note_id` | `-` |
| `replied_to_comment_id` | `uuid` | YES | FK -> `t_research_comment.comment_id` | `-` |

**Indexes:**
- `t_research_comment_pkey`: `CREATE UNIQUE INDEX t_research_comment_pkey ON public.t_research_comment USING btree (comment_id)`


#### Table: `t_research_note` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `note_id` | `uuid` | NO | PK | `-` |
| `author_id` | `uuid` | NO | - | `-` |
| `author_name` | `character varying` | YES | - | `-` |
| `category` | `character varying` | NO | - | `-` |
| `content` | `text` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |
| `version` | `bigint` | YES | - | `-` |
| `case_id` | `uuid` | NO | FK -> `t_committee_case.case_id` | `-` |

**Indexes:**
- `t_research_note_pkey`: `CREATE UNIQUE INDEX t_research_note_pkey ON public.t_research_note USING btree (note_id)`


#### Table: `t_session_attendee` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `attendee_id` | `uuid` | NO | PK | `-` |
| `attendance_status` | `character varying` | YES | - | `-` |
| `attended_at` | `timestamp with time zone` | YES | - | `-` |
| `confirmed_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `member_id` | `uuid` | NO | - | `-` |
| `session_id` | `uuid` | NO | FK -> `t_committee_session.session_id` | `-` |

**Indexes:**
- `t_session_attendee_pkey`: `CREATE UNIQUE INDEX t_session_attendee_pkey ON public.t_session_attendee USING btree (attendee_id)`


#### Table: `t_voting_tally` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `tally_id` | `uuid` | NO | PK | `-` |
| `approve_count` | `integer` | YES | - | `-` |
| `calculated_at` | `timestamp with time zone` | YES | - | `-` |
| `consensus_percentage` | `numeric` | YES | - | `-` |
| `more_info_count` | `integer` | YES | - | `-` |
| `reject_count` | `integer` | YES | - | `-` |
| `total_votes_cast` | `integer` | YES | - | `-` |
| `voting_outcome` | `character varying` | YES | - | `-` |
| `voting_id` | `uuid` | NO | FK -> `t_advisory_voting.voting_id` | `-` |

**Indexes:**
- `t_voting_tally_pkey`: `CREATE UNIQUE INDEX t_voting_tally_pkey ON public.t_voting_tally USING btree (tally_id)`
- `uk_2eap1h13gpm5vvuno5m32g7c7`: `CREATE UNIQUE INDEX uk_2eap1h13gpm5vvuno5m32g7c7 ON public.t_voting_tally USING btree (voting_id)`


#### Table: `t_working_paper` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `created_by` | `character varying` | NO | - | `-` |
| `description` | `text` | YES | - | `-` |
| `evidence_file_name` | `character varying` | YES | - | `-` |
| `evidence_file_url` | `text` | YES | - | `-` |
| `evidence_summary` | `text` | YES | - | `-` |
| `status` | `character varying` | YES | - | `-` |
| `title` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `idx_wp_case_id`: `CREATE INDEX idx_wp_case_id ON public.t_working_paper USING btree (case_id)`
- `t_working_paper_pkey`: `CREATE UNIQUE INDEX t_working_paper_pkey ON public.t_working_paper USING btree (id)`


#### Table: `team_members` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `team_id` | `uuid` | NO | PK, FK -> `teams.id` | `-` |
| `user_id` | `uuid` | NO | PK, FK -> `users.id` | `-` |
| `role_in_team` | `character varying` | NO | - | `'AUDITOR'::character varying` |
| `joined_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `left_at` | `timestamp with time zone` | YES | - | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `id` | `uuid` | YES | - | `gen_random_uuid()` |
| `team_leader_id` | `uuid` | YES | FK -> `users.id` | `-` |
| `auditor_id` | `uuid` | YES | FK -> `users.id` | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_team_members_active`: `CREATE INDEX idx_team_members_active ON public.team_members USING btree (team_leader_id) WHERE ((is_active = true) AND (left_at IS NULL))`
- `idx_team_members_auditor`: `CREATE INDEX idx_team_members_auditor ON public.team_members USING btree (auditor_id, team_leader_id)`
- `idx_team_members_team_leader`: `CREATE INDEX idx_team_members_team_leader ON public.team_members USING btree (team_leader_id, is_active, left_at)`
- `idx_team_members_user`: `CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id)`
- `team_members_pkey`: `CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (team_id, user_id)`
- `uk_team_membership`: `CREATE UNIQUE INDEX uk_team_membership ON public.team_members USING btree (team_leader_id, auditor_id)`


#### Table: `teams` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `team_type` | `character varying` | NO | - | `'TP_AUDIT'::character varying` |
| `org_unit_id` | `uuid` | NO | FK -> `organizational_units.id` | `-` |
| `team_leader_id` | `uuid` | YES | FK -> `users.id` | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_teams_leader`: `CREATE INDEX idx_teams_leader ON public.teams USING btree (team_leader_id)`
- `idx_teams_org_unit`: `CREATE INDEX idx_teams_org_unit ON public.teams USING btree (org_unit_id)`
- `teams_code_key`: `CREATE UNIQUE INDEX teams_code_key ON public.teams USING btree (code)`
- `teams_pkey`: `CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id)`


### 07. Identity, RBAC, Security & Organizational Hierarchy

#### Table: `audit_types` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `requires_committee` | `boolean` | NO | - | `false` |
| `initial_assignment_role` | `character varying` | NO | - | `'TEAM_LEADER'::character varying` |
| `is_active` | `boolean` | NO | - | `true` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `audit_types_code_key`: `CREATE UNIQUE INDEX audit_types_code_key ON public.audit_types USING btree (code)`
- `audit_types_pkey`: `CREATE UNIQUE INDEX audit_types_pkey ON public.audit_types USING btree (id)`
- `idx_audit_types_code`: `CREATE INDEX idx_audit_types_code ON public.audit_types USING btree (code)`


#### Table: `organizational_units` (8 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `unit_type` | `character varying` | NO | - | `-` |
| `parent_id` | `uuid` | YES | FK -> `organizational_units.id` | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_org_units_code`: `CREATE INDEX idx_org_units_code ON public.organizational_units USING btree (code)`
- `idx_org_units_parent`: `CREATE INDEX idx_org_units_parent ON public.organizational_units USING btree (parent_id)`
- `idx_org_units_type`: `CREATE INDEX idx_org_units_type ON public.organizational_units USING btree (unit_type)`
- `organizational_units_code_key`: `CREATE UNIQUE INDEX organizational_units_code_key ON public.organizational_units USING btree (code)`
- `organizational_units_pkey`: `CREATE UNIQUE INDEX organizational_units_pkey ON public.organizational_units USING btree (id)`


#### Table: `permissions` (5 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `description` | `text` | YES | - | `-` |
| `module` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `permissions_code_key`: `CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code)`
- `permissions_pkey`: `CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id)`


#### Table: `regions` (6 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_regions_code`: `CREATE INDEX idx_regions_code ON public.regions USING btree (code)`
- `regions_code_key`: `CREATE UNIQUE INDEX regions_code_key ON public.regions USING btree (code)`
- `regions_pkey`: `CREATE UNIQUE INDEX regions_pkey ON public.regions USING btree (id)`


#### Table: `role_permissions` (4 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `role_id` | `uuid` | NO | PK, FK -> `roles.id` | `-` |
| `permission_id` | `uuid` | NO | PK, FK -> `permissions.id` | `-` |
| `granted_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `granted_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `role_permissions_pkey`: `CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (role_id, permission_id)`


#### Table: `roles` (8 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `description` | `text` | YES | - | `-` |
| `is_system` | `boolean` | NO | - | `false` |
| `is_active` | `boolean` | NO | - | `true` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `roles_code_key`: `CREATE UNIQUE INDEX roles_code_key ON public.roles USING btree (code)`
- `roles_pkey`: `CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id)`


#### Table: `security_audit_log` (11 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `user_id` | `character varying` | YES | - | `-` |
| `username` | `character varying` | YES | - | `-` |
| `action` | `character varying` | NO | - | `-` |
| `resource_type` | `character varying` | YES | - | `-` |
| `resource_id` | `character varying` | YES | - | `-` |
| `ip_address` | `character varying` | YES | - | `-` |
| `user_agent` | `text` | YES | - | `-` |
| `outcome` | `character varying` | NO | - | `-` |
| `detail` | `jsonb` | YES | - | `-` |
| `logged_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_sec_log_action`: `CREATE INDEX idx_sec_log_action ON public.security_audit_log USING btree (action)`
- `idx_sec_log_outcome`: `CREATE INDEX idx_sec_log_outcome ON public.security_audit_log USING btree (outcome) WHERE ((outcome)::text = 'FAILURE'::text)`
- `idx_sec_log_time`: `CREATE INDEX idx_sec_log_time ON public.security_audit_log USING btree (logged_at DESC)`
- `idx_sec_log_user`: `CREATE INDEX idx_sec_log_user ON public.security_audit_log USING btree (user_id)`
- `security_audit_log_pkey`: `CREATE UNIQUE INDEX security_audit_log_pkey ON public.security_audit_log USING btree (id)`


#### Table: `t_user` (17 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `user_id` | `uuid` | NO | PK | `-` |
| `assigned_level` | `character varying` | NO | - | `-` |
| `assigned_location` | `character varying` | YES | - | `-` |
| `audit_type` | `character varying` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `-` |
| `email` | `character varying` | NO | - | `-` |
| `full_name` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `-` |
| `updated_at` | `timestamp with time zone` | NO | - | `-` |
| `user_type` | `character varying` | NO | - | `-` |
| `username` | `character varying` | NO | - | `-` |
| `failed_login_count` | `integer` | YES | - | `-` |
| `last_login_at` | `timestamp with time zone` | YES | - | `-` |
| `locked_until` | `timestamp with time zone` | YES | - | `-` |
| `must_change_password` | `boolean` | YES | - | `-` |
| `password_changed_at` | `timestamp with time zone` | YES | - | `-` |
| `password_hash` | `character varying` | YES | - | `-` |

**Indexes:**
- `t_user_pkey`: `CREATE UNIQUE INDEX t_user_pkey ON public.t_user USING btree (user_id)`
- `uk_i6qjjoe560mee5ajdg7v1o6mi`: `CREATE UNIQUE INDEX uk_i6qjjoe560mee5ajdg7v1o6mi ON public.t_user USING btree (email)`
- `uk_jhib4legehrm4yscx9t3lirqi`: `CREATE UNIQUE INDEX uk_jhib4legehrm4yscx9t3lirqi ON public.t_user USING btree (username)`


#### Table: `tax_centers` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `region_id` | `uuid` | NO | FK -> `regions.id` | `-` |
| `name` | `character varying` | NO | - | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_tax_centers_code`: `CREATE INDEX idx_tax_centers_code ON public.tax_centers USING btree (code)`
- `idx_tax_centers_region`: `CREATE INDEX idx_tax_centers_region ON public.tax_centers USING btree (region_id)`
- `tax_centers_code_key`: `CREATE UNIQUE INDEX tax_centers_code_key ON public.tax_centers USING btree (code)`
- `tax_centers_pkey`: `CREATE UNIQUE INDEX tax_centers_pkey ON public.tax_centers USING btree (id)`


#### Table: `user_organizational_assignments` (14 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | FK -> `users.id` | `-` |
| `region_id` | `uuid` | NO | FK -> `regions.id` | `-` |
| `tax_center_id` | `uuid` | NO | FK -> `tax_centers.id` | `-` |
| `audit_type_id` | `uuid` | YES | FK -> `audit_types.id` | `-` |
| `committee_id` | `uuid` | YES | FK -> `committees.id` | `-` |
| `team_id` | `uuid` | YES | - | `-` |
| `team_leader_id` | `uuid` | YES | - | `-` |
| `role_code` | `character varying` | NO | - | `-` |
| `status` | `character varying` | NO | - | `'ACTIVE'::character varying` |
| `effective_from` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `effective_to` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_uniq_active_user_tc`: `CREATE UNIQUE INDEX idx_uniq_active_user_tc ON public.user_organizational_assignments USING btree (user_id) WHERE ((status)::text = 'ACTIVE'::text)`
- `idx_uoa_tc`: `CREATE INDEX idx_uoa_tc ON public.user_organizational_assignments USING btree (tax_center_id)`
- `idx_uoa_user`: `CREATE INDEX idx_uoa_user ON public.user_organizational_assignments USING btree (user_id)`
- `user_organizational_assignments_pkey`: `CREATE UNIQUE INDEX user_organizational_assignments_pkey ON public.user_organizational_assignments USING btree (id)`


### 08. Workflow Engine, Notifications, SLA & Shared Infrastructure

#### Table: `flyway_schema_history` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `installed_rank` | `integer` | NO | PK | `-` |
| `version` | `character varying` | YES | - | `-` |
| `description` | `character varying` | NO | - | `-` |
| `type` | `character varying` | NO | - | `-` |
| `script` | `character varying` | NO | - | `-` |
| `checksum` | `integer` | YES | - | `-` |
| `installed_by` | `character varying` | NO | - | `-` |
| `installed_on` | `timestamp without time zone` | NO | - | `now()` |
| `execution_time` | `integer` | NO | - | `-` |
| `success` | `boolean` | NO | - | `-` |

**Indexes:**
- `flyway_schema_history_pk`: `CREATE UNIQUE INDEX flyway_schema_history_pk ON public.flyway_schema_history USING btree (installed_rank)`
- `flyway_schema_history_s_idx`: `CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success)`


#### Table: `notifications` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `recipient_user_id` | `character varying` | NO | - | `-` |
| `notification_type` | `character varying` | NO | - | `-` |
| `title` | `character varying` | NO | - | `-` |
| `body` | `text` | YES | - | `-` |
| `task_id` | `uuid` | YES | - | `-` |
| `case_id` | `uuid` | YES | - | `-` |
| `artifact_type` | `character varying` | YES | - | `-` |
| `artifact_id` | `uuid` | YES | - | `-` |
| `is_read` | `boolean` | NO | - | `false` |
| `read_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_notif_case`: `CREATE INDEX idx_notif_case ON public.notifications USING btree (case_id)`
- `idx_notif_recipient`: `CREATE INDEX idx_notif_recipient ON public.notifications USING btree (recipient_user_id, is_read, created_at DESC)`
- `idx_notif_unread`: `CREATE INDEX idx_notif_unread ON public.notifications USING btree (recipient_user_id) WHERE (is_read = false)`
- `notifications_pkey`: `CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)`


#### Table: `shared_audit_trail_entries` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `entity_type` | `character varying` | NO | - | `-` |
| `entity_id` | `uuid` | NO | - | `-` |
| `actor_id` | `character varying` | NO | - | `-` |
| `action` | `character varying` | NO | - | `-` |
| `reason` | `text` | YES | - | `-` |
| `state_before` | `jsonb` | YES | - | `-` |
| `state_after` | `jsonb` | YES | - | `-` |
| `occurred_at` | `timestamp with time zone` | NO | - | `now()` |

**Indexes:**
- `idx_audit_trail_actor`: `CREATE INDEX idx_audit_trail_actor ON public.shared_audit_trail_entries USING btree (actor_id)`
- `idx_audit_trail_entity`: `CREATE INDEX idx_audit_trail_entity ON public.shared_audit_trail_entries USING btree (entity_type, entity_id)`
- `idx_audit_trail_occurred_at`: `CREATE INDEX idx_audit_trail_occurred_at ON public.shared_audit_trail_entries USING btree (occurred_at)`
- `shared_audit_trail_entries_pkey`: `CREATE UNIQUE INDEX shared_audit_trail_entries_pkey ON public.shared_audit_trail_entries USING btree (id)`


#### Table: `shared_outbox_entries` (7 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `aggregate_type` | `character varying` | NO | - | `-` |
| `aggregate_id` | `uuid` | NO | - | `-` |
| `event_type` | `character varying` | NO | - | `-` |
| `payload` | `jsonb` | NO | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `now()` |
| `processed_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `idx_outbox_entries_processed`: `CREATE INDEX idx_outbox_entries_processed ON public.shared_outbox_entries USING btree (processed_at) WHERE (processed_at IS NULL)`
- `shared_outbox_entries_pkey`: `CREATE UNIQUE INDEX shared_outbox_entries_pkey ON public.shared_outbox_entries USING btree (id)`


#### Table: `sla_tracking` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `task_id` | `uuid` | NO | PK, FK -> `workflow_tasks.id` | `-` |
| `case_id` | `uuid` | NO | - | `-` |
| `assigned_role` | `character varying` | NO | - | `-` |
| `due_at` | `timestamp with time zone` | NO | - | `-` |
| `warning_sent` | `boolean` | NO | - | `false` |
| `warning_sent_at` | `timestamp with time zone` | YES | - | `-` |
| `escalation_sent` | `boolean` | NO | - | `false` |
| `escalation_sent_at` | `timestamp with time zone` | YES | - | `-` |
| `resolved_at` | `timestamp with time zone` | YES | - | `-` |

**Indexes:**
- `idx_sla_case`: `CREATE INDEX idx_sla_case ON public.sla_tracking USING btree (case_id)`
- `idx_sla_due`: `CREATE INDEX idx_sla_due ON public.sla_tracking USING btree (due_at) WHERE (resolved_at IS NULL)`
- `sla_tracking_pkey`: `CREATE UNIQUE INDEX sla_tracking_pkey ON public.sla_tracking USING btree (task_id)`


#### Table: `user_roles` (4 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `user_id` | `uuid` | NO | PK, FK -> `users.id` | `-` |
| `role_id` | `uuid` | NO | PK, FK -> `roles.id` | `-` |
| `assigned_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `assigned_by` | `character varying` | YES | - | `-` |

**Indexes:**
- `idx_user_roles_user`: `CREATE INDEX idx_user_roles_user ON public.user_roles USING btree (user_id)`
- `user_roles_pkey`: `CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id, role_id)`


#### Table: `user_sessions` (9 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | FK -> `users.id` | `-` |
| `refresh_token_hash` | `character varying` | NO | - | `-` |
| `ip_address` | `character varying` | YES | - | `-` |
| `user_agent` | `text` | YES | - | `-` |
| `issued_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `expires_at` | `timestamp with time zone` | NO | - | `-` |
| `revoked_at` | `timestamp with time zone` | YES | - | `-` |
| `is_active` | `boolean` | NO | - | `true` |

**Indexes:**
- `idx_sessions_active`: `CREATE INDEX idx_sessions_active ON public.user_sessions USING btree (is_active, expires_at)`
- `idx_sessions_token`: `CREATE INDEX idx_sessions_token ON public.user_sessions USING btree (refresh_token_hash)`
- `idx_sessions_user`: `CREATE INDEX idx_sessions_user ON public.user_sessions USING btree (user_id)`
- `user_sessions_pkey`: `CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id)`
- `user_sessions_refresh_token_hash_key`: `CREATE UNIQUE INDEX user_sessions_refresh_token_hash_key ON public.user_sessions USING btree (refresh_token_hash)`


#### Table: `users` (13 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `username` | `character varying` | NO | - | `-` |
| `email` | `character varying` | NO | - | `-` |
| `full_name` | `character varying` | NO | - | `-` |
| `keycloak_user_id` | `character varying` | YES | - | `-` |
| `employee_id` | `character varying` | YES | - | `-` |
| `org_unit_id` | `uuid` | YES | FK -> `organizational_units.id` | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `last_login_at` | `timestamp with time zone` | YES | - | `-` |
| `failed_login_count` | `integer` | NO | - | `0` |
| `locked_until` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `idx_users_email`: `CREATE INDEX idx_users_email ON public.users USING btree (email)`
- `idx_users_org_unit`: `CREATE INDEX idx_users_org_unit ON public.users USING btree (org_unit_id)`
- `idx_users_username`: `CREATE INDEX idx_users_username ON public.users USING btree (username)`
- `users_email_key`: `CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)`
- `users_keycloak_user_id_key`: `CREATE UNIQUE INDEX users_keycloak_user_id_key ON public.users USING btree (keycloak_user_id)`
- `users_pkey`: `CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)`
- `users_username_key`: `CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username)`


#### Table: `workflow_definitions` (10 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `code` | `character varying` | NO | - | `-` |
| `name` | `character varying` | NO | - | `-` |
| `audit_type` | `character varying` | NO | - | `'TRANSFER_PRICING'::character varying` |
| `artifact_type` | `character varying` | NO | - | `-` |
| `version` | `integer` | NO | - | `1` |
| `is_active` | `boolean` | NO | - | `true` |
| `description` | `text` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |

**Indexes:**
- `workflow_definitions_code_version_key`: `CREATE UNIQUE INDEX workflow_definitions_code_version_key ON public.workflow_definitions USING btree (code, version)`
- `workflow_definitions_pkey`: `CREATE UNIQUE INDEX workflow_definitions_pkey ON public.workflow_definitions USING btree (id)`


#### Table: `workflow_instances` (12 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `definition_id` | `uuid` | NO | FK -> `workflow_definitions.id` | `-` |
| `case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `artifact_id` | `uuid` | NO | - | `-` |
| `artifact_type` | `character varying` | NO | - | `-` |
| `current_step_id` | `uuid` | YES | - | `-` |
| `status` | `character varying` | NO | - | `'IN_PROGRESS'::character varying` |
| `initiated_by` | `character varying` | NO | - | `-` |
| `started_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `completed_at` | `timestamp with time zone` | YES | - | `-` |
| `current_step_number` | `integer` | YES | - | `-` |
| `version` | `integer` | YES | - | `0` |

**Indexes:**
- `idx_wi_artifact`: `CREATE INDEX idx_wi_artifact ON public.workflow_instances USING btree (artifact_id)`
- `idx_wi_case`: `CREATE INDEX idx_wi_case ON public.workflow_instances USING btree (case_id)`
- `idx_wi_status`: `CREATE INDEX idx_wi_status ON public.workflow_instances USING btree (status)`
- `workflow_instances_pkey`: `CREATE UNIQUE INDEX workflow_instances_pkey ON public.workflow_instances USING btree (id)`


#### Table: `workflow_steps` (18 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `definition_id` | `uuid` | NO | FK -> `workflow_definitions.id` | `-` |
| `step_order` | `integer` | NO | - | `-` |
| `step_name` | `character varying` | NO | - | `-` |
| `required_role` | `character varying` | NO | - | `-` |
| `approval_type` | `character varying` | NO | - | `'REQUIRED'::character varying` |
| `condition_type` | `character varying` | YES | - | `-` |
| `condition_value` | `character varying` | YES | - | `-` |
| `sla_hours` | `integer` | NO | - | `72` |
| `escalate_after_hours` | `integer` | NO | - | `96` |
| `escalate_to_role` | `character varying` | YES | - | `-` |
| `is_active` | `boolean` | NO | - | `true` |
| `description` | `character varying` | YES | - | `-` |
| `required_permission` | `character varying` | YES | - | `-` |
| `assigned_role` | `character varying` | NO | - | `-` |
| `can_reject` | `boolean` | NO | - | `-` |
| `can_return` | `boolean` | NO | - | `-` |
| `step_number` | `integer` | NO | - | `-` |

**Indexes:**
- `idx_ws_definition`: `CREATE INDEX idx_ws_definition ON public.workflow_steps USING btree (definition_id)`
- `workflow_steps_definition_id_step_order_key`: `CREATE UNIQUE INDEX workflow_steps_definition_id_step_order_key ON public.workflow_steps USING btree (definition_id, step_order)`
- `workflow_steps_pkey`: `CREATE UNIQUE INDEX workflow_steps_pkey ON public.workflow_steps USING btree (id)`


#### Table: `workflow_tasks` (23 columns)

| Column Name | Data Type | Nullable | Key / Reference | Default |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | PK | `gen_random_uuid()` |
| `instance_id` | `uuid` | NO | FK -> `workflow_instances.id` | `-` |
| `step_id` | `uuid` | NO | FK -> `workflow_steps.id` | `-` |
| `case_id` | `uuid` | NO | FK -> `ap_audit_cases.id` | `-` |
| `artifact_id` | `uuid` | NO | - | `-` |
| `artifact_type` | `character varying` | NO | - | `-` |
| `task_title` | `character varying` | NO | - | `-` |
| `task_description` | `text` | YES | - | `-` |
| `assigned_to_user_id` | `character varying` | YES | - | `-` |
| `assigned_to_role` | `character varying` | NO | - | `-` |
| `assigned_to_org_unit_id` | `uuid` | YES | - | `-` |
| `status` | `character varying` | NO | - | `'PENDING'::character varying` |
| `priority` | `character varying` | NO | - | `'NORMAL'::character varying` |
| `due_at` | `timestamp with time zone` | YES | - | `-` |
| `created_at` | `timestamp with time zone` | NO | - | `CURRENT_TIMESTAMP` |
| `completed_at` | `timestamp with time zone` | YES | - | `-` |
| `completed_by` | `character varying` | YES | - | `-` |
| `decision` | `character varying` | YES | - | `-` |
| `comments` | `text` | YES | - | `-` |
| `return_reason` | `text` | YES | - | `-` |
| `version_reviewed` | `integer` | YES | - | `-` |
| `escalated_at` | `timestamp with time zone` | YES | - | `-` |
| `escalation_reason` | `text` | YES | - | `-` |

**Indexes:**
- `idx_wt_assigned_role`: `CREATE INDEX idx_wt_assigned_role ON public.workflow_tasks USING btree (assigned_to_role)`
- `idx_wt_assigned_user`: `CREATE INDEX idx_wt_assigned_user ON public.workflow_tasks USING btree (assigned_to_user_id)`
- `idx_wt_case`: `CREATE INDEX idx_wt_case ON public.workflow_tasks USING btree (case_id)`
- `idx_wt_due`: `CREATE INDEX idx_wt_due ON public.workflow_tasks USING btree (due_at) WHERE ((status)::text = 'PENDING'::text)`
- `idx_wt_inbox`: `CREATE INDEX idx_wt_inbox ON public.workflow_tasks USING btree (assigned_to_user_id, status, due_at) WHERE ((status)::text = 'PENDING'::text)`
- `idx_wt_instance`: `CREATE INDEX idx_wt_instance ON public.workflow_tasks USING btree (instance_id)`
- `idx_wt_status`: `CREATE INDEX idx_wt_status ON public.workflow_tasks USING btree (status)`
- `workflow_tasks_pkey`: `CREATE UNIQUE INDEX workflow_tasks_pkey ON public.workflow_tasks USING btree (id)`

