package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-07 — Auditor conducted third-party data matching.
 * Checks taxpayer declarations against CUSTOMS/ASYCUDA, BANKS, NBE, SUPPLIERS, etc.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaThirdPartyMatchAddedEvent {
    private UUID       caseId;
    private UUID       matchId;
    private String     dataSource;        // CUSTOMS | BANKS | NBE | SUPPLIERS | ASYCUDA | SIGTAS
    private BigDecimal declaredValue;
    private BigDecimal thirdPartyValue;
    private BigDecimal variance;
    private String     matchStatus;       // MATCHED | DISCREPANCY | UNRESOLVED
    private String     periodCovered;
    private String     addedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
