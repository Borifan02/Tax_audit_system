package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-14, 28 — Auditor has reviewed a CAAT exception and chosen a disposition.
 * Disposition: FINDING_CREATED | QUERY_ISSUED | DISMISSED
 * If FINDING_CREATED, findingId is populated.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaCaatExceptionReviewedEvent {
    private UUID   caseId;
    private UUID   exceptionId;
    private String ruleCode;
    private String disposition;          // FINDING_CREATED | QUERY_ISSUED | DISMISSED
    private UUID   findingId;            // nullable — set when disposition=FINDING_CREATED
    private String actionTakenNotes;
    private String reviewedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
