package mor.itas.domain.aggregate.ca;

import lombok.*;
import mor.itas.domain.aggregate.AggregateRoot;
import mor.itas.domain.event.ca.*;
import mor.itas.domain.model.ca.CaAuditCase;
import mor.itas.domain.valueobject.ca.CaAuditPhase;
import mor.itas.domain.valueobject.ca.CaAuditStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Comprehensive Audit Case Aggregate Root.
 * Enforces all invariants and raises domain events on state transitions.
 * Follows CommitteeCaseAggregate pattern exactly.
 * FR-04.4 full lifecycle.
 */
@Data
@Builder
@AllArgsConstructor
public class CaAuditCaseAggregate extends AggregateRoot {

    private UUID caseId;
    private String caseNumber;
    private String taxpayerName;
    private String taxpayerId;     // TIN
    private String taxCenterCode;
    private String segment;        // LTO | MTO | STO

    @Builder.Default
    private CaAuditPhase currentPhase = CaAuditPhase.OPENED;

    @Builder.Default
    private CaAuditStatus currentStatus = CaAuditStatus.AUDITOR_ASSIGNED;

    private String assignedAuditorId;
    private String teamLeaderId;
    private Integer riskScore;

    private Boolean caatEligible;
    private Boolean hasFraudIndicators;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public CaAuditCaseAggregate() {
        super();
        this.currentPhase = CaAuditPhase.OPENED;
        this.currentStatus = CaAuditStatus.AUDITOR_ASSIGNED;
        this.hasFraudIndicators = false;
    }

    // ── Business operations ───────────────────────────────────────────────────

    /**
     * Advance the workflow to the next phase.
     * Raises CaPhaseTransitionEvent for every transition.
     */
    public void advanceTo(CaAuditPhase newPhase, CaAuditStatus newStatus, String actorId) {
        if (this.currentPhase == CaAuditPhase.COMPLETED) {
            throw new IllegalStateException(
                "CA case " + caseId + " is already COMPLETED and cannot be advanced");
        }
        CaAuditPhase prev = this.currentPhase;
        this.currentPhase = newPhase;
        this.currentStatus = newStatus;
        this.updatedAt = OffsetDateTime.now();

        registerEvent(CaPhaseTransitionEvent.builder()
            .caseId(caseId)
            .previousPhase(prev)
            .newPhase(newPhase)
            .triggeredById(actorId)
            .build());
    }

    /**
     * Record CAAT eligibility decision. FR-04.4-01.
     */
    public void recordCaatEligibility(boolean eligible, String actorId) {
        this.caatEligible = eligible;
        this.currentStatus = eligible ? CaAuditStatus.CAAT_ELIGIBLE : CaAuditStatus.CAAT_INELIGIBLE;
        this.updatedAt = OffsetDateTime.now();
    }

    /**
     * Mark fraud indicators detected — side-exit to FRAUD_INVESTIGATION. FR-04.4-28.
     */
    public void escalateToFraudInvestigation(UUID findingId, String fraudIndicators, String actorId) {
        this.hasFraudIndicators = true;
        this.currentStatus = CaAuditStatus.FRAUD_REFERRED;
        this.updatedAt = OffsetDateTime.now();

        registerEvent(CaFraudReferralEvent.builder()
            .caseId(caseId)
            .findingId(findingId)
            .referringUserId(actorId)
            .fraudIndicators(fraudIndicators)
            .build());

        registerEvent(CaPhaseTransitionEvent.builder()
            .caseId(caseId)
            .previousPhase(currentPhase)
            .newPhase(CaAuditPhase.FRAUD_INVESTIGATION)
            .triggeredById(actorId)
            .build());
    }

    /**
     * Issue assessment notice. FR-04.4-29.
     */
    public void recordNoticeIssued(UUID noticeId, String noticeNumber,
                                   java.math.BigDecimal totalDue,
                                   java.time.LocalDate dueDate, String actorId) {
        registerEvent(CaNoticeIssuedEvent.builder()
            .caseId(caseId)
            .noticeId(noticeId)
            .noticeNumber(noticeNumber)
            .totalAssessmentDue(totalDue)
            .statutoryDueDate(dueDate)
            .issuedById(actorId)
            .build());
    }

    /**
     * Factory: reconstruct from domain model.
     */
    public static CaAuditCaseAggregate from(CaAuditCase model) {
        return CaAuditCaseAggregate.builder()
            .caseId(UUID.fromString(model.getCaseId()))
            .taxpayerName(model.getTaxpayerName())
            .taxpayerId(model.getTaxpayerId())
            .taxCenterCode(model.getTaxCenterCode())
            .segment(model.getSegment())
            .currentPhase(model.getCurrentPhase())
            .currentStatus(model.getCurrentStatus())
            .assignedAuditorId(model.getAssignedAuditorId())
            .teamLeaderId(model.getTeamLeaderId())
            .riskScore(model.getRiskScore())
            .caatEligible(model.getCaatEligible())
            .hasFraudIndicators(Boolean.TRUE.equals(model.getHasFraudIndicators()))
            .build();
    }
}
