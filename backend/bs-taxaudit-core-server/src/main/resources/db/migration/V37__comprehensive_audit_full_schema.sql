-- ============================================================
-- V35 — Comprehensive Audit Complete Schema
-- Single authoritative migration for all CA tables.
-- Covers SoR Module D FR-04.2.1, FR-04.4-01 → FR-04.4-34
-- ============================================================

-- ── 0. ap_audit_cases CA columns ──────────────────────────────────────────────
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS ca_current_phase   VARCHAR(64);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS ca_workflow_status  VARCHAR(64);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS tin                 VARCHAR(32);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS tax_center          VARCHAR(128);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS risk_category       VARCHAR(16);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS taxpayer_segment    VARCHAR(16);
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS start_date          DATE;
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS due_date            DATE;
ALTER TABLE ap_audit_cases ADD COLUMN IF NOT EXISTS audit_scope         TEXT;

-- Back-fill convenience columns from existing fields
UPDATE ap_audit_cases SET tin              = taxpayer_id   WHERE tin             IS NULL;
UPDATE ap_audit_cases SET tax_center       = tax_center_code WHERE tax_center    IS NULL;
UPDATE ap_audit_cases SET taxpayer_segment = segment       WHERE taxpayer_segment IS NULL;
UPDATE ap_audit_cases SET risk_category =
    CASE
        WHEN risk_score >= 80 THEN 'HIGH'
        WHEN risk_score >= 50 THEN 'MEDIUM'
        ELSE 'LOW'
    END
WHERE risk_category IS NULL AND risk_score IS NOT NULL;

-- ── 1. Document Requests (FR-04.4-04) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_document_requests (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id        UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    request_description  TEXT NOT NULL,
    requested_document   TEXT NOT NULL,
    due_date             TIMESTAMPTZ,
    status               VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    requesting_auditor   VARCHAR(64),
    response_notes       TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ
);

-- ── 2. Query Sheets (FR-04.4-05, 09) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_query_sheets (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id         UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    question              TEXT NOT NULL,
    supporting_context    TEXT,
    requested_information TEXT,
    due_date              TIMESTAMPTZ,
    status                VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    taxpayer_response     TEXT,
    auditor_comments      TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ
);

-- ── 3. Audit Assertions (FR-04.4-03, 11) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_audit_assertions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id       UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    financial_area      VARCHAR(64)  NOT NULL,
    assertion_type      VARCHAR(64)  NOT NULL,
    expected_value      NUMERIC(18,2),
    actual_value        NUMERIC(18,2),
    verification_result VARCHAR(64),
    explanation         TEXT,
    finding             TEXT,
    conclusion          TEXT,
    created_by          VARCHAR(64),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- ── 4. Execution Reports (FR-04.4-10) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_execution_reports (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id  UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    report_content TEXT NOT NULL,
    status         VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    approval_level INT  NOT NULL DEFAULT 1,
    caat_eligible  BOOLEAN DEFAULT FALSE,
    created_by     VARCHAR(64),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ
);

-- ── 5. CAAT Eligibility (FR-04.4-01) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_caat_eligibility (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id          UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    is_eligible            BOOLEAN NOT NULL DEFAULT FALSE,
    eligibility_reason     TEXT,
    annual_turnover        NUMERIC(18,2),
    has_erp_system         BOOLEAN DEFAULT FALSE,
    has_electronic_records BOOLEAN DEFAULT FALSE,
    taxpayer_segment       VARCHAR(16),
    assessed_by            VARCHAR(64),
    assessed_at            TIMESTAMPTZ,
    overridden             BOOLEAN DEFAULT FALSE,
    override_reason        TEXT,
    override_by            VARCHAR(64),
    status                 VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ
);

