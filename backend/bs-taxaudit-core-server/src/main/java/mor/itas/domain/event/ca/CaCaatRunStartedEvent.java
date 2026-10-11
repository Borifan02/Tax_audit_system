package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-02 — A CAAT execution run has been initiated.
 * Fired when the automated audit engine starts processing the taxpayer ledger.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaCaatRunStartedEvent {
    private UUID   caseId;
    private UUID   caatRunId;
    private String runReference;
    private String caatToolName;
    private String samplingMethod;   // STRATIFIED | RANDOM | SYSTEMATIC_MUS
    private String startedById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
