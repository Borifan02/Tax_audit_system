package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaDraftReportResponse {
    private UUID id;
    private UUID auditCaseId;
    private String reportReference;
    private String executiveSummary;
    private String scopeAndObjectives;
    private String methodology;
    private String findingsSummary;
    private String recommendedAdjustments;
    private String statutoryRecommendations;
    private String ifrsComplianceNotes;
    private BigDecimal totalPrincipalTax;
    private BigDecimal totalPenalty;
    private BigDecimal totalInterest;
    private BigDecimal totalAssessment;
    private String status;
    private String teamLeaderComments;
    private OffsetDateTime teamLeaderReviewedAt;
    private String teamLeaderReviewedBy;
    private String directorComments;
    private OffsetDateTime directorReviewedAt;
    private String directorReviewedBy;
    private OffsetDateTime sentToTaxpayerAt;
    private OffsetDateTime taxpayerObjectionDeadline;
    private Boolean undelivered;
    private String createdBy;
    private OffsetDateTime createdAt;
}
