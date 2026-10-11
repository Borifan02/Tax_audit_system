package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

/**
 * FR-04.4-01 — CAAT eligibility assessment request.
 * Auditor submits key taxpayer attributes; the service applies
 * configured business rules and returns an eligibility decision.
 */
@Data
public class AssessCaatEligibilityRequest {

    @NotNull(message = "Annual turnover is required")
    private BigDecimal annualTurnover;

    @NotNull(message = "ERP system flag is required")
    private Boolean hasErpSystem;

    @NotNull(message = "Electronic records flag is required")
    private Boolean hasElectronicRecords;

    /** LTO | MTO | STO */
    private String taxpayerSegment;

    /** Auditor can force override the computed decision */
    private Boolean override;
    private String overrideReason;
}
