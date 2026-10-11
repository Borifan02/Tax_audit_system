package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-18 — Statutory exit / closing conference has been scheduled.
 * Taxpayer is notified of date, time, venue, and agenda.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaExitConferenceScheduledEvent {
    private UUID      caseId;
    private UUID      conferenceId;
    private LocalDate scheduledDate;
    private String    scheduledTime;
    private String    venue;
    private String    scheduledById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
