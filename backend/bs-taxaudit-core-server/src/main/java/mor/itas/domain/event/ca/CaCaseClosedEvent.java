package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-34 — Comprehensive audit case has been fully closed (status=COMPLETED).
 * Feeds management reporting: aggregate amounts, tax center, segment, audit yield.
 * FR-04.4-34 requires reports on: assessment amounts by tax center/segment/sector,
 * principal/penalty/interest breakdown, disputed vs confirmed amounts.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaCaseClosedEvent {
    private UUID       caseId;
    private String     caseNumber;
    private String     taxpayerId;
    private String     taxpayerName;
    private String     taxCenterCode;
    private String     segment;
    private String     sector;
    private BigDecimal totalPrincipalAssessed;
    private BigDecimal totalPenaltyAssessed;
    private BigDecimal totalInterestAssessed;
    private BigDecimal grandTotalAssessed;
    private int        totalFindingsConfirmed;
    private boolean    fraudReferralMade;
    private String     closedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
