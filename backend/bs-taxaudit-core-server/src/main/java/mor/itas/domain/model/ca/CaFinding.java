package mor.itas.domain.model.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CaFinding {
    private String auditArea;
    private String title;
    private String description;
    
    private String criteria;
    private String condition;
    private String cause;
    private String effect;

    private BigDecimal underDeclaredAmount;
    private BigDecimal penaltyAmount;
    private String taxType;

    private String auditorAnalysis;
    private String conclusion;
    private String recommendation;

    private Boolean indicatesFraud;
    private String fraudIndicators;
    private String zoneCode;
    
    private UUID caatExceptionId;
    private Boolean isSignificant;

    // FR-04.4-10: System auto-computes penalty (20%)
    public void computePenalty() {
        if (underDeclaredAmount != null && underDeclaredAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.penaltyAmount = underDeclaredAmount.multiply(new BigDecimal("0.20"));
        } else {
            this.penaltyAmount = BigDecimal.ZERO;
        }
    }
}
