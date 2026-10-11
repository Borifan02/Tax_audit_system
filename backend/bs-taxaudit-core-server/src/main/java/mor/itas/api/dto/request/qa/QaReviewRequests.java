package mor.itas.api.dto.request.qa;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Request payloads for the QA review workspace (FR-04.9.2-04, -05, -06, -10).
 *
 * Grouped as nested static classes so the many small per-action bodies stay in
 * one auditable place instead of drifting across a dozen files.
 */
public final class QaReviewRequests {

    private QaReviewRequests() {}

    /** {@code PUT /api/qa/cases/{id}} — review metadata edits by the QA officer. */
    @Data
    public static class CaseUpdate {
        private String tradeName;
        private String taxPeriod;
        private BigDecimal totalTaxAssessment;
        private String dueDate;
        private String qaTeamLeaderComment;
        private String auditTeamResponseNotes;
    }

    /**
     * {@code PUT /api/qa/cases/{id}/dimensions/{dimId}}.
     * Only the mutable scoring fields are accepted; weight/category are config.
     */
    @Data
    public static class DimensionUpdate {
        @Min(0) @Max(100)
        private Integer score;
        private String status;
        private String reviewerNotes;
        private List<Map<String, Object>> checkpoints;
    }

    /** {@code POST/PUT /api/qa/cases/{id}/deficiencies[/{defId}]} (FR-04.9.2-06). */
    @Data
    public static class DeficiencyRequest {
        @NotBlank
        private String dimensionId;
        private String dimensionTitle;
        @NotBlank
        private String severity;
        @NotBlank
        private String title;
        private String findingDescription;
        private String statutoryBreach;
        private String correctiveActionMandate;
        private String status;
        private String auditorResponse;
        private String remediationEvidenceRef;
    }

    /** {@code POST /api/qa/cases/{id}/report} (FR-04.9.2-05/-06/-10). */
    @Data
    public static class ReportRequest {
        private String executiveSummary;
        private String overallRating;
        private Integer totalWeightedScore;
        private Integer criticalDeficienciesCount;
        private Integer majorDeficienciesCount;
        private List<String> keyStrengths;
        private List<String> systemicVulnerabilities;
        private String recommendationsForDirector;
        private List<String> mandatoryCorrectiveActions;
        private String leadQAOfficerSignature;
        private String qaTeamLeaderSignature;
        private String directorApprovalSignature;
        /** DRAFT | ADJUSTED | FINAL — defaults to the action's natural kind. */
        private String kind;
    }

    /** FR-04.9.2-01 — manual trigger of the periodic sampling run. */
    @Data
    public static class SamplingRunRequest {
        /** Optional: restrict to one configured rule code. */
        private String ruleCode;
        /** Optional: restrict to these audit types. */
        private List<String> auditTypes;
        private LocalDate completedFrom;
        private LocalDate completedTo;
        private Integer maxCases;
        /** When false only the eligible pool is returned and nothing is created. */
        private Boolean dryRun;
    }
}
