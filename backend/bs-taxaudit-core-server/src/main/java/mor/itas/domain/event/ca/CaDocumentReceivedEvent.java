package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-04 — Taxpayer uploaded the requested documents.
 * Auditor is notified; document request status moves to RECEIVED.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaDocumentReceivedEvent {
    private UUID   caseId;
    private UUID   requestId;
    private String requestedDocument;
    private String submittedByTaxpayer;
    private String documentUrl;
    private String recordedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
