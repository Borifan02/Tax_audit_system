package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * A formal QA recommendation issued to the audit team.
 *
 * FR-04.9.2-13 closes on these rows: the team leader / process owner checks
 * whether the audit team addressed each recommendation
 * ({@code status} ACCEPTED_RESOLVED) or not ({@code NOT_ADDRESSED}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaRecommendationResponse {

    private String id;
    private String qaReviewId;
    private String auditCaseId;
    private String recommendation;

    /** PENDING | IN_PROGRESS | ACCEPTED_RESOLVED | NOT_ADDRESSED | DISPUTED */
    private String status;
    private String assignedTo;
    private String assignedToName;
    private LocalDate deadline;
    private String evidenceOfCorrection;
    private String createdBy;
    private OffsetDateTime createdAt;
    private String addressedBy;
    private OffsetDateTime addressedAt;
    private String closedBy;
    private OffsetDateTime closedAt;
    private String closureComment;
    private List<String> linkedDeficiencyIds;
}
