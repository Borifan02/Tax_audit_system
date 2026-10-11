-- =============================================================================
-- V36 — Audit Quality Assurance Review — complete schema
-- SoR Module D: "Conduct Audit Quality Assurance Review" FR-04.9.2-01 → -13
--
-- QA is a SECOND-PASS review layer: it periodically samples already-COMPLETED
-- audit cases of any type (Desk / Comprehensive / Issue / TP / Joint) and runs
-- its own review lifecycle on top of them. It never mutates the audited case.
--
-- FR traceability (every table below maps to at least one requirement):
--   FR-04.9.2-01  periodic sampling of completed cases   -> qa_sampling_rule, qa_review_case
--   FR-04.9.2-02  auto-assignment to QA team             -> qa_review_case.assigned_qa_officer_id
--   FR-04.9.2-03  QA team prepares review action plan    -> qa_action_plans
--   FR-04.9.2-04  audit team reviews, determines action  -> qa_review_dimension, qa_recommendations
--   FR-04.9.2-05  team leader reviews execution          -> qa_action_plans.status / qa_review_case.status
--   FR-04.9.2-06  TL reviews report + recommendations    -> qa_review_report
--   FR-04.9.2-07  QA drafts exit-conference agenda       -> qa_exit_conferences.qa_team_agenda
--   FR-04.9.2-08  audit team drafts its own agenda       -> qa_exit_conferences.audit_team_agenda
--   FR-04.9.2-09  agenda approved -> conference held     -> qa_exit_conferences.status/held_at
--   FR-04.9.2-10  QA adjusts report per conference       -> qa_review_report.kind = 'ADJUSTED'
--   FR-04.9.2-11  TL/process owner approval + follow-up  -> qa_follow_up_action
--   FR-04.9.2-12  procedural adj / notice / disciplinary -> qa_follow_up_action.action_kind
--   FR-04.9.2-13  check recommendations addressed        -> qa_review_case.recommendations_addressed
--
-- Every statement is idempotent so the same script is safe whether the schema
-- was built by Flyway or by Hibernate ddl-auto=update (the repo's dev default).
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 0. ap_audit_cases — QA linkage columns. The sampled case is NEVER mutated by
--    QA; these columns only record sampling markers and the read-only lock.
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS qa_current_phase   VARCHAR(64);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS qa_review_status   VARCHAR(32);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS qa_review_case_id  UUID;
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS sampled_for_qa     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS qa_read_only_lock  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_ap_cases_qa_review ON ap_audit_cases(qa_review_case_id);
CREATE INDEX IF NOT EXISTS idx_ap_cases_sampled   ON ap_audit_cases(sampled_for_qa) WHERE sampled_for_qa = TRUE;

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. qa_review_case — QA review aggregate root
--    FR-04.9.2-01 (sampling) + FR-04.9.2-02 (assignment) + FR-04.9.2-13 (closure)
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_review_case (
    id                               UUID PRIMARY KEY,
    case_number                      VARCHAR(64)   NOT NULL,
    audit_case_id                    UUID          NOT NULL,
    audit_case_number                VARCHAR(64),
    audit_type                       VARCHAR(32),
    taxpayer_name                    VARCHAR(256),
    trade_name                       VARCHAR(256),
    tin                              VARCHAR(32),
    tax_period                       VARCHAR(64),
    total_tax_assessment             NUMERIC(18,2) NOT NULL DEFAULT 0,
    lead_auditor                     VARCHAR(128),
    lead_auditor_id                  VARCHAR(64),
    audit_team_leader                VARCHAR(128),
    audit_team_leader_id             VARCHAR(64),
    selection_reason                 VARCHAR(32)   NOT NULL DEFAULT 'RISK_BASED_SELECTION',
    sampling_strategy                VARCHAR(32)   NOT NULL DEFAULT 'RISK_BASED_SELECTION',
    sampling_rule_code               VARCHAR(64),
    sampling_score                   INTEGER,
    selection_date                   DATE          NOT NULL DEFAULT CURRENT_DATE,
    selected_by                      VARCHAR(64),
    due_date                         DATE,
    assigned_qa_officer              VARCHAR(128),
    assigned_qa_officer_id           VARCHAR(64),
    assigned_at                      TIMESTAMPTZ,
    assigned_by                      VARCHAR(64),
    qa_team_leader                   VARCHAR(128),
    qa_team_leader_id                VARCHAR(64),
    qa_director_id                   VARCHAR(64),
    status                           VARCHAR(32)   NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    current_step                     VARCHAR(16),
    status_reason                    TEXT,
    overall_score                    INTEGER       NOT NULL DEFAULT 0,
    rating                           VARCHAR(32),
    audit_team_response_notes        TEXT,
    audit_team_response_date         TIMESTAMPTZ,
    audit_team_responded_by          VARCHAR(64),
    qa_team_leader_comment           TEXT,
    qa_team_leader_decision_date     TIMESTAMPTZ,
    director_executive_comment       TEXT,
    director_executive_decision_date TIMESTAMPTZ,
    director_statutory_order         VARCHAR(64),
    recommendations_addressed        BOOLEAN,
    closure_note                     TEXT,
    closure_checked_by               VARCHAR(64),
    closure_checked_at               TIMESTAMPTZ,
    last_saved_at                    TIMESTAMPTZ,
    closed_at                        TIMESTAMPTZ,
    created_by                       VARCHAR(64)   NOT NULL DEFAULT 'SYSTEM',
    created_at                       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at                       TIMESTAMPTZ,
    version                          BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qa_review_case_status     ON qa_review_case(status);
CREATE INDEX IF NOT EXISTS idx_qa_review_case_audit_case ON qa_review_case(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_review_case_officer    ON qa_review_case(assigned_qa_officer_id);
CREATE INDEX IF NOT EXISTS idx_qa_review_case_tl         ON qa_review_case(qa_team_leader_id);
CREATE INDEX IF NOT EXISTS idx_qa_review_case_due        ON qa_review_case(due_date);
-- FR-04.9.2-01 idempotency: a completed case may only have ONE open QA review,
-- so a scheduler retry can never double-sample the same case. Declared as a
-- separate partial UNIQUE INDEX (not an inline constraint with WHERE) — that
-- inline form has already caused PostgreSQL syntax bug C4 in this codebase.
CREATE UNIQUE INDEX IF NOT EXISTS ux_qa_review_case_open
    ON qa_review_case(audit_case_id) WHERE closed_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_qa_review_case_number ON qa_review_case(case_number);

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. qa_action_plans — FR-04.9.2-03 (QA team prepares review action plan)
--                     FR-04.9.2-05 (team leader reviews its execution)
--    Base table shipped in V34; extended here with the checklist + review trail.
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_action_plans (
    id                  UUID PRIMARY KEY,
    audit_case_id       UUID NOT NULL,
    objectives          VARCHAR(1024) NOT NULL DEFAULT '',
    review_scope        VARCHAR(1024) NOT NULL DEFAULT '',
    reviewer            VARCHAR(64),
    status              VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    comments            VARCHAR(1024),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS qa_review_case_id   UUID;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS plan_title          VARCHAR(256);
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS review_methodology  TEXT;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS risk_focus_areas    JSONB   NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS checklist_items     JSONB   NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS sample_size         INTEGER;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS sample_criteria     TEXT;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS decision            VARCHAR(32);
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS decision_comments   TEXT;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS submitted_by        VARCHAR(64);
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS submitted_at        TIMESTAMPTZ;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS reviewed_by         VARCHAR(64);
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS reviewed_at         TIMESTAMPTZ;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS approved_at         TIMESTAMPTZ;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS returned_count      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS version             BIGINT  NOT NULL DEFAULT 0;

-- Widen the V34/Hibernate default lengths so long narrative fields are not truncated.
ALTER TABLE qa_action_plans ALTER COLUMN objectives   TYPE TEXT;
ALTER TABLE qa_action_plans ALTER COLUMN review_scope TYPE TEXT;
ALTER TABLE qa_action_plans ALTER COLUMN comments     TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_qa_action_plans_case   ON qa_action_plans(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_action_plans_review ON qa_action_plans(qa_review_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_action_plans_status ON qa_action_plans(status);

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. qa_review_dimension — FR-04.9.2-04 (audit team reviews the case)
--    The 8 mandatory ISO-19011 quality dimensions (PLANNING_AND_RISK,
--    EVIDENCE_AND_CAAT, STATUTORY_PROCEDURES, RECONCILIATIONS, LEGAL_APPLICATION,
--    TAXPAYER_RIGHTS, PENALTY_AND_INTEREST, WORKING_PAPERS) are scored 0-100 and
--    weighted; qa_review_case.overall_score is the weighted aggregate.
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_review_dimension (
    id                UUID PRIMARY KEY,
    qa_review_case_id UUID NOT NULL,
    dimension_code    VARCHAR(16)  NOT NULL,   -- DIM-01 … DIM-08
    category          VARCHAR(48)  NOT NULL,   -- PLANNING_AND_RISK, EVIDENCE_AND_CAAT, …
    title             VARCHAR(256) NOT NULL,
    standards_reference VARCHAR(256),
    weight            INTEGER      NOT NULL DEFAULT 0,   -- percentage (all weights sum to 100)
    score             INTEGER      NOT NULL DEFAULT 0,   -- 0 - 100
    status            VARCHAR(32)  NOT NULL DEFAULT 'COMPLIANT',
    reviewer_notes    TEXT,
    checkpoints       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    display_order     INTEGER      NOT NULL DEFAULT 0,
    scored_by         VARCHAR(64),
    scored_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

ALTER TABLE qa_review_dimension ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS ux_qa_dim_review_code
    ON qa_review_dimension(qa_review_case_id, dimension_code);
CREATE INDEX IF NOT EXISTS idx_qa_dim_review ON qa_review_dimension(qa_review_case_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. qa_recommendations — FR-04.9.2-04 (findings/actions) + FR-04.9.2-06
--    (recommendations the TL reviews) + FR-04.9.2-13 (are they addressed?).
--    Base table shipped in V34; extended with the deficiency register fields the
--    QA workspace captures (severity, statutory breach, corrective mandate,
--    audit-team remediation response).
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_recommendations (
    id                     UUID PRIMARY KEY,
    audit_case_id          UUID NOT NULL,
    recommendation         TEXT NOT NULL DEFAULT '',
    assigned_to            VARCHAR(64),
    deadline               TIMESTAMPTZ,
    status                 VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    evidence_of_correction TEXT,
    created_by             VARCHAR(64),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ
);

ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS qa_review_case_id    UUID;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS dimension_code       VARCHAR(16);
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS dimension_title      VARCHAR(256);
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS severity             VARCHAR(32) NOT NULL DEFAULT 'MAJOR';
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS title                VARCHAR(256);
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS finding_description  TEXT;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS statutory_breach     TEXT;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS corrective_action_mandate TEXT;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS auditor_response     TEXT;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS remediation_evidence_ref VARCHAR(256);
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS responded_by         VARCHAR(64);
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS responded_at         TIMESTAMPTZ;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS resolved_at          TIMESTAMPTZ;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS due_date             DATE;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS display_order        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE qa_recommendations ADD COLUMN IF NOT EXISTS version              BIGINT NOT NULL DEFAULT 0;

ALTER TABLE qa_recommendations ALTER COLUMN recommendation         TYPE TEXT;
ALTER TABLE qa_recommendations ALTER COLUMN evidence_of_correction TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_qa_recommendations_case   ON qa_recommendations(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_recommendations_review ON qa_recommendations(qa_review_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_recommendations_status ON qa_recommendations(status);

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. qa_review_report — FR-04.9.2-06 (TL reviews draft report + recommendations)
--                       FR-04.9.2-10 (QA adjusts report after exit conference)
--    kind: DRAFT -> (TL review) -> ADJUSTED -> FINAL
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_review_report (
    id                          UUID PRIMARY KEY,
    qa_review_case_id           UUID NOT NULL,
    kind                        VARCHAR(16)  NOT NULL DEFAULT 'DRAFT',
    report_reference            VARCHAR(64),
    generated_date              DATE         NOT NULL DEFAULT CURRENT_DATE,
    executive_summary           TEXT,
    overall_rating              VARCHAR(32),
    total_weighted_score        INTEGER      NOT NULL DEFAULT 0,
    critical_deficiencies_count INTEGER      NOT NULL DEFAULT 0,
    major_deficiencies_count    INTEGER      NOT NULL DEFAULT 0,
    key_strengths               JSONB        NOT NULL DEFAULT '[]'::jsonb,
    systemic_vulnerabilities    JSONB        NOT NULL DEFAULT '[]'::jsonb,
    recommendations_for_director TEXT,
    mandatory_corrective_actions JSONB       NOT NULL DEFAULT '[]'::jsonb,
    lead_qa_officer_signature   VARCHAR(128),
    qa_team_leader_signature    VARCHAR(128),
    director_approval_signature VARCHAR(128),
    signed_date                 TIMESTAMPTZ,
    status                      VARCHAR(32)  NOT NULL DEFAULT 'DRAFT',
    tl_comment                  TEXT,
    tl_decided_by               VARCHAR(64),
    tl_decision_at              TIMESTAMPTZ,
    return_reason               TEXT,
    adjustment_reason           TEXT,
    adjusted_by                 VARCHAR(64),
    adjusted_at                 TIMESTAMPTZ,
    generated_by                VARCHAR(64),
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ,
    version                     BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qa_report_review ON qa_review_report(qa_review_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_report_kind   ON qa_review_report(qa_review_case_id, kind);

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. qa_exit_conferences — FR-04.9.2-07 (QA drafts agenda)
--                          FR-04.9.2-08 (audit team drafts its own agenda)
--                          FR-04.9.2-09 (both approved -> scheduled -> held)
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_exit_conferences (
    id                UUID PRIMARY KEY,
    audit_case_id     UUID NOT NULL,
    agenda            VARCHAR(1024) NOT NULL DEFAULT '',
    scheduled_date    TIMESTAMPTZ,
    status            VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    conference_notes  TEXT,
    created_by        VARCHAR(64),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS qa_review_case_id       UUID;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS qa_team_agenda          JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS audit_team_agenda       JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS qa_agenda_status        VARCHAR(32) NOT NULL DEFAULT 'NOT_DRAFTED';
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS audit_agenda_status     VARCHAR(32) NOT NULL DEFAULT 'NOT_DRAFTED';
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS qa_agenda_drafted_by    VARCHAR(64);
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS qa_agenda_drafted_at    TIMESTAMPTZ;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS audit_agenda_drafted_by VARCHAR(64);
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS audit_agenda_drafted_at TIMESTAMPTZ;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS agenda_approved_by      VARCHAR(64);
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS agenda_approved_at      TIMESTAMPTZ;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS agenda_rejection_reason TEXT;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS held_at                 TIMESTAMPTZ;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS conducted_by            VARCHAR(64);
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS attendees               JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS minutes                 TEXT;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS report_adjusted         BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS version                 BIGINT NOT NULL DEFAULT 0;

ALTER TABLE qa_exit_conferences ALTER COLUMN agenda             TYPE TEXT;
ALTER TABLE qa_exit_conferences ALTER COLUMN conference_notes   TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_qa_conferences_case   ON qa_exit_conferences(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_conferences_review ON qa_exit_conferences(qa_review_case_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. qa_follow_up_action — FR-04.9.2-11 (TL/process owner approves + decides
--    follow-up) and FR-04.9.2-12, which explicitly allows all three remedies to
--    be applied together:
--      i.   procedural adjustment              -> action_kind = 'PROCEDURAL_ADJUSTMENT'
--      ii.  stakeholder notice                 -> action_kind = 'STAKEHOLDER_NOTIFICATION'
--      iii. team leader/process owner takes
--           disciplinary action                -> action_kind = 'DISCIPLINARY_ACTION'
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_follow_up_action (
    id                  UUID PRIMARY KEY,
    qa_review_case_id   UUID NOT NULL,
    audit_case_id       UUID,
    action_kind         VARCHAR(32)  NOT NULL,
    title               VARCHAR(256) NOT NULL,
    narrative           TEXT,
    target_actor_id     VARCHAR(64),
    target_actor_name   VARCHAR(128),
    target_department   VARCHAR(128),
    due_date            DATE,
    status              VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    decided_by          VARCHAR(64),
    decided_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_by        VARCHAR(64),
    completed_at        TIMESTAMPTZ,
    completion_evidence TEXT,
    verified_by         VARCHAR(64),
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_qa_followup_review ON qa_follow_up_action(qa_review_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_followup_kind   ON qa_follow_up_action(action_kind);
CREATE INDEX IF NOT EXISTS idx_qa_followup_status ON qa_follow_up_action(status);

-- ═════════════════════════════════════════════════════════════════════════════
-- 8. qa_sampling_rule — FR-04.9.2-01 "periodic sampling of completed cases",
--    explicitly CONFIGURABLE. One row per strategy so no strategy is hard-coded
--    as an unimplemented default (see the QA implementation guide §9).
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_sampling_rule (
    id                  UUID PRIMARY KEY,
    code                VARCHAR(64)  NOT NULL,
    name                VARCHAR(256) NOT NULL,
    strategy            VARCHAR(32)  NOT NULL,   -- RANDOM, STRATIFIED, RISK_WEIGHTED, MONETARY_UNIT, MANDATORY_HIGH_EXPOSURE
    selection_reason    VARCHAR(32)  NOT NULL DEFAULT 'RISK_BASED_SELECTION',
    exposure_threshold  NUMERIC(18,2),
    sample_percentage   NUMERIC(5,2),
    max_sample_size     INTEGER,
    audit_types         JSONB        NOT NULL DEFAULT '[]'::jsonb,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    effective_from      DATE,
    effective_to        DATE,
    created_by          VARCHAR(64)  NOT NULL DEFAULT 'SYSTEM',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_qa_sampling_rule_code ON qa_sampling_rule(code);

-- ═════════════════════════════════════════════════════════════════════════════
-- 9. qa_review_event — per-review workflow trace. Records every FR-04.9.2-xx
--    transition with actor + status before/after. Complements (never replaces)
--    the immutable shared_audit_trail_entries table.
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qa_review_event (
    id                UUID PRIMARY KEY,
    qa_review_case_id UUID NOT NULL,
    step_code         VARCHAR(16),
    event_type        VARCHAR(64) NOT NULL,
    from_status       VARCHAR(32),
    to_status         VARCHAR(32),
    actor_id          VARCHAR(64),
    actor_name        VARCHAR(128),
    actor_role        VARCHAR(64),
    notes             TEXT,
    metadata          JSONB,
    occurred_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_review_event_review ON qa_review_event(qa_review_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_review_event_step   ON qa_review_event(step_code);
CREATE INDEX IF NOT EXISTS idx_qa_review_event_time   ON qa_review_event(occurred_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- 10. RBAC — QA roles + fine-grained QA permissions (Section 29 RBAC).
--     Role codes match the QA workspace roles (QA_OFFICER / QA_TEAM_LEADER /
--     QA_DIRECTOR); QA_MEMBER is retained for the V34 action-plan endpoints.
-- ═════════════════════════════════════════════════════════════════════════════
-- Align the identity tables: Flyway-built (V16) and Hibernate ddl-auto-built
-- schemas differ slightly. Hibernate omits DB defaults for UUID ids and the
-- audit columns on the join tables, so normalise both here (all idempotent).
ALTER TABLE roles       ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE permissions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users       ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS granted_by VARCHAR(64);
ALTER TABLE user_roles       ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE user_roles       ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(64);

-- Canonical audit-team roles that the QA permission grants below depend on
-- (V23 seeds these too; repeated here with ON CONFLICT so the QA grants are
-- never silently lost on a database where V23 has not been applied).
INSERT INTO roles (code, name, description, is_system, is_active) VALUES
  ('AUDITOR',     'Auditor',     'Executes the audit being quality-reviewed.', TRUE, TRUE),
  ('TEAM_LEADER', 'Team Leader', 'Owns the audit execution; responds to QA findings.', TRUE, TRUE),
  ('DIRECTOR',    'Audit Director', 'Certifies audit outcomes.', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (code, name, description, is_system, is_active) VALUES
  ('QA_OFFICER',     'Audit Quality Assurance Officer',    'Conducts the QA review: scoring, deficiencies, draft report, agendas.', TRUE, TRUE),
  ('QA_TEAM_LEADER', 'Audit Quality Assurance Team Leader','Endorses QA execution, approves agendas, decides follow-up, verifies closure.', TRUE, TRUE),
  ('QA_DIRECTOR',    'Director of Audit Quality Assurance','Process owner: certifies the QA review and statutory order.', TRUE, TRUE),
  ('QA_MEMBER',      'QA Review Team Member',              'Generic QA review team membership (action-plan drafting).', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description, module) VALUES
  ('QA_CASE_VIEW',        'View QA review cases and workspaces',           'QA'),
  ('QA_CASE_SAMPLE',      'Run/trigger periodic sampling of completed cases','QA'),
  ('QA_CASE_ASSIGN',      'Assign a QA review to an officer/team leader',  'QA'),
  ('QA_PLAN_DRAFT',       'Draft/submit the QA review action plan',        'QA'),
  ('QA_PLAN_APPROVE',     'Approve or reject the QA review action plan',   'QA'),
  ('QA_REVIEW_EXECUTE',   'Score QA dimensions and log deficiencies',      'QA'),
  ('QA_REVIEW_ENDORSE',   'Endorse QA review execution and recommendations','QA'),
  ('QA_DEFICIENCY_ISSUE', 'Issue a formal quality deficiency notice',      'QA'),
  ('QA_RESPONSE_SUBMIT',  'Submit the audited team response / remediation', 'QA'),
  ('QA_REPORT_DRAFT',     'Draft the QA review report',                    'QA'),
  ('QA_REPORT_REVIEW',    'Review / return / approve the QA report',       'QA'),
  ('QA_AGENDA_DRAFT',     'Draft an exit-conference agenda',               'QA'),
  ('QA_AGENDA_APPROVE',   'Approve the exit-conference agendas',           'QA'),
  ('QA_CONFERENCE_CONDUCT','Record exit-conference minutes as conducted',  'QA'),
  ('QA_REPORT_ADJUST',    'Adjust the QA report after the exit conference','QA'),
  ('QA_FOLLOWUP_DECIDE',  'Decide QA follow-up actions (FR-04.9.2-11)',    'QA'),
  ('QA_FOLLOWUP_EXECUTE', 'Execute QA follow-up actions (FR-04.9.2-12)',   'QA'),
  ('QA_CLOSURE_VERIFY',   'Verify recommendations addressed and close',    'QA'),
  ('QA_DIRECTOR_CERTIFY', 'Issue the final QA certification/order',        'QA'),
  ('QA_STATS_VIEW',       'View QA dashboards and aggregate statistics',   'QA')
ON CONFLICT (code) DO NOTHING;

-- QA_OFFICER — the working reviewer.
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, 'SYSTEM' FROM roles r JOIN permissions p ON p.code IN (
    'QA_CASE_VIEW','QA_CASE_SAMPLE','QA_PLAN_DRAFT','QA_REVIEW_EXECUTE',
    'QA_DEFICIENCY_ISSUE','QA_REPORT_DRAFT','QA_AGENDA_DRAFT','QA_CONFERENCE_CONDUCT',
    'QA_REPORT_ADJUST','QA_STATS_VIEW')
WHERE r.code = 'QA_OFFICER'
ON CONFLICT DO NOTHING;

-- QA_TEAM_LEADER — endorses execution, approves agendas, decides + verifies follow-up.
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, 'SYSTEM' FROM roles r JOIN permissions p ON p.code IN (
    'QA_CASE_VIEW','QA_CASE_SAMPLE','QA_CASE_ASSIGN','QA_PLAN_APPROVE',
    'QA_REVIEW_ENDORSE','QA_REPORT_REVIEW','QA_AGENDA_APPROVE',
    'QA_FOLLOWUP_DECIDE','QA_FOLLOWUP_EXECUTE','QA_CLOSURE_VERIFY','QA_STATS_VIEW')
WHERE r.code = 'QA_TEAM_LEADER'
ON CONFLICT DO NOTHING;

-- QA_DIRECTOR — process owner: certification and statutory order.
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, 'SYSTEM' FROM roles r JOIN permissions p ON p.code IN (
    'QA_CASE_VIEW','QA_CASE_SAMPLE','QA_CASE_ASSIGN','QA_REVIEW_ENDORSE',
    'QA_REPORT_REVIEW','QA_FOLLOWUP_DECIDE','QA_CLOSURE_VERIFY',
    'QA_DIRECTOR_CERTIFY','QA_STATS_VIEW')
WHERE r.code = 'QA_DIRECTOR'
ON CONFLICT DO NOTHING;

-- QA_MEMBER — legacy action-plan drafting role.
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, 'SYSTEM' FROM roles r JOIN permissions p ON p.code IN (
    'QA_CASE_VIEW','QA_PLAN_DRAFT','QA_REVIEW_EXECUTE','QA_REPORT_DRAFT','QA_STATS_VIEW')
WHERE r.code = 'QA_MEMBER'
ON CONFLICT DO NOTHING;

-- The AUDITED audit team must be able to see and respond to QA findings
-- (FR-04.9.2-05 / -12: the audit team reviews and the TL responds).
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, 'SYSTEM' FROM roles r JOIN permissions p ON p.code IN (
    'QA_CASE_VIEW','QA_RESPONSE_SUBMIT')
WHERE r.code IN ('AUDITOR', 'TEAM_LEADER')
ON CONFLICT DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 11. QA identities — the three QA actors the workspace signs in as.
--     `username` is deliberately the SAME value the frontend sends in the
--     X-Actor-Id / X-User-Id header (e.g. "usr-qa-01"), so NotificationService
--     identifier resolution and audit-trail attribution both work without any
--     frontend auth change.
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO users (id, username, email, full_name, employee_id, is_active) VALUES
  ('0a000001-0000-4000-8000-000000000001', 'usr-qa-01',     'elena.rostova@itas.gov.tax',   'Elena Rostova',      'QAS-REV-3109', TRUE),
  ('0a000002-0000-4000-8000-000000000002', 'usr-qa-tl-01',  'david.kim@itas.gov.tax',       'David Kim',          'QAS-TL-1288',  TRUE),
  ('0a000003-0000-4000-8000-000000000003', 'usr-qa-dir-01', 'arthur.pendelton@itas.gov.tax','Dr. Arthur Pendelton','HQ-QAS-0012', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 'SYSTEM'
FROM users u JOIN roles r ON r.code = 'QA_OFFICER'
WHERE u.username = 'usr-qa-01'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 'SYSTEM'
FROM users u JOIN roles r ON r.code = 'QA_TEAM_LEADER'
WHERE u.username = 'usr-qa-tl-01'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 'SYSTEM'
FROM users u JOIN roles r ON r.code = 'QA_DIRECTOR'
WHERE u.username = 'usr-qa-dir-01'
ON CONFLICT DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 12. Sampling rules (FR-04.9.2-01) — every strategy the engine supports has a
--     live configuration row, so none is silently unimplemented.
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO qa_sampling_rule
  (id, code, name, strategy, selection_reason, exposure_threshold, sample_percentage, max_sample_size, audit_types, effective_from)
VALUES
  ('0b000001-0000-4000-8000-000000000001', 'QA-SR-HIGH-EXPOSURE', 'Mandatory High-Exposure Review',
   'MANDATORY_HIGH_EXPOSURE', 'MANDATORY_HIGH_EXPOSURE', 500000.00, NULL, NULL,
   '["DESK_AUDIT","COMPREHENSIVE_AUDIT","ISSUE_AUDIT","TRANSFER_PRICING","JOINT_AUDIT"]'::jsonb, CURRENT_DATE),
  ('0b000002-0000-4000-8000-000000000002', 'QA-SR-RANDOM', 'Random Statutory Sample',
   'RANDOM', 'RANDOM_STATUTORY_SAMPLE', NULL, 10.00, 20,
   '["DESK_AUDIT","COMPREHENSIVE_AUDIT"]'::jsonb, CURRENT_DATE),
  ('0b000003-0000-4000-8000-000000000003', 'QA-SR-STRATIFIED', 'Stratified Sample by Audit Type',
   'STRATIFIED', 'RISK_BASED_SELECTION', NULL, 15.00, 25,
   '["DESK_AUDIT","COMPREHENSIVE_AUDIT","ISSUE_AUDIT"]'::jsonb, CURRENT_DATE),
  ('0b000004-0000-4000-8000-000000000004', 'QA-SR-RISK-WEIGHTED', 'Risk-Weighted Sample',
   'RISK_WEIGHTED', 'RISK_BASED_SELECTION', 100000.00, 20.00, 30,
   '["DESK_AUDIT","COMPREHENSIVE_AUDIT","TRANSFER_PRICING"]'::jsonb, CURRENT_DATE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 13. FR-04.9.2-09 / -10 / -13 traceability columns.
--     Idempotent so this file can be re-run safely under either Flyway or the
--     Hibernate ddl-auto=update bootstrap in use today.
-- ============================================================================
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS adjusted_report_id   UUID;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS report_adjusted_at   TIMESTAMPTZ;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS schedule_notified_to TEXT;
ALTER TABLE qa_exit_conferences ADD COLUMN IF NOT EXISTS schedule_notified_at TIMESTAMPTZ;

ALTER TABLE qa_review_case ADD COLUMN IF NOT EXISTS recommendations_addressed BOOLEAN;
ALTER TABLE qa_review_case ADD COLUMN IF NOT EXISTS closure_note              TEXT;
ALTER TABLE qa_review_case ADD COLUMN IF NOT EXISTS closure_checked_by        VARCHAR(64);
ALTER TABLE qa_review_case ADD COLUMN IF NOT EXISTS closure_checked_at        TIMESTAMPTZ;
ALTER TABLE qa_review_case ADD COLUMN IF NOT EXISTS closed_at                 TIMESTAMPTZ;
ALTER TABLE qa_review_case ADD COLUMN IF NOT EXISTS current_step              VARCHAR(16);

-- ============================================================================
-- 14. FR-04.9.2-01 sampling-run ledger.
--     The requirement says cases are selected "periodically based on an agreed
--     time period"; this ledger is the proof that the periodic run executed.
-- ============================================================================
CREATE TABLE IF NOT EXISTS qa_sampling_run (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code       VARCHAR(64),
    strategy        VARCHAR(32),
    triggered_by    VARCHAR(64),
    evaluated_count INTEGER NOT NULL DEFAULT 0,
    selected_count  INTEGER NOT NULL DEFAULT 0,
    created_count   INTEGER NOT NULL DEFAULT 0,
    dry_run         BOOLEAN NOT NULL DEFAULT FALSE,
    window_from     DATE,
    window_to       DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_sampling_run_created ON qa_sampling_run (created_at DESC);

