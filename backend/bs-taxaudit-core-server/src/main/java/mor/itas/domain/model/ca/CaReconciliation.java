package mor.itas.domain.model.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class CaReconciliation {
    private String reconciliationType;
    private String sourceALabel;
    private BigDecimal sourceAAmount;
    private String sourceBLabel;
    private BigDecimal sourceBAmount;
    private String sourceCLabel;
    private BigDecimal sourceCAmount;
    
    private BigDecimal varianceAmount;
    
    private String periodCovered;
    private String auditorNotes;

    // Compute variance based on sources
    public void computeVariance() {
        BigDecimal totalSources = BigDecimal.ZERO;
        if (sourceBAmount != null) totalSources = totalSources.add(sourceBAmount);
        if (sourceCAmount != null) totalSources = totalSources.add(sourceCAmount);
        
        if (sourceAAmount != null) {
            this.varianceAmount = sourceAAmount.subtract(totalSources).abs();
        } else {
            this.varianceAmount = totalSources;
        }
    }
}
