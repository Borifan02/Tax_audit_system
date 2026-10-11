package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-06 — Auditor compared the auditee with industry benchmarks.
 * Identifies out-of-pattern tax declarations using comparative ratio analysis.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaBenchmarkAnalysisAddedEvent {
    private UUID       caseId;
    private UUID       benchmarkId;
    private String     ratioName;         // GP_MARGIN, NP_MARGIN, EXPENSE_RATIO …
    private BigDecimal taxpayerValue;
    private BigDecimal benchmarkValue;
    private BigDecimal variancePct;
    private String     riskLevel;         // LOW | MEDIUM | HIGH
    private String     industryCode;
    private String     addedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
