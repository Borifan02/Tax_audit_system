package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-16 — Auditor completed a reconciliation between two or three data sources.
 * Types: VAT_VS_SALES | PAYROLL_PAYE_VS_PNL | CUSTOMS_VS_PURCHASES | REVENUE_VS_INVOICES
 * Discrepancies over threshold are flagged for finding creation.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaReconciliationAddedEvent {
    private UUID       caseId;
    private UUID       reconciliationId;
    private String     reconciliationType;
    private BigDecimal sourceAAmount;
    private BigDecimal sourceBAmount;
    private BigDecimal sourceCAmount;     // nullable — third data source (e.g. TIMS)
    private BigDecimal variance;
    private BigDecimal variancePct;
    private String     status;            // RECONCILED | DISCREPANCY_FLAGGED
    private String     periodCovered;
    private String     createdById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
