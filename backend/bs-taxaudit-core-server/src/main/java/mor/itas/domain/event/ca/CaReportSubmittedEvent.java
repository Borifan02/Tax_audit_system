package mor.itas.domain.event.ca;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Fired when the auditor submits the draft report for approval.
 * Mirrors TpReportSubmittedEvent.
 * FR-04.4-10, 18.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaReportSubmittedEvent {
    private UUID caseId;
    private UUID reportId;
    private String reportReference;
    private String submittedById;

    /** EXECUTION_REPORT | DRAFT_REPORT */
    private String reportType;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
