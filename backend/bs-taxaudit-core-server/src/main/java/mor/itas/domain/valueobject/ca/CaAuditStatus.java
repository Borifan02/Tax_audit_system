package mor.itas.domain.valueobject.ca;

/**
 * High-level operational status for Comprehensive Audit cases.
 * Used in business rule guards and status-transition validations.
 * FR-04.4.
 */
public enum CaAuditStatus {
    AUDITOR_ASSIGNED,
    CAAT_ASSESSMENT_PENDING,
    CAAT_ELIGIBLE,
    CAAT_INELIGIBLE,
    ENTRY_CONFERENCE_SCHEDULED,
    ENTRY_CONFERENCE_CONDUCTED,
    FIELDWORK_IN_PROGRESS,
    EXECUTION_REPORT_SUBMITTED,
    TEAM_LEADER_REVIEW,
    DIRECTOR_REVIEW,
    DRAFT_REPORT_SUBMITTED,
    DRAFT_REPORT_FINALIZED,
    NOTICE_ISSUED,
    TAXPAYER_RESPONSE_RECEIVED,
    OBJECTION_LODGED,
    COMPLETED,
    FRAUD_REFERRED
}
