package mor.itas.domain.aggregate;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Committee Case Aggregate Root (Domain Model)
 * Represents a tax case awaiting committee review and decision
 * This is the domain model (not JPA entity)
 */
@Data
@AllArgsConstructor
@Builder
public class CommitteeCaseAggregate {

    private UUID caseId;
    private UUID originalCaseId;
    private String caseCode;

    // Taxpayer Context
    private UUID taxpayerId;
    private String taxpayerName;
    private String taxIdNumber;
    private String segment;
    private String industry;

    // Risk Context
    private Integer riskScore;
    private String riskPriority;
    private Map<String, Object> riskCriteria;

    // Case Lifecycle
    private CommitteeCaseStatus status;
    private OffsetDateTime createdDate;
    private OffsetDateTime committeeDeadline;
    private OffsetDateTime extendedDeadline;
    private Integer extensionCount;

    // Team Lead
    private UUID teamLeadId;

    // Ownership
    private UUID currentOwnerId;
    private OffsetDateTime ownershipAcquiredAt;
    
    private UUID handoffRecordId;
    private OffsetDateTime handoffDate;

    // Explicit getters/setters for failing methods
    public String getStatus() { return this.status != null ? this.status.name() : null; }
    public UUID getTeamLeadId() { return this.teamLeadId; }
    public UUID getChairpersonId() { return this.chairpersonId; }
    public void setHandoffRecordId(UUID id) { this.handoffRecordId = id; }
    public void setHandoffDate(OffsetDateTime date) { this.handoffDate = date; }
    public UUID getCaseId() { return this.caseId; }
    public OffsetDateTime getExtendedDeadline() { return this.extendedDeadline; }
    public OffsetDateTime getCommitteeDeadline() { return this.committeeDeadline; }


    // Decision
    private CommitteeCaseDecision decision;
    private OffsetDateTime decisionDate;
    private String decisionReason;
    private UUID chairpersonId;

    // Removed duplicates

    // Events
    @Builder.Default
    private List<DomainEvent> uncommittedEvents = new ArrayList<>();

    // ===== BUSINESS METHODS =====

    /**
     * Take ownership of case for review
     */
    public void takeOwnership(UUID memberId) {
        if (this.currentOwnerId != null && !this.currentOwnerId.equals(memberId)) {
            throw new IllegalStateException("Case already owned by another member");
        }
        this.currentOwnerId = memberId;
        this.ownershipAcquiredAt = OffsetDateTime.now();
        raiseEvent(new CaseOwnershipAcquired(this.caseId, memberId));
    }

    /**
     * Release ownership of case
     */
    public void releaseOwnership() {
        if (this.currentOwnerId == null) {
            throw new IllegalStateException("Case is not owned");
        }
        UUID previousOwner = this.currentOwnerId;
        this.currentOwnerId = null;
        this.ownershipAcquiredAt = null;
        raiseEvent(new CaseOwnershipReleased(this.caseId, previousOwner));
    }

    /**
     * Transition to voting phase
     */
    public void transitionToVotingPhase() {
        if (!status.equals(CommitteeCaseStatus.PENDING_VOTES)) {
            throw new IllegalStateException("Case must be in PENDING_VOTES state");
        }
        raiseEvent(new CaseVotingPhaseStarted(this.caseId));
    }

    /**
     * Transition to viability phase
     * Can be triggered from TEAM_ASSIGNED (after team assignment)
     */
    public void transitionToViabilityPhase() {
        if (!status.equals(CommitteeCaseStatus.TEAM_ASSIGNED)) {
            throw new IllegalStateException("Case must be in TEAM_ASSIGNED state to transition to viability. Current: " + status);
        }
        this.status = CommitteeCaseStatus.PENDING_VIABILITY;
        raiseEvent(new CaseViabilityPhaseStarted(this.caseId));
    }

    /**
     * Finalize viability (approve or reject)
     */
    public void finalizeViability(CommitteeCaseDecision decision, String reason, UUID chairpersonId) {
        if (!status.equals(CommitteeCaseStatus.PENDING_VIABILITY)
                && !status.equals(CommitteeCaseStatus.WAITING_ASSIGNMENT)) {
            throw new IllegalStateException("Case must be in PENDING_VIABILITY or WAITING_ASSIGNMENT state");
        }
        if (decision == null) {
            throw new IllegalArgumentException("Decision cannot be null");
        }
        
        this.decision = decision;
        this.decisionDate = OffsetDateTime.now();
        this.decisionReason = reason;
        this.chairpersonId = chairpersonId;
        
        if (decision == CommitteeCaseDecision.APPROVED) {
            this.status = CommitteeCaseStatus.APPROVED;
            raiseEvent(new CaseApproved(this.caseId, chairpersonId));
        } else {
            this.status = CommitteeCaseStatus.REJECTED;
            raiseEvent(new CaseRejected(this.caseId, chairpersonId, reason));
        }
    }

