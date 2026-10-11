package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-02, 14 — CAAT engine finished processing all 7 rule categories.
 * Carries aggregate statistics so downstream consumers can update dashboards
 * without re-querying the full exceptions table.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaCaatRunCompletedEvent {
    private UUID       caseId;
    private UUID       caatRunId;
    private String     runReference;
    private int        totalRecordsMined;
    private int        totalExceptions;
    private BigDecimal totalFlaggedExposure;
    private int        criticalExceptions;
    private int        highExceptions;
    private int        mediumExceptions;
    private int        lowExceptions;
    private boolean    benfordAnomalyDetected;
    private boolean    duplicatesDetected;
    private String     executedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
