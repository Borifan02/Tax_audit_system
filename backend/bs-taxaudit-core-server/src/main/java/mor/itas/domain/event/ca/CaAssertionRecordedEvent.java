package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-03, 11 — Auditor recorded an audit assertion and IFRS verification result.
 * Covers compliance with IFRS/acceptable accounting standards (FR-04.4-11).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaAssertionRecordedEvent {
    private UUID       caseId;
    private UUID       assertionId;
    private String     financialArea;
    private String     assertionType;
    private BigDecimal expectedValue;
    private BigDecimal actualValue;
    private String     verificationResult; // PASSED | FAILED | PARTIAL
    private String     finding;
    private String     conclusion;
    private String     createdById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
