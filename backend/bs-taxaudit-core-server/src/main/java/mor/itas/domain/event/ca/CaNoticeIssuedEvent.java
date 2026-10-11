package mor.itas.domain.event.ca;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Fired when an assessment notice is issued to the taxpayer.
 * Triggers notification to taxpayer portal and audit trail entry.
 * FR-04.4-29, 30.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaNoticeIssuedEvent {
    private UUID caseId;
    private UUID noticeId;
    private String noticeNumber;
    private BigDecimal totalAssessmentDue;
    private LocalDate statutoryDueDate;
    private String issuedById;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
