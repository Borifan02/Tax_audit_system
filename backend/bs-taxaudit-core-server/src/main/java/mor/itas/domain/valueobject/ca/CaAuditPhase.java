package mor.itas.domain.valueobject.ca;

/**
 * All workflow phases for a Comprehensive Audit case.
 * Mirrors ca_workflow_status column values on ap_audit_cases.
 * FR-04.4 full lifecycle.
 */
public enum CaAuditPhase {
    OPENED,
    CAAT_AND_PLANNING,
    FIELDWORK,
    EXECUTION_REPORT,
    DRAFT_REPORT,
    APPROVALS,
    NOTICE_SENT,
    TAXPAYER_RESPONSE,
    COMPLETED,
    FRAUD_INVESTIGATION
}
