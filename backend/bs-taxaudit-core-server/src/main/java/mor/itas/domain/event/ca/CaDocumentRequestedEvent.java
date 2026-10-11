package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-04 — Auditor issued a document request to the taxpayer.
 * Triggers notification via taxpayer portal so the taxpayer can upload
 * the requested documents within the configured deadline.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaDocumentRequestedEvent {
    private UUID      caseId;
    private UUID      requestId;
    private String    requestedDocument;
    private String    requestDescription;
    private LocalDate dueDate;
    private String    requestedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
