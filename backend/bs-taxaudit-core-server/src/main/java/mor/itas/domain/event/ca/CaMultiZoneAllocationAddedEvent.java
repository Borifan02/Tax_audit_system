package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-31, 32, 33 — A per-zone allocation has been added to an assessment notice.
 * Supports taxpayers operating in multiple zones/regions of the country.
 * Aggregate tax is computed from all zone allocations combined.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaMultiZoneAllocationAddedEvent {
    private UUID       caseId;
    private UUID       noticeId;
    private UUID       allocationId;
    private String     zoneName;
    private String     branchCode;
    private String     taxType;           // CIT | VAT | PAYE
    private BigDecimal taxDeclared;
    private BigDecimal auditAdjustment;
    private BigDecimal netPayable;
    private String     periodCovered;
    private String     addedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
