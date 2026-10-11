package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-14 — A single transaction exception was flagged by a CAAT rule.
 * Published for each individual exception created during the CAAT run.
 * High/Critical exceptions may auto-notify the Team Leader.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaCaatExceptionFlaggedEvent {
    private UUID      caseId;
    private UUID      caatRunId;
    private UUID      exceptionId;
    private String    ruleCode;
    private String    anomalyType;
    private String    riskLevel;         // CRITICAL | HIGH | MEDIUM | LOW
    private String    taxHead;           // CIT | VAT | PAYE | CUSTOMS | WHT
    private BigDecimal amount;
    private String    transactionRef;
    private LocalDate transactionDate;
    private String    accountName;
    private String    counterparty;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
