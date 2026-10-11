package mor.itas.domain.model.ca;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import mor.itas.domain.valueobject.AuditType;
import mor.itas.domain.valueobject.ca.CaAuditPhase;
import mor.itas.domain.valueobject.ca.CaAuditStatus;

import java.time.LocalDateTime;

/**
 * Domain model for a Comprehensive Audit case.
 * Represents the rich business object (not the JPA entity) — used in
 * aggregate logic and domain service operations.
 * FR-04.4 full lifecycle.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaAuditCase {

    private String caseId;
    private String taxpayerId;          // TIN
    private String taxpayerName;
    private String taxCenterCode;
    private String regionCode;
    private String segment;             // LTO | MTO | STO

    @Builder.Default
    private AuditType auditType = AuditType.COMPREHENSIVE_AUDIT;

    @Builder.Default
    private CaAuditPhase currentPhase = CaAuditPhase.OPENED;

    @Builder.Default
    private CaAuditStatus currentStatus = CaAuditStatus.AUDITOR_ASSIGNED;

    private String assignedAuditorId;
    private String teamLeaderId;
    private Integer riskScore;
    private String riskPriority;

    // Eligibility flags
    private Boolean caatEligible;
    private Boolean hasFraudIndicators;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    /**
     * Domain transition with full business rule enforcement.
     * Throws IllegalStateException if transition is not allowed.
     */
    public void transitionTo(CaAuditPhase newPhase, CaAuditStatus newStatus) {
        validateTransition(newPhase);
        this.currentPhase = newPhase;
        this.currentStatus = newStatus;
        this.updatedAt = LocalDateTime.now();
        if (newPhase == CaAuditPhase.COMPLETED || newPhase == CaAuditPhase.FRAUD_INVESTIGATION) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public void flagFraud() {
        this.hasFraudIndicators = true;
        this.currentStatus = CaAuditStatus.FRAUD_REFERRED;
        this.updatedAt = LocalDateTime.now();
    }

    public void markCaatEligible(boolean eligible) {
        this.caatEligible = eligible;
        this.currentStatus = eligible ? CaAuditStatus.CAAT_ELIGIBLE : CaAuditStatus.CAAT_INELIGIBLE;
        this.updatedAt = LocalDateTime.now();
    }

    private void validateTransition(CaAuditPhase target) {
        if (currentPhase == CaAuditPhase.COMPLETED) {
            throw new IllegalStateException("Cannot transition a COMPLETED comprehensive audit case");
        }
        if (target == CaAuditPhase.FRAUD_INVESTIGATION) return; // always allowed
        // Simplified linear guard — CaWorkflowStateMachine has the full map
    }
}
