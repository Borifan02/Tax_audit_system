package mor.itas.domain.event.ca;

import lombok.*;
import mor.itas.domain.valueobject.ca.CaAuditPhase;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-10, 18 — Workflow was reverted to a prior phase due to rejection.
 * Different from CaPhaseTransitionEvent in that it carries the rejection reason
 * and the entity (report/notice) that caused the revert.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaWorkflowRevertedEvent {
    private UUID         caseId;
    private CaAuditPhase revertedFromPhase;
    private CaAuditPhase revertedToPhase;
    private String       entityType;        // EXECUTION_REPORT | DRAFT_REPORT
    private UUID         entityId;
    private String       rejectionReason;
    private String       revertedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
