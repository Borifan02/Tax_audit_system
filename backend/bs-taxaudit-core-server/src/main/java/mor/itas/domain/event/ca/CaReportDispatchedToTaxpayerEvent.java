package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-19, 20 — Finalized audit report dispatched to taxpayer.
 * System sends electronic copy via email / portal / SMS (FR-04.4-20).
 * Objection window clock starts from this moment (FR-04.4-27).
 * Workflow advances to NOTICE_SENT.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaReportDispatchedToTaxpayerEvent {
    private UUID   caseId;
    private UUID   draftReportId;
    private String reportReference;
    private String taxpayerId;            // TIN — for portal/email notification
    private String taxpayerEmail;         // optional
    private int    objectionWindowDays;
    private String dispatchedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
