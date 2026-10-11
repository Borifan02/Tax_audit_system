package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaBenchmarkAnalysisResponse {
    private UUID id;
    private UUID auditCaseId;
    private String ratioName;
    private BigDecimal taxpayerValue;
    private BigDecimal benchmarkValue;
    private String unit;
    private BigDecimal variancePct;
    private String riskLevel;
    private String interpretation;
    private String industryCode;
    private Short dataYear;
    private String createdBy;
    private OffsetDateTime createdAt;
}
