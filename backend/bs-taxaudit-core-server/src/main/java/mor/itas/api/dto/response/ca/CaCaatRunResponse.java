package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CaCaatRunResponse {
    private UUID id;
    private UUID auditCaseId;
    private String runReference;
    private String caatToolName;
    private String samplingMethod;
    private String status;
    private Integer totalRecordsMined;
    private Integer totalFlagged;
    private BigDecimal totalFlaggedExposure;
    private String auditorNotes;
    private String executionLog;
    private String executedBy;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;

    // Nested summaries
    private List<CaCaatRuleSummary> rules;
    private List<CaBenfordDigitSummary> benfordStats;
    private Integer exceptionsCount;

    @Data
    @Builder
    public static class CaCaatRuleSummary {
        private UUID id;
        private String ruleCode;
        private String ruleName;
        private String category;
        private Integer discrepanciesCount;
        private BigDecimal varianceAmount;
        private String status;
    }

    @Data
    @Builder
    public static class CaBenfordDigitSummary {
        private Short digit;
        private BigDecimal expectedPct;
        private BigDecimal observedPct;
        private Integer observedCount;
        private BigDecimal deviation;
        private Boolean isAnomalous;
    }
}
