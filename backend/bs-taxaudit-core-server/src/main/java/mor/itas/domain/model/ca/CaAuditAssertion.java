package mor.itas.domain.model.ca;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * FR-04.4-02 & 03: Audit Assertions
 * Represents a specific financial area assertion being verified by the auditor.
 */
@Getter
@Builder
@ToString
public class CaAuditAssertion {

    private final UUID id;
    private final UUID caseId;
    
    private final String financialArea;
    private final String assertionType;
    
    private final BigDecimal expectedValue;
    private final BigDecimal actualValue;
    
    private final String verificationResult;
    private final String explanation;
    private final String finding;
    private final String conclusion;
    
    private final String createdBy;
    private final OffsetDateTime createdAt;

    /**
     * Determines if the assertion indicates a discrepancy based on values.
     */
    public boolean hasDiscrepancy() {
        if (expectedValue == null || actualValue == null) {
            return false;
        }
        return expectedValue.compareTo(actualValue) != 0;
    }
    
    /**
     * Calculates the variance between actual and expected value.
     */
    public BigDecimal getVariance() {
        if (expectedValue == null || actualValue == null) {
            return BigDecimal.ZERO;
        }
        return actualValue.subtract(expectedValue);
    }
}
