package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-05 — Auditor issued a query sheet to the taxpayer at any audit stage.
 * Taxpayer must respond within a preconfigured number of days.
 * Triggers portal notification.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaQuerySheetCreatedEvent {
    private UUID      caseId;
    private UUID      queryId;
    private String    question;
    private String    requestedInformation;
    private LocalDate dueDate;
    private String    createdById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
