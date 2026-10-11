package mor.itas.domain.valueobject.ca;

/**
 * Possible decisions at each approval gate in the CA workflow.
 * FR-04.4-18.
 */
public enum CaApprovalDecision {
    APPROVED,
    REJECTED,
    RETURNED_FOR_CORRECTION
}
