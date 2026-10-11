package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4 — Case first enters Comprehensive Audit workflow.
 * Fired when caWorkflowStatus transitions to OPENED from null.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaCaseOpenedEvent {
    private UUID   caseId;
    private String caseNumber;
    private String taxpayerName;
    private String taxpayerId;       // TIN
    private String taxCenterCode;
    private String assignedAuditorId;
    private String teamLeaderId;
    private Integer riskScore;
    private String riskCategory;     // HIGH | MEDIUM | LOW
    private String openedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
