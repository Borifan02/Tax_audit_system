package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.2.1-03 — Entry conference was conducted and results recorded.
 * Carries the internal-controls review summary and premises inspection findings.
 * Team Leader must approve before taxpayer is notified (FR-04.2.1-04).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaEntryConferenceConductedEvent {
    private UUID   caseId;
    private UUID   conferenceId;
    private String internalControlsSummary;
    private String premisesInspectionSummary;
    private boolean audioRecordingUploaded;
    private String conductedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
