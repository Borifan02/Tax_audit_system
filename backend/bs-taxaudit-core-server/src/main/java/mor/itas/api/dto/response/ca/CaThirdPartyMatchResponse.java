package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaThirdPartyMatchResponse {
    private UUID id;
    private UUID auditCaseId;
    private String dataSource;
    private BigDecimal declaredValue;
    private BigDecimal thirdPartyValue;
    private BigDecimal variance;
    private String matchStatus;
    private String discrepancyNotes;
    private String periodCovered;
    private String createdBy;
    private OffsetDateTime createdAt;
}
