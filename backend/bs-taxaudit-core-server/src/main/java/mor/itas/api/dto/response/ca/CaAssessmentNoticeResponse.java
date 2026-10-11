package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CaAssessmentNoticeResponse {
    private UUID id;
    private UUID auditCaseId;
    private String noticeNumber;
    private LocalDate issueDate;
    private LocalDate statutoryDueDate;
    private BigDecimal principalCit;
    private BigDecimal principalVat;
    private BigDecimal principalPaye;
    private BigDecimal principalWht;
    private BigDecimal principalTotal;
    private BigDecimal penaltyPct;
    private BigDecimal penaltyAmount;
    private BigDecimal interestRateAnnual;
    private Integer interestDays;
    private BigDecimal interestAmount;
    private BigDecimal totalAssessmentDue;
    private String objectionStatus;
    private OffsetDateTime objectionLodgedAt;
    private String objectionDetails;
    private Boolean taxpayerSigned;
    private OffsetDateTime taxpayerSignedAt;
    private Boolean fraudReferralTriggered;
    private String fraudReferralReason;
    private String status;
    private String issuedBy;
    private OffsetDateTime createdAt;
    private List<CaZoneAllocationSummary> zoneAllocations;

    @Data
    @Builder
    public static class CaZoneAllocationSummary {
        private UUID id;
        private String zoneName;
        private String branchCode;
        private BigDecimal taxDeclared;
        private BigDecimal auditAdjustment;
        private BigDecimal netPayable;
        private String taxType;
        private String periodCovered;
    }
}
