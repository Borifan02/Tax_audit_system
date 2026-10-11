package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-29, 30 — Assessment notice officially issued to taxpayer.
 * Status moves from DRAFT → ISSUED.
 * System sends alert to taxpayer portal, email and SMS (FR-04.4-20).
 * Taxpayer must pay or raise an objection within 30 days (FR-04.4-27).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaAssessmentNoticeIssuedEvent {
    private UUID       caseId;
    private UUID       noticeId;
    private String     noticeNumber;
    private String     taxpayerId;            // TIN — for notification routing
    private BigDecimal totalAssessmentDue;
    private LocalDate  statutoryDueDate;
    private String     issuedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
