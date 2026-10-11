package mor.itas.domain.valueobject.da;

import java.util.List;
import java.util.UUID;

public record DeskAuditDetail(
    List<String> evidenceGathered,
    List<String> taxpayerUploads,
    List<String> dataAnalyticsRuns,
    UUID draftReportId,
    DeskAuditOutcome outcome,
    String escalationRecommendationNarrative,
    Boolean comprehensiveAuditRequired
) {
    public DeskAuditDetail() {
        this(List.of(), List.of(), List.of(), null, null, null, null);
    }
}
