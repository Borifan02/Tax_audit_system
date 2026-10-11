package mor.itas.domain.event.da;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DeskAuditReportDraftedEvent(
    UUID eventId,
    OffsetDateTime occurredAt,
    UUID caseId,
    UUID reportId,
    String draftedByActorId
) {
    public DeskAuditReportDraftedEvent(UUID caseId, UUID reportId, String draftedByActorId) {
        this(UUID.randomUUID(), OffsetDateTime.now(), caseId, reportId, draftedByActorId);
    }
}
