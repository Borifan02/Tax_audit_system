package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-10, 18 — A finding has been confirmed after Team Leader / Director review.
 * Confirmed findings feed into the draft report financial totals.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaFindingConfirmedEvent {
    private UUID       caseId;
    private UUID       findingId;
    private String     findingReference;
    private String     taxType;
    private BigDecimal totalTaxImpact;
    private String     confirmedById;
    private String     confirmerRole;    // TEAM_LEADER | DIRECTOR
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
