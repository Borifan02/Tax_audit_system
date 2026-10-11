package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * FR-04.4-29 — Trigger statutory assessment notice generation.
 * The service auto-computes penalty (20%) and interest (NBE rate).
 * Multi-zone allocations can be supplied for FR-04.4-31, 32.
 */
@Data
public class GenerateAssessmentNoticeRequest {

    /** Statutory due days from issue date (default 30, FR-04.4-27) */
    private Integer dueDays = 30;

    /** Override interest rate if different from the NBE default (0.28) */
    private BigDecimal interestRateOverride;

    /** Days of delay already elapsed (used for interest computation) */
    private Integer interestDays = 0;

    /** FR-04.4-31, 32 — zone-level allocations; leave empty for single-zone */
    private List<ZoneAllocationLine> zoneAllocations;

    @Data
    public static class ZoneAllocationLine {
        @NotNull private String zoneName;
        private String branchCode;
        private BigDecimal taxDeclared;
        private BigDecimal auditAdjustment;
        private String taxType;    // CIT | VAT | PAYE
        private String periodCovered;
    }
}
