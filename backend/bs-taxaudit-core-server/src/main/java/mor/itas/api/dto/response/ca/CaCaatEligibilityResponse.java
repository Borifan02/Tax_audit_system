package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaCaatEligibilityResponse {
    private UUID id;
    private UUID auditCaseId;
    private Boolean isEligible;
    private String eligibilityReason;
    private BigDecimal annualTurnover;
    private Boolean hasErpSystem;
    private Boolean hasElectronicRecords;
    private String taxpayerSegment;
    private String status;
    private String assessedBy;
    private OffsetDateTime assessedAt;
    private Boolean overridden;
    private String overrideReason;
    private OffsetDateTime createdAt;
}
