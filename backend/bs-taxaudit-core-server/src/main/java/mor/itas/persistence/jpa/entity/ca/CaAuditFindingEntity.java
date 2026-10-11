package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Audit Finding — FR-04.4-10, 28, 33
 * A formal audit finding with full financial impact computation.
 * Can originate from CAAT exceptions, manual audit procedures, or
 * reconciliation discrepancies. Fraud findings trigger the fraud sub-process.
 */
@Entity
@Table(name = "ca_audit_findings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaAuditFindingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 64, unique = true)
    private String findingReference;     // e.g. CA-2026-101-F01

    @Column(nullable = false, length = 128)
    private String auditArea;           // REVENUE, PURCHASES, PAYROLL, VAT, CIT, etc.

    @Column(nullable = false, length = 256)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String criteria;             // What standard / law says

    @Column(columnDefinition = "TEXT")
    private String condition;            // What was found

    @Column(columnDefinition = "TEXT")
    private String cause;

    @Column(columnDefinition = "TEXT")
    private String effect;

    // ── Financial impact ──────────────────────────────────────────────────────
    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal underDeclaredAmount = BigDecimal.ZERO;

    @Column(precision = 6, scale = 4)
    @Builder.Default
    private BigDecimal penaltyRate = new BigDecimal("0.2000");  // 20% statutory default

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal interestAmount = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalTaxImpact = BigDecimal.ZERO;

    /** CIT | VAT | PAYE | WHT */
    @Column(length = 16)
    private String taxType;

    // ── Conclusions ───────────────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String auditorAnalysis;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    // ── Fraud flag — FR-04.4-28 ───────────────────────────────────────────────
    @Builder.Default
    private Boolean indicatesFraud = false;

    @Column(columnDefinition = "TEXT")
    private String fraudIndicators;
    private OffsetDateTime fraudReferralDate;

    // ── Multi-zone — FR-04.4-31, 33 ──────────────────────────────────────────
    @Column(length = 64)
    private String zoneCode;

    // ── Links ─────────────────────────────────────────────────────────────────
    /** CAAT exception that originated this finding */
    private UUID caatExceptionId;

    /** DRAFT | UNDER_REVIEW | CONFIRMED | WITHDRAWN */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "DRAFT";

    @Builder.Default
    private Boolean isSignificant = false;

    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
