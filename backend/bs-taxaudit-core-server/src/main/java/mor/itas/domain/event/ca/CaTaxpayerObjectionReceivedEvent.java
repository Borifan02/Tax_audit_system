package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-27 — Taxpayer lodged a formal objection against the assessment notice.
 * Must be received within the configurable objection window (default 30 days).
 * Notice objectionStatus → OBJECTION_LODGED; workflow enters TAXPAYER_RESPONSE.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaTaxpayerObjectionReceivedEvent {
    private UUID   caseId;
    private UUID   noticeId;
    private UUID   taxpayerResponseId;
    private String noticeNumber;
    private String objectionSummary;
    private String submittedByTaxpayer;
    private String recordedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
