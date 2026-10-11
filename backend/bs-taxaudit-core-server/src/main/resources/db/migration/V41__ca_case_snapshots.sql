-- ============================================================
-- V41 — Comprehensive Audit Case Snapshots
-- Stores full workspace state snapshots for CA cases
-- ============================================================
CREATE TABLE IF NOT EXISTS ca_case_snapshots (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id       UUID NOT NULL UNIQUE REFERENCES ap_audit_cases(id) ON DELETE CASCADE,
    snapshot_data TEXT,
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_case_snapshots_case_id ON ca_case_snapshots(case_id);
