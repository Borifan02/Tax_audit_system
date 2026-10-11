package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-19, 30 — Taxpayer accepted and signed the audit report.
 * Triggers the audit completion process.
 * Electronic or physical signature; stored against the notice record.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaTaxpayerSignedReportEvent {
    private UUID   caseId;
    private UUID   noticeId;
    private String noticeNumber;
    private String signatureRef;      // document reference or digital-signature token
    private String signedByName;      // taxpayer representative
    private String recordedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
