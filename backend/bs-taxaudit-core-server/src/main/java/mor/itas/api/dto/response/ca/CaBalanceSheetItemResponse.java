package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaBalanceSheetItemResponse {
    private UUID id;
    private UUID auditCaseId;
    private String component;
    private String assertionType;
    private BigDecimal auditeeBalance;
    private BigDecimal auditedBalance;
    private BigDecimal variance;
    private String ifrsCompliance;
    private String notes;
    private String auditorConclusion;
    private String createdBy;
    private OffsetDateTime createdAt;
}