-- ── 6. CAAT Runs (FR-04.4-02, 14) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_caat_runs (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id          UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    run_reference          VARCHAR(64)  NOT NULL,
    caat_tool_name         VARCHAR(128) NOT NULL DEFAULT 'ITAS Automated CAAT Suite',
    sampling_method        VARCHAR(64)  NOT NULL,
    total_records_mined    INTEGER DEFAULT 0,
    total_flagged          INTEGER DEFAULT 0,
    total_flagged_exposure NUMERIC(18,2) DEFAULT 0,
    status                 VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    auditor_notes          TEXT,
    execution_log          TEXT,
    executed_by            VARCHAR(64),
    started_at             TIMESTAMPTZ,
    completed_at           TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ
);

-- ── 7. CAAT Rules (FR-04.4-14) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_caat_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caat_run_id         UUID NOT NULL REFERENCES ca_caat_runs(id) ON DELETE CASCADE,
    rule_code           VARCHAR(32)  NOT NULL,
    rule_name           VARCHAR(128) NOT NULL,
    category            VARCHAR(64)  NOT NULL,
    target_ledger       VARCHAR(64),
    sample_size         INTEGER DEFAULT 0,
    discrepancies_count INTEGER DEFAULT 0,
    variance_amount     NUMERIC(18,2) DEFAULT 0,
    threshold_amount    NUMERIC(18,2),
    details             TEXT,
    status              VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    last_executed_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 8. CAAT Exceptions (FR-04.4-14, 28) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_caat_exceptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caat_run_id          UUID NOT NULL REFERENCES ca_caat_runs(id) ON DELETE CASCADE,
    audit_case_id        UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    rule_code            VARCHAR(32)  NOT NULL,
    transaction_ref      VARCHAR(128),
    transaction_date     DATE,
    account_name         VARCHAR(256),
    counterparty         VARCHAR(256),
    amount               NUMERIC(18,2),
    anomaly_type         VARCHAR(128) NOT NULL,
    risk_level           VARCHAR(16)  NOT NULL,
    tax_head             VARCHAR(16),
    details              TEXT,
    action_taken_notes   TEXT,
    converted_to_finding BOOLEAN DEFAULT FALSE,
    finding_id           UUID,
    status               VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ
);

