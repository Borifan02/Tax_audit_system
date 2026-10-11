package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.2.1-05 — Taxpayer / tax agent confirmed receipt of entry conference documentation.
 * Auditor is notified; conference record transitions to CONFIRMED.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaEntryConferenceConfirmedByTaxpayerEvent {
    private UUID      caseId;
    private UUID      conferenceId;
    private LocalDate taxpayerReceiptDate;
    private String    confirmedByName;   // taxpayer representative name
    private String    recordedById;      // auditor recording confirmation
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
