package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Assessment Notice — FR-04.4-29, 30, 31, 32
 * Statutory tax assessment notice generated upon final approval.
 * Contains breakdown by CIT/VAT/PAYE/WHT with penalty (20%) and interest (NBE rate).
 * Supports multi-zone consolidated assessments (FR-04.4-31, 32).
 *
 * Status: DRAFT → ISSUED → ACKNOWLEDGED / OBJECTED → CONFIRMED / APPEALED
 */
@Entity
@Table(name = "ca_assessment_notices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaAssessmentNoticeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 64, unique = true)
    private String noticeNumber;

    @Column(nullable = false)
    private LocalDate issueDate;

    @Column(nullable = false)
    private LocalDate statutoryDueDate;         // 30 days from issue

    // ── Principal by tax type ──────────────────────────────────────────────────
    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal principalCit = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal principalVat = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal principalPaye = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal principalWht = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal principalTotal = BigDecimal.ZERO;

    // ── Penalty ───────────────────────────────────────────────────────────────
    @Column(precision = 6, scale = 4)
    @Builder.Default
    private BigDecimal penaltyPct = new BigDecimal("0.2000");  // 20% statutory

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    // ── Interest ──────────────────────────────────────────────────────────────
    @Column(precision = 6, scale = 4)
    @Builder.Default
    private BigDecimal interestRateAnnual = new BigDecimal("0.2800");  // NBE base rate

    @Builder.Default
    private Integer interestDays = 0;

    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal interestAmount = BigDecimal.ZERO;

    // ── Grand total ───────────────────────────────────────────────────────────
    @Column(precision = 18, scale = 2) @Builder.Default
    private BigDecimal totalAssessmentDue = BigDecimal.ZERO;

    // ── Taxpayer response ─────────────────────────────────────────────────────
    /** NONE | OBJECTION_LODGED | CONFIRMED | APPEALED */
    @Column(length = 32)
    @Builder.Default
    private String objectionStatus = "NONE";

    private OffsetDateTime objectionLodgedAt;

    @Column(columnDefinition = "TEXT")
    private String objectionDetails;

    @Builder.Default
    private Boolean taxpayerSigned = false;
    private OffsetDateTime taxpayerSignedAt;

    // ── Fraud referral ────────────────────────────────────────────────────────
    @Builder.Default
    private Boolean fraudReferralTriggered = false;
    private String fraudReferralReason;
    private OffsetDateTime fraudReferralAt;

    // ── Status ────────────────────────────────────────────────────────────────
    /** DRAFT | ISSUED | ACKNOWLEDGED | OBJECTED | CONFIRMED | APPEALED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "DRAFT";

    private String issuedBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    // ── Zone allocations ──────────────────────────────────────────────────────
    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CaMultiZoneAllocationEntity> zoneAllocations = new ArrayList<>();
}