-- ── 9. Benford Analysis (FR-04.4-14) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_benford_analysis (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caat_run_id     UUID NOT NULL REFERENCES ca_caat_runs(id) ON DELETE CASCADE,
    audit_case_id   UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    digit           SMALLINT NOT NULL CHECK (digit BETWEEN 1 AND 9),
    expected_pct    NUMERIC(6,3) NOT NULL,
    observed_pct    NUMERIC(6,3) NOT NULL,
    observed_count  INTEGER NOT NULL DEFAULT 0,
    deviation       NUMERIC(6,3),
    is_anomalous    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 10. Entry Conferences (FR-04.2.1-01..05) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_entry_conferences (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id              UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    scheduled_date             DATE NOT NULL,
    scheduled_time             VARCHAR(16),
    venue                      VARCHAR(256),
    internal_controls_review   TEXT,
    premises_inspection_notes  TEXT,
    audio_recording_url        VARCHAR(512),
    attendees                  JSONB,
    taxpayer_confirmed_receipt  BOOLEAN DEFAULT FALSE,
    taxpayer_receipt_date       DATE,
    status                      VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    created_by                  VARCHAR(64),
    reviewed_by                 VARCHAR(64),
    reviewed_at                 TIMESTAMPTZ,
    team_leader_approved        BOOLEAN DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ
);

-- ── 11. Balance Sheet Items (FR-04.4-03, 08) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_balance_sheet_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id       UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    component           VARCHAR(128) NOT NULL,
    assertion_type      VARCHAR(64)  NOT NULL,
    auditee_balance     NUMERIC(18,2),
    audited_balance     NUMERIC(18,2),
    variance            NUMERIC(18,2),
    ifrs_compliance     VARCHAR(32),
    notes               TEXT,
    auditor_conclusion  VARCHAR(64),
    created_by          VARCHAR(64),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- ── 12. Benchmark Analysis (FR-04.4-06, 14) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_benchmark_analyses (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id      UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    ratio_name         VARCHAR(128) NOT NULL,
    taxpayer_value     NUMERIC(10,4),
    benchmark_value    NUMERIC(10,4),
    unit               VARCHAR(32),
    variance_pct       NUMERIC(10,4),
    risk_level         VARCHAR(16),
    interpretation     TEXT,
    industry_code      VARCHAR(32),
    data_year          SMALLINT,
    created_by         VARCHAR(64),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 13. Third-Party Matches (FR-04.4-07) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_third_party_matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id       UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    data_source         VARCHAR(128) NOT NULL,
    declared_value      NUMERIC(18,2),
    third_party_value   NUMERIC(18,2),
    variance            NUMERIC(18,2),
    match_status        VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    discrepancy_notes   TEXT,
    period_covered      VARCHAR(32),
    created_by          VARCHAR(64),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- ── 14. Reconciliations (FR-04.4-16) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_reconciliations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id       UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    reconciliation_type VARCHAR(64)   NOT NULL,
    source_a_label      VARCHAR(128)  NOT NULL,
    source_a_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    source_b_label      VARCHAR(128)  NOT NULL,
    source_b_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    source_c_label      VARCHAR(128),
    source_c_amount     NUMERIC(18,2),
    variance            NUMERIC(18,2),
    variance_pct        NUMERIC(8,4),
    period_covered      VARCHAR(32),
    status              VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    auditor_notes       TEXT,
    created_by          VARCHAR(64),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- ── 15. Sampling Records (FR-04.4-13, 15, 16) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_sampling_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id       UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    sampling_type       VARCHAR(64)  NOT NULL,
    target_population   VARCHAR(128) NOT NULL,
    population_size     INTEGER,
    sample_size         INTEGER,
    selection_criteria  TEXT,
    sample_description  TEXT,
    findings_summary    TEXT,
    status              VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    created_by          VARCHAR(64),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- ── 16. Audit Findings (FR-04.4-10, 28, 33) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_audit_findings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id         UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    finding_reference     VARCHAR(64)  NOT NULL UNIQUE,
    audit_area            VARCHAR(128) NOT NULL,
    title                 VARCHAR(256) NOT NULL,
    description           TEXT         NOT NULL,
    criteria              TEXT,
    condition             TEXT,
    cause                 TEXT,
    effect                TEXT,
    under_declared_amount NUMERIC(18,2) DEFAULT 0,
    penalty_rate          NUMERIC(6,4)  DEFAULT 0.2000,
    penalty_amount        NUMERIC(18,2) DEFAULT 0,
    interest_amount       NUMERIC(18,2) DEFAULT 0,
    total_tax_impact      NUMERIC(18,2) DEFAULT 0,
    tax_type              VARCHAR(16),
    auditor_analysis      TEXT,
    conclusion            TEXT,
    recommendation        TEXT,
    indicates_fraud       BOOLEAN DEFAULT FALSE,
    fraud_indicators      TEXT,
    fraud_referral_date   TIMESTAMPTZ,
    zone_code             VARCHAR(64),
    caat_exception_id     UUID REFERENCES ca_caat_exceptions(id),
    status                VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    is_significant        BOOLEAN DEFAULT FALSE,
    created_by            VARCHAR(64),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ
);

-- Partial index: fast lookup of fraud findings
CREATE INDEX IF NOT EXISTS idx_ca_findings_fraud
    ON ca_audit_findings(audit_case_id) WHERE indicates_fraud = TRUE;

-- ── 17. Working Papers (FR-04.2-10) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_working_papers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id    UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    paper_reference  VARCHAR(64)  NOT NULL,
    title            VARCHAR(256) NOT NULL,
    category         VARCHAR(64)  NOT NULL,
    work_performed   TEXT         NOT NULL,
    conclusions      TEXT,
    document_url     VARCHAR(512),
    status           VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    prepared_by      VARCHAR(64),
    prepared_at      TIMESTAMPTZ,
    reviewed_by      VARCHAR(64),
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

-- ── 18. Draft Reports (FR-04.4-10, 18, 19, 20) ────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_draft_reports (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id                UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    report_reference             VARCHAR(64) NOT NULL UNIQUE,
    executive_summary            TEXT,
    scope_and_objectives         TEXT,
    methodology                  TEXT,
    findings_summary             TEXT,
    recommended_adjustments      TEXT,
    statutory_recommendations    TEXT,
    ifrs_compliance_notes        TEXT,
    total_principal_tax          NUMERIC(18,2) DEFAULT 0,
    total_penalty                NUMERIC(18,2) DEFAULT 0,
    total_interest               NUMERIC(18,2) DEFAULT 0,
    total_assessment             NUMERIC(18,2) DEFAULT 0,
    status                       VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    team_leader_comments         TEXT,
    team_leader_reviewed_at      TIMESTAMPTZ,
    team_leader_reviewed_by      VARCHAR(64),
    director_comments            TEXT,
    director_reviewed_at         TIMESTAMPTZ,
    director_reviewed_by         VARCHAR(64),
    sent_to_taxpayer_at          TIMESTAMPTZ,
    sent_by                      VARCHAR(64),
    taxpayer_signed_at           TIMESTAMPTZ,
    taxpayer_objection_deadline  TIMESTAMPTZ,
    undelivered                  BOOLEAN DEFAULT FALSE,
    undelivered_reason           TEXT,
    created_by                   VARCHAR(64),
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                   TIMESTAMPTZ
);

-- ── 19. Exit Conferences (FR-04.4-18, 19) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_exit_conferences (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id            UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    scheduled_date           DATE NOT NULL,
    scheduled_time           VARCHAR(16),
    venue                    VARCHAR(256),
    agenda_items             JSONB,
    discussion_notes         TEXT,
    taxpayer_response_notes  TEXT,
    attendees                JSONB,
    attendance_confirmed     BOOLEAN DEFAULT FALSE,
    signed_by_taxpayer       BOOLEAN DEFAULT FALSE,
    signed_date              DATE,
    status                   VARCHAR(32) NOT NULL DEFAULT 'PENDING_SCHEDULE',
    created_by               VARCHAR(64),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ
);

-- ── 20. Assessment Notices (FR-04.4-29, 30, 31, 32) ───────────────────────────
CREATE TABLE IF NOT EXISTS ca_assessment_notices (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id            UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    notice_number            VARCHAR(64) NOT NULL UNIQUE,
    issue_date               DATE NOT NULL,
    statutory_due_date       DATE NOT NULL,
    principal_cit            NUMERIC(18,2) DEFAULT 0,
    principal_vat            NUMERIC(18,2) DEFAULT 0,
    principal_paye           NUMERIC(18,2) DEFAULT 0,
    principal_wht            NUMERIC(18,2) DEFAULT 0,
    principal_total          NUMERIC(18,2) DEFAULT 0,
    penalty_pct              NUMERIC(6,4)  DEFAULT 0.2000,
    penalty_amount           NUMERIC(18,2) DEFAULT 0,
    interest_rate_annual     NUMERIC(6,4)  DEFAULT 0.2800,
    interest_days            INTEGER       DEFAULT 0,
    interest_amount          NUMERIC(18,2) DEFAULT 0,
    total_assessment_due     NUMERIC(18,2) DEFAULT 0,
    objection_status         VARCHAR(32)   DEFAULT 'NONE',
    objection_lodged_at      TIMESTAMPTZ,
    objection_details        TEXT,
    taxpayer_signed          BOOLEAN DEFAULT FALSE,
    taxpayer_signed_at       TIMESTAMPTZ,
    fraud_referral_triggered BOOLEAN DEFAULT FALSE,
    fraud_referral_reason    TEXT,
    fraud_referral_at        TIMESTAMPTZ,
    status                   VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    issued_by                VARCHAR(64),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ
);

-- ── 21. Multi-Zone Allocations (FR-04.4-31, 32, 33) ───────────────────────────
CREATE TABLE IF NOT EXISTS ca_multi_zone_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id   UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    notice_id       UUID REFERENCES ca_assessment_notices(id),
    zone_name       VARCHAR(128) NOT NULL,
    branch_code     VARCHAR(32),
    tax_declared    NUMERIC(18,2) DEFAULT 0,
    audit_adjustment NUMERIC(18,2) DEFAULT 0,
    net_payable     NUMERIC(18,2) DEFAULT 0,
    tax_type        VARCHAR(16),
    period_covered  VARCHAR(32),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 22. Taxpayer Responses (FR-04.4-27, 30) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_taxpayer_responses (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id    UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    notice_id        UUID REFERENCES ca_assessment_notices(id),
    draft_report_id  UUID REFERENCES ca_draft_reports(id),
    response_type    VARCHAR(32) NOT NULL,
    response_text    TEXT        NOT NULL,
    submitted_by     VARCHAR(256),
    submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    document_urls    JSONB,
    status           VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
    reviewed_by      VARCHAR(64),
    reviewed_at      TIMESTAMPTZ,
    auditor_notes    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 23. Approval Steps (FR-04.4-18) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_approval_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id   UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    entity_type     VARCHAR(32) NOT NULL,
    entity_id       UUID        NOT NULL,
    approval_level  SMALLINT    NOT NULL,
    approver_role   VARCHAR(64) NOT NULL,
    approver_id     VARCHAR(64) NOT NULL,
    decision        VARCHAR(32) NOT NULL,
    comments        TEXT,
    decided_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique index (no inline WHERE on CREATE TABLE — avoids PostgreSQL C4 bug)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_ca_approval_active
    ON ca_approval_steps(audit_case_id, entity_type, entity_id, approval_level)
    WHERE decision = 'APPROVED';

-- ── 24. All standard indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ca_doc_reqs_case        ON ca_document_requests(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_query_sheets_case    ON ca_query_sheets(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_assertions_case      ON ca_audit_assertions(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_reports_case         ON ca_execution_reports(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_caat_elig_case       ON ca_caat_eligibility(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_caat_runs_case       ON ca_caat_runs(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_caat_rules_run       ON ca_caat_rules(caat_run_id);
CREATE INDEX IF NOT EXISTS idx_ca_caat_exc_case        ON ca_caat_exceptions(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_caat_exc_run         ON ca_caat_exceptions(caat_run_id);
CREATE INDEX IF NOT EXISTS idx_ca_benford_run          ON ca_benford_analysis(caat_run_id);
CREATE INDEX IF NOT EXISTS idx_ca_entry_conf_case      ON ca_entry_conferences(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_bs_items_case        ON ca_balance_sheet_items(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_benchmark_case       ON ca_benchmark_analyses(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_tp_match_case        ON ca_third_party_matches(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_reconcil_case        ON ca_reconciliations(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_sampling_case        ON ca_sampling_records(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_findings_case        ON ca_audit_findings(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_working_papers_case  ON ca_working_papers(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_draft_reports_case   ON ca_draft_reports(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_exit_conf_case       ON ca_exit_conferences(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_notices_case         ON ca_assessment_notices(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_zone_alloc_case      ON ca_multi_zone_allocations(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_tp_responses_case    ON ca_taxpayer_responses(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_approval_steps_case  ON ca_approval_steps(audit_case_id);
CREATE INDEX IF NOT EXISTS idx_ca_approval_entity      ON ca_approval_steps(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ap_cases_tin            ON ap_audit_cases(tin);
CREATE INDEX IF NOT EXISTS idx_ap_cases_due_date       ON ap_audit_cases(due_date);
CREATE INDEX IF NOT EXISTS idx_ap_cases_risk_cat       ON ap_audit_cases(risk_category);
CREATE INDEX IF NOT EXISTS idx_ap_cases_ca_workflow    ON ap_audit_cases(ca_workflow_status);
