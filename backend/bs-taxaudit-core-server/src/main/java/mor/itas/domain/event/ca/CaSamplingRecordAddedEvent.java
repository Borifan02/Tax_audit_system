package mor.itas.domain.event.ca;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-13, 15, 16 — Auditor defined a sampling strategy for transaction testing.
 * Supports Stratified, Random, and Systematic Monetary Unit Sampling.
 * Applies to Revenue transactions, Expense records, Payroll, and Inventory.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaSamplingRecordAddedEvent {
    private UUID   caseId;
    private UUID   samplingId;
    private String samplingType;       // STRATIFIED | RANDOM | SYSTEMATIC_MUS
    private String targetPopulation;   // REVENUE_TRANSACTIONS | EXPENSE_RECORDS | INVENTORY | PAYROLL
    private int    populationSize;
    private int    sampleSize;
    private String selectionCriteria;
    private String createdById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
