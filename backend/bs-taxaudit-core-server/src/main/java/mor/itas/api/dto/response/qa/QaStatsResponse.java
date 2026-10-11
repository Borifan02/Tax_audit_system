package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Executive QA metrics for {@code GET /api/qa/stats}.
 *
 * Keeps the original frontend field names and adds the distribution maps so the
 * dashboard can render the FR-04.9.2 pipeline at a glance.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaStatsResponse {

    private long totalReviews;
    private int averageScore;
    private int compliancePassRate;
    private long totalDeficiencies;
    private long criticalDeficiencies;
    private long pendingDirectorActions;
    private long pendingTLReviews;

    // ── FR-04.9.2 pipeline visibility (additive) ──────────────────────────────
    private long openReviews;
    private long closedReviews;
    private long pendingOfficerReviews;
    private long pendingAuditTeamResponses;
    private long pendingExitConferences;
    private long pendingFollowUps;
    private long mandatoryReaudits;
    private long recommendationsAddressed;
    private long recommendationsNotAddressed;

    /** status -> count */
    private Map<String, Long> byStatus;
    /** rating (EXCELLENT/SATISFACTORY/MARGINAL/UNSATISFACTORY) -> count */
    private Map<String, Long> byRating;
    /** selectionReason -> count — proves FR-04.9.2-01 sampling mix. */
    private Map<String, Long> bySelectionReason;
    /** auditType -> count */
    private Map<String, Long> byAuditType;
}
