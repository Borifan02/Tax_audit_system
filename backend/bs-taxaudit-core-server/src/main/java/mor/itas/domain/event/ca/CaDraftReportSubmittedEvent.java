package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-10, 18 — Auditor submitted the full draft audit report.
 * Totals are auto-computed from confirmed findings.
 * Workflow advances to APPROVALS phase; Team Leader is notified.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaDraftReportSubmittedEvent {
    private UUID       caseId;
    private UUID       draftReportId;
    private String     reportReference;   // DR-XXXXXX-001
    private BigDecimal totalPrincipalTax;
    private BigDecimal totalPenalty;
    private BigDecimal totalAssessment;
    private int        confirmedFindingsCount;
    private String     submittedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
