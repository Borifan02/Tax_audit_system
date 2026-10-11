package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.2.1-01, 02 — Entry conference has been scheduled.
 * Triggers taxpayer notification (email / portal) with date, time, and venue.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaEntryConferenceScheduledEvent {
    private UUID      caseId;
    private UUID      conferenceId;
    private LocalDate scheduledDate;
    private String    scheduledTime;
    private String    venue;
    private String    taxpayerName;
    private String    taxpayerId;        // TIN — for portal notification
    private String    scheduledById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
