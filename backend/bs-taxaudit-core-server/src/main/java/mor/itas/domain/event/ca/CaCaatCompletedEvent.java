package mor.itas.domain.event.ca;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Fired when a CAAT run completes — notifies audit team of exceptions found.
 * FR-04.4-02, 14.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaCaatCompletedEvent {
    private UUID caseId;
    private UUID caatRunId;
    private String runReference;
    private Integer totalExceptions;
    private BigDecimal totalFlaggedExposure;
    private String executedById;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
