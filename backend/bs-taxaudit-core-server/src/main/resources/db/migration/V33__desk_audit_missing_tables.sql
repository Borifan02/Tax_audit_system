-- V33: Missing Desk Audit execution tables not included in V32
-- These are required by the DeskAuditExecutionUseCase JPA entities

CREATE TABLE IF NOT EXISTS da_queries (
    id            UUID PRIMARY KEY,
    case_id       UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    reference     VARCHAR(64),
    subject       VARCHAR(255),
    question      TEXT,
    statutory_basis TEXT,
    due_date      VARCHAR(32),
    taxpayer_response TEXT,
    resolution_notes  TEXT,
    status        VARCHAR(64),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS da_findings (
    id                      UUID PRIMARY KEY,
    case_id                 UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    finding_reference       VARCHAR(64),
    audit_area              VARCHAR(128),
    title                   TEXT,
    description             TEXT,
    criteria                TEXT,
    condition               TEXT,
    cause                   TEXT,
    effect                  TEXT,
    under_declared_amount   NUMERIC(18,2),
    penalty_rate            NUMERIC(10,4),
    penalty_amount          NUMERIC(18,2),
    interest_amount         NUMERIC(18,2),
    total_tax_impact        NUMERIC(18,2),
    auditor_analysis        TEXT,
    conclusion              TEXT,
    recommendation          TEXT,
    status                  VARCHAR(64),
    is_significant          BOOLEAN DEFAULT FALSE,
    related_procedure_id    VARCHAR(64),
    related_query_id        VARCHAR(64),
    related_working_paper_id VARCHAR(64),
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS da_working_papers (
    id                   UUID PRIMARY KEY,
    case_id              UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    reference            VARCHAR(64),
    title                TEXT,
    category             VARCHAR(128),
    prepared_by          VARCHAR(128),
    paper_date           VARCHAR(32),
    work_performed       TEXT,
    conclusions          TEXT,
    status               VARCHAR(64),
    related_procedure_id VARCHAR(64),
    related_finding_id   VARCHAR(64),
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS da_case_snapshots (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id       UUID NOT NULL UNIQUE REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    snapshot_data TEXT,
    last_saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_da_queries_case    ON da_queries(case_id);
CREATE INDEX IF NOT EXISTS idx_da_findings_case   ON da_findings(case_id);
CREATE INDEX IF NOT EXISTS idx_da_wp_case         ON da_working_papers(case_id);
CREATE INDEX IF NOT EXISTS idx_da_snapshot_case   ON da_case_snapshots(case_id);
