-- V38__fix_desk_team_leader.sql
UPDATE ap_audit_cases 
SET assigned_team_leader_id = 'u-tl-federal-lto1-desk-1' 
WHERE audit_type = 'DESK_AUDIT';
