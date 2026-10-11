package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-03, 08 — Auditor completed balance sheet / income statement component testing.
 * Covers five assertion types: Existence, Completeness, Valuation,
 * Rights & Obligations, and Presentation.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaBalanceSheetItemAddedEvent {
    private UUID       caseId;
    private UUID       itemId;
    private String     component;         // Cash, Receivables, Revenue, PPE …
    private String     assertionType;     // EXISTENCE | COMPLETENESS | VALUATION | RIGHTS_OBLIGATIONS | PRESENTATION
    private BigDecimal auditeeBalance;
    private BigDecimal auditedBalance;
    private BigDecimal variance;
    private String     ifrsCompliance;    // COMPLIANT | NON_COMPLIANT | PARTIAL
    private String     auditorConclusion; // SATISFACTORY | ADJUSTED | REFERRED
    private String     addedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
