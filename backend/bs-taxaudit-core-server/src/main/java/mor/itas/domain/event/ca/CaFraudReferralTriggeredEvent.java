package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-28 — Fraud indicators detected; case escalated to Intelligence &
 * Tax Fraud Investigation sub-process.
 * Clear criteria must exist to label a case as potential fraud.
 * Mirrors TpFraudReferralEvent pattern.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaFraudReferralTriggeredEvent {
    private UUID   caseId;
    private UUID   findingId;          // nullable — source finding if triggered from finding
    private UUID   draftReportId;      // nullable — if triggered during report review
    private String fraudIndicators;    // description of fraud criteria met
    private String triggeredById;
    private String triggerSource;      // FINDING | REPORT_REVIEW | TEAM_LEADER | DIRECTOR
    /** caWorkflowStatus transitions to FRAUD_INVESTIGATION after this event */
    private String previousWorkflowStatus;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
