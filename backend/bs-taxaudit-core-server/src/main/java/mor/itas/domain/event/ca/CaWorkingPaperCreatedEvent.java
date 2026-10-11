package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.2-10 — Auditor created or uploaded a working paper.
 * Stores complete audit work performed, conclusions, and cross-references.
 * Categories: PLANNING | EVIDENCE | ANALYSIS | FINDINGS | RECONCILIATION
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaWorkingPaperCreatedEvent {
    private UUID   caseId;
    private UUID   workingPaperId;
    private String paperReference;    // WP-XXXXXX-001
    private String title;
    private String category;
    private String preparedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
