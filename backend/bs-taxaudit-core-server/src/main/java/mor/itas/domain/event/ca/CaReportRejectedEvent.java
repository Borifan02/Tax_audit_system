package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-10, 18 — A report was rejected at any approval gate.
 * Case workflow reverts: EXECUTION_REPORT→FIELDWORK, DRAFT_REPORT→DRAFT_REPORT phase.
 * Auditor receives the rejection reason and must rework and resubmit.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaReportRejectedEvent {
    private UUID   caseId;
    private UUID   entityId;
    private String entityType;         // EXECUTION_REPORT | DRAFT_REPORT
    private int    rejectionLevel;     // 1=TeamLeader, 2=Director
    private String rejectedById;
    private String rejectorRole;
    private String rejectionReason;
    private String revertedToPhase;    // the workflow phase case reverts to
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
