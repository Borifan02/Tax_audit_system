package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-05, 09 — Auditor disposed a query; taxpayer response received and accepted.
 * Status moves to RESOLVED.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaQuerySheetResolvedEvent {
    private UUID   caseId;
    private UUID   queryId;
    private String question;
    private String taxpayerResponse;
    private String resolutionNotes;
    private String resolvedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