    /**
     * Extend SLA deadline
     */
    public void extendDeadline(OffsetDateTime newDeadline, String reason) {
        if (this.extensionCount >= 2) {
            throw new IllegalStateException("Maximum extension limit (2) reached");
        }
        if (newDeadline.isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("New deadline must be in the future");
        }
        
        this.extendedDeadline = newDeadline;
        this.extensionCount++;
        raiseEvent(new SLAExtended(this.caseId, newDeadline, reason));
    }

    /**
     * Validate readiness for transfer to execution
     */
    public boolean isReadyForTransfer() {
        return this.status == CommitteeCaseStatus.APPROVED
            && this.caseCode != null
            && this.handoffRecordId != null
            && this.chairpersonId != null;
    }

    /**
     * Check if voting is currently allowed
     */
    public boolean isVotingPhase() {
        return this.status == CommitteeCaseStatus.PENDING_VOTES;
    }

    /**
     * Check if case has expired deadline
     */
    public boolean isOverdue() {
        OffsetDateTime deadline = this.extendedDeadline != null ? this.extendedDeadline : this.committeeDeadline;
        return OffsetDateTime.now().isAfter(deadline);
    }

    /**
     * Raise domain event
     */
    public void raiseEvent(DomainEvent event) {
        this.uncommittedEvents.add(event);
    }

    /**
     * Get and clear uncommitted events
     */
    public List<DomainEvent> getUncommittedEvents() {
        return new ArrayList<>(this.uncommittedEvents);
    }

    public void clearUncommittedEvents() {
        this.uncommittedEvents.clear();
    }

    // ===== ENUMS =====

    public enum CommitteeCaseStatus {
        PENDING_VOTES,
        PENDING_VIABILITY,
        APPROVED,
        REJECTED,
        TEAM_ASSIGNED,
        WAITING_ASSIGNMENT
    }

    public enum CommitteeCaseDecision {
        APPROVED,
        REJECTED
    }

    // ===== DOMAIN EVENTS =====

    public abstract static class DomainEvent {
        private final UUID aggregateId;
        private final OffsetDateTime occurredAt;

        public DomainEvent(UUID aggregateId) {
            this.aggregateId = aggregateId;
            this.occurredAt = OffsetDateTime.now();
        }

        public UUID getAggregateId() { return aggregateId; }
        public OffsetDateTime getOccurredAt() { return occurredAt; }
    }

    public static class CaseOwnershipAcquired extends DomainEvent {
        private final UUID memberId;
        public CaseOwnershipAcquired(UUID caseId, UUID memberId) {
            super(caseId);
            this.memberId = memberId;
        }
        public UUID getMemberId() { return memberId; }
    }

    public static class CaseOwnershipReleased extends DomainEvent {
        private final UUID memberId;
        public CaseOwnershipReleased(UUID caseId, UUID memberId) {
            super(caseId);
            this.memberId = memberId;
        }
        public UUID getMemberId() { return memberId; }
    }

    public static class CaseVotingPhaseStarted extends DomainEvent {
        public CaseVotingPhaseStarted(UUID caseId) { super(caseId); }
    }

    public static class CaseViabilityPhaseStarted extends DomainEvent {
        public CaseViabilityPhaseStarted(UUID caseId) { super(caseId); }
    }

    public static class CaseApproved extends DomainEvent {
        private final UUID chairpersonId;
        public CaseApproved(UUID caseId, UUID chairpersonId) {
            super(caseId);
            this.chairpersonId = chairpersonId;
        }
        public UUID getChairpersonId() { return chairpersonId; }
    }

    public static class CaseRejected extends DomainEvent {
        private final UUID chairpersonId;
        private final String reason;
        public CaseRejected(UUID caseId, UUID chairpersonId, String reason) {
            super(caseId);
            this.chairpersonId = chairpersonId;
            this.reason = reason;
        }
        public UUID getChairpersonId() { return chairpersonId; }
        public String getReason() { return reason; }
    }

    public static class SLAExtended extends DomainEvent {
        private final OffsetDateTime newDeadline;
        private final String reason;
        public SLAExtended(UUID caseId, OffsetDateTime newDeadline, String reason) {
            super(caseId);
            this.newDeadline = newDeadline;
            this.reason = reason;
        }
        public OffsetDateTime getNewDeadline() { return newDeadline; }
        public String getReason() { return reason; }
    }
}
