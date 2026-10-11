package mor.itas.domain.event.da;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DeskAuditEvidenceGatheredEvent(
    UUID eventId,
    OffsetDateTime occurredAt,
    UUID caseId,
    String sourceType,
    String sourceReference
) {
    public DeskAuditEvidenceGatheredEvent(UUID caseId, String sourceType, String sourceReference) {
        this(UUID.randomUUID(), OffsetDateTime.now(), caseId, sourceType, sourceReference);
    }
}
