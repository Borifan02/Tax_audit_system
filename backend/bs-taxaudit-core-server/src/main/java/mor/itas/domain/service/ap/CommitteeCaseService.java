package mor.itas.domain.service.ap;

import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Domain Service for Committee Case Management
 * Enforces business rules and state transitions
 */
@Service
@RequiredArgsConstructor
public class CommitteeCaseService {

    /**
     * Validate case is ready for voting phase
     */
    public void validateCaseForVoting(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }
        if (!committeeCase.getStatus().equals(CommitteeCaseAggregate.CommitteeCaseStatus.PENDING_VOTES)) {
            throw new IllegalStateException("Case must be in PENDING_VOTES state for voting");
        }
    }

    /**
     * Validate case is ready for viability finalization.
     * Requires:
     *  1. Case is in PENDING_VIABILITY state
     *  2. A team lead has been assigned (teamLeadId != null)
     */
    public void validateCaseForFinalization(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }
        if (!committeeCase.getStatus().equals(CommitteeCaseAggregate.CommitteeCaseStatus.PENDING_VIABILITY)
                && !committeeCase.getStatus().equals(CommitteeCaseAggregate.CommitteeCaseStatus.WAITING_ASSIGNMENT)) {
            throw new IllegalStateException("Case must be in PENDING_VIABILITY or WAITING_ASSIGNMENT state");
        }
        if (committeeCase.getTeamLeadId() == null) {
            throw new IllegalStateException(
                "Team leader must be assigned before viability determination. " +
                "Please appoint a team leader first.");
        }
    }

    /**
     * Validate team assignment
     */
    public void validateTeamAssignment(CommitteeCaseAggregate committeeCase, int teamSize) {
        if (teamSize < 2 || teamSize > 5) {
            throw new IllegalStateException("Team must have 2-5 members");
        }
        if (committeeCase.getChairpersonId() == null) {
            throw new IllegalStateException("Chairperson must be set before team assignment");
        }
    }

    /**
     * Transition case to voting phase
     */
    public void transitionToVotingPhase(CommitteeCaseAggregate committeeCase) {
        committeeCase.transitionToVotingPhase();
    }

    /**
     * Transition case to viability phase
     */
    public void transitionToViabilityPhase(CommitteeCaseAggregate committeeCase) {
        committeeCase.transitionToViabilityPhase();
    }

    /**
     * Transition case to approved state
     */
    public void transitionToApprovedState(CommitteeCaseAggregate committeeCase, 
                                         CommitteeCaseAggregate.CommitteeCaseDecision decision, 
                                         String reason, 
                                         UUID chairpersonId) {
        committeeCase.finalizeViability(decision, reason, chairpersonId);
    }

    /**
     * Schedule handoff to execution
     */
    public void scheduleHandoff(CommitteeCaseAggregate committeeCase, UUID handoffRecordId) {
        if (committeeCase.getStatus() != CommitteeCaseAggregate.CommitteeCaseStatus.APPROVED) {
            throw new IllegalStateException("Only approved cases can be handed off");
        }
        committeeCase.setHandoffRecordId(handoffRecordId);
        committeeCase.setHandoffDate(OffsetDateTime.now());
        committeeCase.raiseEvent(
            new CommitteeCaseAggregate.DomainEvent(committeeCase.getCaseId()) {
                @Override
                public String toString() {
                    return "CaseHandoffScheduled";
                }
            }
        );
    }

    /**
     * Check if case has overdue deadline
     */
    public boolean isOverdue(CommitteeCaseAggregate committeeCase) {
        return committeeCase.isOverdue();
    }

    /**
     * Get effective deadline (extended or original)
     */
    public OffsetDateTime getEffectiveDeadline(CommitteeCaseAggregate committeeCase) {
        return committeeCase.getExtendedDeadline() != null 
            ? committeeCase.getExtendedDeadline() 
            : committeeCase.getCommitteeDeadline();
    }

    /**
     * Calculate days remaining
     */
    public long getDaysRemaining(CommitteeCaseAggregate committeeCase) {
        OffsetDateTime deadline = getEffectiveDeadline(committeeCase);
        return java.time.temporal.ChronoUnit.DAYS.between(OffsetDateTime.now(), deadline);
    }
}
