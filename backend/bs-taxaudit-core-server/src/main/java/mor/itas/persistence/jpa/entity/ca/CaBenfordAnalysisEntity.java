package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Benford Analysis Result — FR-04.4-14
 * Stores the first-digit distribution statistics compared to Benford's Law.
 * Digits 1-9: expected vs observed percentage.
 */
@Entity
@Table(name = "ca_benford_analysis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaBenfordAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caat_run_id", nullable = false)
    private CaCaatRunEntity caatRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    /** 1 to 9 */
    @Column(nullable = false)
    private Short digit;

    @Column(nullable = false, precision = 6, scale = 3)
    private BigDecimal expectedPct;

    @Column(nullable = false, precision = 6, scale = 3)
    private BigDecimal observedPct;

    @Builder.Default
    private Integer observedCount = 0;

    @Column(precision = 6, scale = 3)
    private BigDecimal deviation;

    @Builder.Default
    private Boolean isAnomalous = false;

    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
