package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * CAAT Rule — FR-04.4-14
 * Individual audit rule applied during a CAAT run (Benford, Duplicates, Threshold, etc.)
 */
@Entity
@Table(name = "ca_caat_rules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaCaatRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caat_run_id", nullable = false)
    private CaCaatRunEntity caatRun;

    @Column(nullable = false, length = 32)
    private String ruleCode;

    @Column(nullable = false, length = 128)
    private String ruleName;

    /** BENFORD | DUPLICATES | THRESHOLD | E_INVOICING | PAYROLL | JOURNAL_ENTRIES | CUSTOMS */
    @Column(nullable = false, length = 64)
    private String category;

    @Column(length = 64)
    private String targetLedger;

    @Builder.Default
    private Integer sampleSize = 0;

    @Builder.Default
    private Integer discrepanciesCount = 0;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal varianceAmount = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2)
    private BigDecimal thresholdAmount;

    @Column(columnDefinition = "TEXT")
    private String details;

    /** PENDING | FLAGGED | VERIFIED | RESOLVED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING";

    private OffsetDateTime lastExecutedAt;
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
