package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-19 — Exit conference was conducted and taxpayer acknowledged findings.
 * If taxpayer signed, case advances toward COMPLETED.
 * If taxpayer did not sign within the window, fraud investigation may be triggered.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaExitConferenceConductedEvent {
    private UUID      caseId;
    private UUID      conferenceId;
    private boolean   signedByTaxpayer;
    private LocalDate signedDate;
    private boolean   attendanceConfirmed;
    private String    conductedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
