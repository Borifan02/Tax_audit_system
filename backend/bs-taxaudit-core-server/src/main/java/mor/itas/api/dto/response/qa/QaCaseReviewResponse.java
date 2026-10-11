package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * The full Audit Quality Assurance review dossier.
 *
 * Field names match the frontend {@code QACaseReview} contract so the workspace
 * binds 1:1. Everything past {@code auditTrail} is additive and exposes the
 * FR-04.9.2-03, -07 → -13 artefacts (action plan, exit conference, follow-ups,
 * recommendations) plus the workflow step pointer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaCaseReviewResponse {

    private String id;
    private String caseNumber;
    private String auditCaseId;
    private String auditCaseNumber;
    private String auditType;
    private String taxpayerName;
    private String tradeName;
    private String tin;
    private String taxPeriod;
    private BigDecimal totalTaxAssessment;
    private String leadAuditor;
    private String auditTeamLeader;
    private String selectionReason;
    private String samplingStrategy;
    private String samplingRuleCode;
    private Integer samplingScore;
    private LocalDate selectionDate;
    private LocalDate dueDate;
    private String assignedQAOfficer;
    private String qaTeamLeader;
    private String status;
    private Integer overallScore;
    private String rating;
    private List<QaDimensionResponse> dimensions;
    private List<QaDeficiencyResponse> deficiencies;
    private QaReportResponse report;
    private String auditTeamResponseNotes;
    private OffsetDateTime auditTeamResponseDate;
    private String auditTeamRespondedBy;
    private String qaTeamLeaderComment;
    private OffsetDateTime qaTeamLeaderDecisionDate;
    private String directorExecutiveComment;
    private OffsetDateTime directorExecutiveDecisionDate;
    private String directorStatutoryOrder;
    private OffsetDateTime lastSaved;
    private List<QaAuditTrailEntryResponse> auditTrail;

    // ── FR-04.9.2 workflow control ────────────────────────────────────────────
    /** e.g. "FR-04.9.2-06" — the step the review is currently sitting in. */
    private String currentStep;
    /** Convenience: the next action(s) the current actor may take. */
    private List<String> availableActions;
    private String statusReason;

    // ── FR-04.9.2-13 closure record ───────────────────────────────────────────
    private Boolean recommendationsAddressed;
    private String closureNote;
    private String closureCheckedBy;
    private OffsetDateTime closureCheckedAt;
    private OffsetDateTime closedAt;

    // ── Cross-cutting FR-04.9.2 artefacts ─────────────────────────────────────
    private QaActionPlanResponse actionPlan;
    private QaExitConferenceResponse exitConference;
    private List<QaFollowUpActionResponse> followUpActions;
    private List<QaRecommendationResponse> recommendations;
    /** All report versions (DRAFT / ADJUSTED / FINAL), newest first. */
    private List<QaReportResponse> reportHistory;
    private OffsetDateTime createdAt;
}
