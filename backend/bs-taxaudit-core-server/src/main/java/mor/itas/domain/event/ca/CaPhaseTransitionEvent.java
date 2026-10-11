package mor.itas.domain.event.ca;

import lombok.*;
import mor.itas.domain.valueobject.ca.CaAuditPhase;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4 state machine — workflow phase has changed.
 * Fired for every phase transition; mirrors TpPhaseTransitionEvent exactly.
 * Subscribers can update dashboards, send notifications, or trigger SLA timers.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaPhaseTransitionEvent {
    private UUID          caseId;
    private CaAuditPhase  previousPhase;
    private CaAuditPhase  newPhase;
    private String        triggeredById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
