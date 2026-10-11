# ITAS Tax Audit System — Flyway SQL Migrations Catalog & JPA Entity Lineage

## 1. Overview of Schema Evolution & Migration Strategy

The ITAS database (`itas_audit`) uses **Flyway Versioned SQL Migrations** located in:
`backend/bs-taxaudit-core-server/src/main/resources/db/migration/`

In total, **41 SQL migration files** (`39 active versioned migrations` + `2 archived .old baseline files`) define the evolution of the 124 tables across all 8 audit clusters, complemented by **75+ Spring Data JPA `@Entity` classes** in `mor.itas.persistence.jpa.entity`.

---

## 2. Complete Flyway Migration Scripts Inventory

| Order | Migration Script Filename | Target Cluster / Domain | Primary Schema Objects Created / Modified |
| :---: | :--- | :--- | :--- |
| 1 | `V0__shared_infrastructure.sql` | Shared Infrastructure | `shared_audit_trail_entries`, `shared_outbox_entries`, `notifications` |
| 2 | `V1__ap_annual_plan.sql.old` | Annual Planning (Archived) | Initial prototype `ap_annual_audit_plans` |
| 3 | `V1_1__ap_tc_feedback.sql.old` | Annual Planning (Archived) | Initial prototype tax center feedback |
| 4 | `V1.0.8__add_estimated_revenue_to_plans.sql` | Annual Planning | Adds `estimated_revenue` column to `ap_annual_audit_plans` |
| 5 | `V2_0__ap_phase_2_domain_models.sql` | Annual Planning & Cases | Core `ap_annual_audit_plans`, `ap_plan_allocations`, `ap_audit_cases`, `ap_plan_audit_logs` |
| 6 | `V6__ap_planning_workflow.sql` | Annual Planning Workflow | `ap_plan_revisions`, `ap_plan_timeline`, workflow status columns |
| 7 | `V7__add_unique_plan_year.sql` | Annual Planning | Adds `UNIQUE (plan_year)` constraint on `ap_annual_audit_plans` |
| 8 | `V8__store_distribution_data.sql` | Annual Planning | Adds `distribution_data` (`JSONB`) to `ap_annual_audit_plans` |
| 9 | `V9__director_approval_and_regional_deployment.sql` | Director & Regional Cascade | `ap_director_approvals`, `ap_regional_deployments`, `ap_regional_plan_access` |
| 10 | `V10__regional_tc_deployments.sql` | Regional to Tax Center Cascade | `ap_regional_tc_deployments`, `ap_regional_feedback` |
| 11 | `V11__tax_center_detailed_adjustments.sql` | Tax Center Adjustments | Detailed allocation adjustment columns on `ap_regional_tc_deployments` |
| 12 | `V12__add_tax_center_code_to_cases.sql` | Case Registry | Denormalizes `tax_center_code` and `region_code` onto `ap_audit_cases` |
| 13 | `V13__add_revenue_tracking.sql` | Revenue Analytics | Revenue target & recovery tracking columns on plans and allocations |
| 14 | `V14__tp_audit_execution_tables.sql` | Transfer Pricing (`FR-04.7`) | `tp_risk_assessment`, `tp_working_hypothesis`, `tp_planning_meeting`, `tp_audit_plan`, `tp_field_work_data`, `tp_analysis_data`, `tp_audit_report`, `tp_audit_notice`, `tp_objection` |
| 15 | `V15__tp_enhanced_execution_tables.sql` | Transfer Pricing (`FR-04.7`) | `tp_information_request_log`, `tp_external_price_match`, `tp_competitor_price_uploads`, `tp_exit_conference`, `tp_audit_action_history` |
| 16 | `V16__identity_and_rbac.sql` | Identity & RBAC | `roles`, `permissions`, `role_permissions`, `t_user` RBAC columns |
| 17 | `V17__workflow_engine.sql` | Workflow Engine | `workflow_definitions`, `workflow_instances`, `workflow_steps`, `workflow_tasks`, `sla_tracking` |
| 18 | `V18__dev_seed_data.sql` | Master Seed Data | Initial dev roles, permissions, and reference records |
| 19 | `V19__workflow_engine_updates.sql` | Workflow Engine | SLA escalation and task assignment columns |
| 20 | `V20__add_version_to_workflow_instances.sql` | Workflow Engine | Optimistic locking `@Version` column on `workflow_instances` |
| 21 | `V21__org_hierarchy_and_ownership.sql` | Organizational Hierarchy | `regions`, `tax_centers`, `organizational_units`, `user_organizational_assignments`, `committees`, `teams`, `team_members` |
| 22 | `V22__seed_master_org_data.sql` | Master Org Seed | Seeds Ethiopian Federal LTOs (`federal-lto1`, `federal-lto2`) and Regional Tax Centers (`AA`, `OR`, `AM`, `DD`, `SN`, `SM`) |
| 23 | `V23__seed_all_system_users_and_org_structure.sql` | System User Directory | Seeds full multi-region user directory across all roles |
| 24 | `V24__fix_regional_deployments_not_null_constraints.sql` | Regional Cascade | Relaxes nullable constraints on intermediate regional deployment drafts |
| 25 | `V25__tp_strict_phase_gate_governance.sql` | Transfer Pricing Governance | `tp_phase_gates`, `tp_management_report_snapshot` |
| 26 | `V26__planning_configuration.sql` | Planning Configuration | `ap_planning_configuration`, `audit_types` |
| 27 | `V27__widen_case_number.sql` | Case Registry | Widens `case_number` column length to support composite regional/tax-center identifiers |
| 28 | `V28__case_handoff_workflow.sql` | Case Handoff & JAC | `case_handoff`, `case_auditor_assignment`, `t_handoff_record`, `t_handoff_team_member` |
| 29 | `V29__seed_ja_execution_identities.sql` | Joint Audit Identities | Seeds Joint Audit Team Leaders and Auditors across LTO1, LTO2, and regional centers |
| 30 | `V30__add_tax_center_to_audit_team.sql` | JAC & Audit Teams | Adds `tax_center` scoping to `t_audit_team` and `t_auditor` |
| 31 | `V31__add_team_id_to_committee_case.sql` | JAC Committee | Links `t_committee_case` to `t_audit_team` |
| 32 | `V32__update_user_emails_and_names.sql` | User Directory | Normalizes Ethiopian full names and `@mor.gov.et` emails |
| 33 | `V33__update_user_usernames_and_emails_with_role_prefixes.sql` | User Directory | Standardizes role-prefixed usernames (`auditor.*`, `teamleader.*`, `committee.*`) |
| 34 | `V34__desk_audit_execution_tables.sql` | Desk Audit (`FR-04.2`) | `da_evidence`, `da_audit_procedures`, `da_draft_reports` |
| 35 | `V35__desk_audit_missing_tables.sql` | Desk Audit (`FR-04.2`) | `da_findings`, `da_working_papers`, `da_queries`, `da_case_snapshots` |
| 36 | `V36__qa_audit_execution_tables.sql` | QA & CA Display Columns | `qa_deficiencies`, `qa_reports`, `qa_exit_conferences`, `qa_follow_ups`, `qa_action_plans`, `qa_recommendations`, plus V36 display columns on `ap_audit_cases` |
| 37 | `V37__comprehensive_audit_full_schema.sql` | Comprehensive Audit (`FR-04.4`) | `ca_caat_eligibility`, `ca_caat_rules`, `ca_caat_runs`, `ca_caat_exceptions`, `ca_benford_analysis`, `ca_third_party_matches`, `ca_balance_sheet_items`, `ca_benchmark_analyses`, `ca_entry_conferences`, `ca_document_requests`, `ca_reconciliations`, `ca_sampling_records`, `ca_audit_assertions`, `ca_working_papers`, `ca_query_sheets`, `ca_audit_findings`, `ca_draft_reports`, `ca_approval_steps`, `ca_exit_conferences`, `ca_assessment_notices`, `ca_execution_reports`, `ca_taxpayer_responses`, `ca_multi_zone_allocations` |
| 38 | `V38__qa_quality_assurance_review_schema.sql` | Quality Assurance (`FR-04.9.2`) | `qa_sampling_rule`, `qa_sampling_run`, `qa_review_case`, `qa_review_dimension`, `qa_review_report`, `qa_follow_up_action`, `qa_review_event` |
| 39 | `V39__seed_desk_audit_case.sql` | Desk Audit Seed | Seeds reference Desk Audit case and procedures |
| 40 | `V40__fix_desk_team_leader.sql` | Desk Audit Assignment | Aligns Desk Audit Team Leader assignment IDs |
| 41 | `V41__ca_case_snapshots.sql` | Comprehensive & Joint Audit | `ca_case_snapshots` (`JSONB` full workspace state persistence for Comprehensive and Joint Audit) |

