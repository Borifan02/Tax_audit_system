package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * The Audit Quality Review Action Plan (FR-04.9.2-03).
 *
 * Prepared by the QA team and submitted to the audit team leader / process owner
 * for review and approval before the review execution starts.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaActionPlanResponse {

    private String id;
    private String qaReviewId;
    private String planTitle;
    private String objectives;
    private String reviewScope;
    private String reviewMethodology;
    private List<String> riskFocusAreas;
    private List<Map<String, Object>> checklistItems;
    private Integer sampleSize;
    private String sampleCriteria;

    /** DRAFT | SUBMITTED | APPROVED | REJECTED | RETURNED */
    private String status;
    private String decision;
    private String decisionComments;
    private String submittedBy;
    private OffsetDateTime submittedAt;
    private String reviewedBy;
    private OffsetDateTime reviewedAt;
    private OffsetDateTime approvedAt;
    private Integer returnedCount;
}
