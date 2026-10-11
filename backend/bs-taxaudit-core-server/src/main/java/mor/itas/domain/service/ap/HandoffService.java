package mor.itas.domain.service.ap;

import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import mor.itas.domain.aggregate.ap.TeamAssignmentAggregate;
import mor.itas.domain.valueobject.HandoffRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Domain Service for Handoff Processing
 * Manages case transfer from committee to execution workspace
 */
@Service
@RequiredArgsConstructor
public class HandoffService {

    /**
     * Generate unique case code for execution
     * Format: JAC-{REGION}-{YEAR}-{SEQUENCE}
     */
    public String generateCaseCode(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        String year = String.valueOf(OffsetDateTime.now().getYear());
        String sequence = String.format("%06d", committeeCase.getCaseId().hashCode() & 0xFFFFFF);
        return "JAC-" + year + "-" + sequence;
    }

    /**
     * Create handoff record snapshot
     */
    public HandoffRecord createHandoffRecord(CommitteeCaseAggregate committeeCase,
                                             TeamAssignmentAggregate teamAssignment,
                                             String committeeSummary,
                                             String keyFindings,
                                             UUID createdBy) {
        if (committeeCase == null || teamAssignment == null) {
            throw new IllegalArgumentException("Case and team assignment cannot be null");
        }

        if (!committeeCase.getStatus().equals(CommitteeCaseAggregate.CommitteeCaseStatus.APPROVED)) {
            throw new IllegalStateException("Only approved cases can be transferred");
        }

        String caseCode = committeeCase.getCaseCode() != null ? 
                committeeCase.getCaseCode() : generateCaseCode(committeeCase);

        return HandoffRecord.builder()
                .handoffRecordId(UUID.randomUUID())
                .committeeCaseId(committeeCase.getCaseId())
                .caseCode(caseCode)
                .teamLeadId(teamAssignment.getAppointedTeamLeadId())
                .teamMemberIds(teamAssignment.getOfficialTeamMemberIds())
                .committeeSummary(committeeSummary)
                .keyFindings(keyFindings)
                .decision(committeeCase.getDecision().name())
                .handoffDate(OffsetDateTime.now())
                .createdBy(createdBy)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    /**
     * Validate handoff record is valid
     */
    public void validateHandoffRecord(HandoffRecord handoffRecord) {
        if (handoffRecord == null) {
            throw new IllegalArgumentException("Handoff record cannot be null");
        }

        if (handoffRecord.getHandoffRecordId() == null || handoffRecord.getCaseCode() == null ||
                handoffRecord.getTeamLeadId() == null || handoffRecord.getTeamMemberIds() == null ||
                handoffRecord.getTeamMemberIds().isEmpty()) {
            throw new IllegalStateException("Handoff record is invalid or incomplete");
        }
    }

    /**
     * Validate case code uniqueness
     * In production, this would check against database
     */
    public boolean isCaseCodeUnique(String caseCode) {
        if (caseCode == null || caseCode.trim().isEmpty()) {
            return false;
        }
        // Database-level constraint ensures uniqueness
        return true;
    }

    /**
     * Confirm handoff delivery
     */
    public void confirmHandoffDelivery(HandoffRecord handoffRecord, UUID executionCaseId) {
        if (handoffRecord == null) {
            throw new IllegalArgumentException("Handoff record cannot be null");
        }

        if (executionCaseId == null) {
            throw new IllegalArgumentException("Execution case ID cannot be null");
        }

        handoffRecord.setExecutionCaseId(executionCaseId);
    }

    /**
     * Get team member count for handoff
     */
    public int getTeamMemberCount(HandoffRecord handoffRecord) {
        if (handoffRecord == null) {
            throw new IllegalArgumentException("Handoff record cannot be null");
        }

        return handoffRecord.getTeamMemberIds() != null ? handoffRecord.getTeamMemberIds().size() : 0;
    }

    /**
     * Check if handoff is ready for delivery
     */
    public boolean isReadyForDelivery(HandoffRecord handoffRecord) {
        if (handoffRecord == null) {
            return false;
        }

        return handoffRecord.getHandoffRecordId() != null &&
                handoffRecord.getCaseCode() != null &&
                handoffRecord.getTeamLeadId() != null &&
                handoffRecord.getTeamMemberIds() != null &&
                !handoffRecord.getTeamMemberIds().isEmpty() &&
                handoffRecord.getHandoffDate() != null;
    }

    /**
     * Calculate handoff processing time
     */
    public long getProcessingTimeMinutes(CommitteeCaseAggregate committeeCase, HandoffRecord handoffRecord) {
        if (committeeCase == null || handoffRecord == null) {
            throw new IllegalArgumentException("Case and handoff record cannot be null");
        }

        if (committeeCase.getDecisionDate() == null || handoffRecord.getHandoffDate() == null) {
            return 0;
        }

        return java.time.temporal.ChronoUnit.MINUTES.between(
                committeeCase.getDecisionDate(),
                handoffRecord.getHandoffDate()
        );
    }
}
