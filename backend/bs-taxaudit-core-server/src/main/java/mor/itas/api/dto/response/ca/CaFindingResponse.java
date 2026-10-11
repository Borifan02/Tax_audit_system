package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaFindingResponse {
    private UUID id;
    private UUID auditCaseId;
    private String findingReference;
    private String auditArea;
    private String title;
    private String description;
    private String criteria;
    private String condition;
    private String cause;
    private String effect;
    private BigDecimal underDeclaredAmount;
    private BigDecimal penaltyRate;
    private BigDecimal penaltyAmount;
    private BigDecimal interestAmount;
    private BigDecimal totalTaxImpact;
    private String taxType;
    private String auditorAnalysis;
    private String conclusion;
    private String recommendation;
    private Boolean indicatesFraud;
    private String fraudIndicators;
    private String zoneCode;
    private UUID caatExceptionId;
    private String status;
    private Boolean isSignificant;
    private String createdBy;
    private OffsetDateTime createdAt;
}
