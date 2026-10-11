package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaCaatExceptionResponse {
    private UUID id;
    private UUID auditCaseId;
    private UUID caatRunId;
    private String ruleCode;
    private String transactionRef;
    private LocalDate transactionDate;
    private String accountName;
    private String counterparty;
    private BigDecimal amount;
    private String anomalyType;
    private String riskLevel;
    private String taxHead;
    private String details;
    private String actionTakenNotes;
    private Boolean convertedToFinding;
    private UUID findingId;
    private String status;
    private OffsetDateTime createdAt;
}
