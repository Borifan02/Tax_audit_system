-- V39__seed_desk_audit_case.sql
-- Insert a Desk Audit case assigned to auditor a0000001-0000-0000-0000-000000000001 (u-aud-aa1a)

INSERT INTO ap_audit_cases (
    id, plan_id, created_by, case_number, audit_type, status, risk_score, risk_category, 
    due_date, assigned_auditor_id, assigned_team_leader_id, taxpayer_id, taxpayer_name, tax_center_code
) VALUES (
    '18fef117-3579-4e7b-be25-5073ba76d30b',
    COALESCE((SELECT id FROM ap_annual_audit_plans LIMIT 1), '00000000-0000-0000-0000-000000000001'::uuid),
    'system',
    'DA-2026-001-CASE', 'DESK_AUDIT', 'AUDITOR_ASSIGNED', 85, 'HIGH',
    '2026-12-31', 'a0000001-0000-0000-0000-000000000001', 'u-tl-federal-lto1-desk-1', 'TIN-123456789', 'Acme Corp', 'TC01'
) ON CONFLICT (id) DO UPDATE SET assigned_auditor_id = 'a0000001-0000-0000-0000-000000000001';


