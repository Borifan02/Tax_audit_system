CREATE TABLE qa_action_plans (
    id UUID PRIMARY KEY,
    audit_case_id UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    objectives TEXT NOT NULL,
    review_scope TEXT NOT NULL,
    reviewer VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL, -- DRAFT, SUBMITTED, APPROVED, REJECTED
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE qa_review_observations (
    id UUID PRIMARY KEY,
    audit_case_id UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    observation_text TEXT NOT NULL,
    required_action TEXT,
    procedural_adjustment BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE qa_exit_conferences (
    id UUID PRIMARY KEY,
    audit_case_id UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    agenda TEXT NOT NULL,
    scheduled_date TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL, -- DRAFT, SCHEDULED, CONDUCTED
    conference_notes TEXT,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE qa_recommendations (
    id UUID PRIMARY KEY,
    audit_case_id UUID NOT NULL REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    recommendation TEXT NOT NULL,
    assigned_to VARCHAR(64),
    deadline TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL, -- OPEN, VERIFIED, CLOSED, OVERDUE
    evidence_of_correction TEXT,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

ALTER TABLE ap_audit_cases ADD COLUMN qa_current_phase VARCHAR(64);

CREATE INDEX idx_qa_action_plans_case ON qa_action_plans(audit_case_id);
CREATE INDEX idx_qa_observations_case ON qa_review_observations(audit_case_id);
CREATE INDEX idx_qa_conferences_case ON qa_exit_conferences(audit_case_id);
CREATE INDEX idx_qa_recommendations_case ON qa_recommendations(audit_case_id);
