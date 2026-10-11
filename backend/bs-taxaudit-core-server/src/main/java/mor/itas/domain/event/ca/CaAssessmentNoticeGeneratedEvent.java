package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-29 — Assessment notice has been generated (still in DRAFT status).
 * Financial breakdown: principal (CIT+VAT+PAYE+WHT) + 20% statutory penalty + interest.
 * Multi-zone allocations may accompany this event (FR-04.4-31, 32).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaAssessmentNoticeGeneratedEvent {
    private UUID       caseId;
    private UUID       noticeId;
    private String     noticeNumber;
    private BigDecimal principalTotal;
    private BigDecimal penaltyAmount;
    private BigDecimal interestAmount;
    private BigDecimal totalAssessmentDue;
    private LocalDate  issueDate;
    private LocalDate  statutoryDueDate;
    private int        zoneAllocationCount;  // 0 = single-zone taxpayer
    private String     generatedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
