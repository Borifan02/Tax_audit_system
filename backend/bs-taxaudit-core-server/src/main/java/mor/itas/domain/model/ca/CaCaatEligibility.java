package mor.itas.domain.model.ca;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * FR-04.4-01: CAAT Eligibility (Value Object / Local Entity within CA Aggregate)
 * Encapsulates the domain business rules for determining if a taxpayer qualifies
 * for Computer Assisted Audit Techniques.
 */
@Getter
@Builder
@ToString
public class CaCaatEligibility {

    private final UUID caseId;
    private final BigDecimal annualTurnover;
    private final boolean hasErpSystem;
    private final boolean hasElectronicRecords;
    private final String taxpayerSegment;
    
    private final boolean overridden;
    private final String overrideReason;
    private final String assessedBy;
    private final OffsetDateTime assessedAt;

    public static final BigDecimal TURNOVER_THRESHOLD = new BigDecimal("10000000"); // 10M ETB

    /**
     * Domain business rule: Eligible if the taxpayer is LTO, 
     * OR has both an ERP and electronic records AND turnover >= 10M ETB.
     */
    public boolean isRuleEligible() {
        if ("LTO".equalsIgnoreCase(taxpayerSegment)) {
            return true;
        }
        return hasErpSystem 
            && hasElectronicRecords 
            && annualTurnover != null 
            && annualTurnover.compareTo(TURNOVER_THRESHOLD) >= 0;
    }

    /**
     * Determines final eligibility (accounting for manual override).
     */
    public boolean isFinalEligible() {
        if (overridden) {
            return true;
        }
        return isRuleEligible();
    }

    /**
     * Derives the justification reason for the audit trail / status.
     */
    public String getEligibilityReason() {
        if (overridden) {
            return "Manual override: " + (overrideReason != null ? overrideReason : "No reason provided");
        }
        return isRuleEligible() ? "Meets CAAT eligibility criteria" : "Does not meet minimum CAAT criteria";
    }
}
