package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-10 — Auditor submitted the execution report to the Team Leader.
 * Workflow advances to EXECUTION_REPORT phase.
 * Team Leader receives notification to review.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaExecutionReportSubmittedEvent {
    private UUID    caseId;
    private UUID    reportId;
    private boolean caatEligible;
    private String  submittedById;
    private String  reviewerRole;    // always TEAM_LEADER at this stage
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
