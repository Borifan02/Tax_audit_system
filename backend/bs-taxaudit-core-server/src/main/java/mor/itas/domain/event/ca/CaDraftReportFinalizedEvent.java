package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-18 — Draft report received final Director approval and is now FINALIZED.
 * Report is ready to be dispatched to taxpayer (triggers CaReportDispatchedToTaxpayerEvent).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaDraftReportFinalizedEvent {
    private UUID       caseId;
    private UUID       draftReportId;
    private String     reportReference;
    private BigDecimal totalAssessment;
    private String     finalizedById;
    private String     directorComments;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
