package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * FR-04.4-10, 18 — Auditor submits the draft audit report to Team Leader.
 * Financial totals are auto-computed from confirmed findings.
 */
@Data
public class SubmitDraftReportRequest {

    @NotBlank(message = "Executive summary is required")
    private String executiveSummary;

    @NotBlank(message = "Scope and objectives are required")
    private String scopeAndObjectives;

    @NotBlank(message = "Methodology is required")
    private String methodology;

    private String findingsSummary;
    private String recommendedAdjustments;
    private String statutoryRecommendations;
    private String ifrsComplianceNotes;
}
