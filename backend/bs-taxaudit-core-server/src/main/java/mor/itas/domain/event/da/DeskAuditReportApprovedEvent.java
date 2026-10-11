package mor.itas.domain.event.da;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DeskAuditReportApprovedEvent(
    UUID eventId,
    OffsetDateTime occurredAt,
    UUID caseId,
    UUID reportId,
    String approvedByActorId,
    boolean bigIssueFound
) {
    public DeskAuditReportApprovedEvent(UUID caseId, UUID reportId, String approvedByActorId, boolean bigIssueFound) {
        this(UUID.randomUUID(), OffsetDateTime.now(), caseId, reportId, approvedByActorId, bigIssueFound);
    }
}
