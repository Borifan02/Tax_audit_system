package mor.itas.domain.event.da;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DeskAuditEscalatedToComprehensiveEvent(
    UUID eventId,
    OffsetDateTime occurredAt,
    UUID sourceDeskCaseId,
    UUID newComprehensiveCaseId,
    String directorActorId,
    String narrative
) {
    public DeskAuditEscalatedToComprehensiveEvent(UUID sourceDeskCaseId, UUID newComprehensiveCaseId, String directorActorId, String narrative) {
        this(UUID.randomUUID(), OffsetDateTime.now(), sourceDeskCaseId, newComprehensiveCaseId, directorActorId, narrative);
    }
}
