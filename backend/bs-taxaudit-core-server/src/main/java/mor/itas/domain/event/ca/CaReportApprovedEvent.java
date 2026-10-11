package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-10, 18 — An artifact (execution report OR draft report) has been approved.
 * approvalLevel: 1=TeamLeader, 2=Director.
 * For execution reports: level-1 approval enables draft report creation.
 * For draft reports: level-2 approval (Director) enables finalization + dispatch.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaReportApprovedEvent {
    private UUID   caseId;
    private UUID   entityId;           // executionReportId or draftReportId
    private String entityType;         // EXECUTION_REPORT | DRAFT_REPORT
    private int    approvalLevel;      // 1 or 2
    private String approvedById;
    private String approverRole;       // TEAM_LEADER | DIRECTOR
    private String comments;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
