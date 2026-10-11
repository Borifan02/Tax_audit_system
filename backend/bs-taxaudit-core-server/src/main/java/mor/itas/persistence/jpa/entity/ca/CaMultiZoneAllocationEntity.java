package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Multi-Zone Allocation — FR-04.4-31, 32, 33
 * Breaks the consolidated assessment down to individual regional zones /
 * branches for taxpayers operating in multiple locations.
 */
@Entity
@Table(name = "ca_multi_zone_allocations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaMultiZoneAllocationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id")
    private CaAssessmentNoticeEntity notice;

    @Column(nullable = false, length = 128)
    private String zoneName;

    @Column(length = 32)
    private String branchCode;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal taxDeclared = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal auditAdjustment = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal netPayable = BigDecimal.ZERO;

    /** CIT | VAT | PAYE */
    @Column(length = 16)
    private String taxType;

    @Column(length = 32)
    private String periodCovered;

    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
