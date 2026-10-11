package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-01 — Eligibility for CAAT has been assessed.
 * Fired after assessing whether the taxpayer qualifies for
 * Computer Assisted Audit Techniques based on ERP, records and turnover rules.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaCaatEligibilityAssessedEvent {
    private UUID   caseId;
    private UUID   eligibilityId;
    private boolean eligible;
    private String  eligibilityReason;
    private BigDecimal annualTurnover;
    private boolean hasErpSystem;
    private boolean hasElectronicRecords;
    private String  taxpayerSegment;     // LTO | MTO | STO
    private boolean overridden;
    private String  overrideReason;
    private String  assessedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