---

## 3. JPA Entity to Database Table Mapping Summary

| Package (`mor.itas.persistence.jpa.entity.*`) | Entity Count | Mapped Database Tables |
| :--- | :---: | :--- |
| `ap.*` | 28 | `ap_annual_audit_plans`, `ap_plan_allocations`, `ap_audit_cases`, `ap_director_approvals`, `ap_regional_deployments`, `ap_regional_tc_deployments`, `ap_regional_feedback`, `ap_plan_revisions`, `ap_plan_timeline`, `ap_planning_configuration`, `t_committee_case`, `t_committee_session`, `t_committee_vote`, `t_advisory_voting`, `t_voting_tally`, `t_auditor`, `t_audit_team`, `t_auditor_nomination`, `t_handoff_record`, `t_research_note`, `t_user`, etc. |
| `ca.*` | 23 | `ca_assessment_notices`, `ca_audit_assertions`, `ca_audit_findings`, `ca_balance_sheet_items`, `ca_benchmark_analyses`, `ca_benford_analysis`, `ca_caat_eligibility`, `ca_caat_exceptions`, `ca_caat_rules`, `ca_caat_runs`, `ca_case_snapshots`, `ca_document_requests`, `ca_draft_reports`, `ca_entry_conferences`, `ca_execution_reports`, `ca_exit_conferences`, `ca_multi_zone_allocations`, `ca_query_sheets`, `ca_reconciliations`, `ca_sampling_records`, `ca_taxpayer_responses`, `ca_third_party_matches`, `ca_working_papers` |
| `da.*` | 7 | `da_audit_procedures`, `da_case_snapshots`, `da_draft_reports`, `da_evidence`, `da_findings`, `da_queries`, `da_working_papers` |
| `tp.*` | 15 | `tp_analysis_data`, `tp_audit_action_history`, `tp_audit_notice`, `tp_audit_plan`, `tp_audit_report`, `tp_competitor_price_uploads`, `tp_exit_conference`, `tp_external_price_match`, `tp_field_work_data`, `tp_information_request_log`, `tp_objection`, `tp_phase_gates`, `tp_planning_meeting`, `tp_risk_assessment`, `tp_working_hypothesis` |
| `qa.*` | 13 | `qa_action_plans`, `qa_deficiencies`, `qa_exit_conferences`, `qa_follow_up_action`, `qa_follow_ups`, `qa_recommendations`, `qa_reports`, `qa_review_case`, `qa_review_dimension`, `qa_review_event`, `qa_review_report`, `qa_sampling_rule`, `qa_sampling_run` |
| `identity.*` | 7 | `organizational_units`, `permissions`, `regions`, `roles`, `tax_centers`, `t_user`, `user_organizational_assignments` |
| `issue.*` | 1 | `issue_audit_details` |
| `workflow.*` | 4 | `workflow_definitions`, `workflow_instances`, `workflow_steps`, `workflow_tasks` |
| `notification.*` / `shared.*` | 2 | `notifications`, `shared_audit_trail_entries` |
