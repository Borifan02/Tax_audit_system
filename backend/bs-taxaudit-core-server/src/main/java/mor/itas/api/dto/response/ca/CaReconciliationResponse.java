package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaReconciliationResponse {
    private UUID id;
    private UUID auditCaseId;
    private String reconciliationType;
    private String sourceALabel;
    private BigDecimal sourceAAmount;
    private String sourceBLabel;
    private BigDecimal sourceBAmount;
    private String sourceCLabel;
    private BigDecimal sourceCAmount;
    private BigDecimal variance;
    private BigDecimal variancePct;
    private String periodCovered;
    private String status;
    private String auditorNotes;
    private String createdBy;
    private OffsetDateTime createdAt;
}
