CREATE TABLE da_evidence (
    id UUID PRIMARY KEY,
    audit_case_id UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_source VARCHAR(64) NOT NULL, -- INTERNAL, TAXPAYER, THIRD_PARTY
    document_url VARCHAR(512),
    status VARCHAR(32) NOT NULL,
    uploaded_by VARCHAR(64),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE da_audit_procedures (
    id UUID PRIMARY KEY,
    audit_case_id UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    procedure_description TEXT NOT NULL,
    observation TEXT,
    finding TEXT,
    issue_identified BOOLEAN DEFAULT FALSE,
    conclusion TEXT,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE da_draft_reports (
    id UUID PRIMARY KEY,
    audit_case_id UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    report_content TEXT NOT NULL,
    status VARCHAR(32) NOT NULL, -- DRAFT, SUBMITTED, APPROVED, REJECTED
    significant_issues_identified BOOLEAN DEFAULT FALSE,
    escalated_to_comprehensive BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    team_leader_comments TEXT,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(64)
);

ALTER TABLE ap_audit_cases ADD COLUMN da_current_phase VARCHAR(64);

CREATE INDEX idx_da_evidence_case ON da_evidence(audit_case_id);
CREATE INDEX idx_da_procedures_case ON da_audit_procedures(audit_case_id);
CREATE INDEX idx_da_reports_case ON da_draft_reports(audit_case_id);
