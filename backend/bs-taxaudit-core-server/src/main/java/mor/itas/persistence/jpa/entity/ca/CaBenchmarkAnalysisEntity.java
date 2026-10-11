package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Industry Benchmark Analysis — FR-04.4-06, 14
 * Compares the auditee's financial ratios (GP margin, expense ratio, etc.)
 * against sector benchmarks to detect out-of-pattern declarations.
 */
@Entity
@Table(name = "ca_benchmark_analyses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaBenchmarkAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 128)
    private String ratioName;      // GP_MARGIN, NP_MARGIN, EXPENSE_RATIO …

    @Column(precision = 10, scale = 4)
    private BigDecimal taxpayerValue;

    @Column(precision = 10, scale = 4)
    private BigDecimal benchmarkValue;

    @Column(length = 32)
    private String unit;           // %, RATIO, ETB

    @Column(precision = 10, scale = 4)
    private BigDecimal variancePct;

    /** LOW | MEDIUM | HIGH */
    @Column(length = 16)
    private String riskLevel;

    @Column(columnDefinition = "TEXT")
    private String interpretation;

    @Column(length = 32)
    private String industryCode;

    private Short dataYear;
    private String createdBy;
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
