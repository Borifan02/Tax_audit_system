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
 * Reconciliation Record — FR-04.4-16
 * Supports:
 *   VAT_VS_SALES        – VAT returns vs CIT gross turnover vs TIMS e-invoices
 *   PAYROLL_PAYE_VS_PNL – Payroll PAYE remitted vs P&L salaries expense
 *   CUSTOMS_VS_PURCHASES– ASYCUDA CIF imports vs GL import purchases
 *   REVENUE_VS_INVOICES – Declared revenue vs electronic invoice totals
 */
@Entity
@Table(name = "ca_reconciliations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaReconciliationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    /** VAT_VS_SALES | PAYROLL_PAYE_VS_PNL | CUSTOMS_VS_PURCHASES | REVENUE_VS_INVOICES */
    @Column(nullable = false, length = 64)
    private String reconciliationType;

    // ── Source A ──────────────────────────────────────────────────────────────
    @Column(nullable = false, length = 128)
    private String sourceALabel;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal sourceAAmount = BigDecimal.ZERO;

    // ── Source B ──────────────────────────────────────────────────────────────
    @Column(nullable = false, length = 128)
    private String sourceBLabel;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal sourceBAmount = BigDecimal.ZERO;

    // ── Optional Source C (e.g. TIMS) ─────────────────────────────────────────
    @Column(length = 128)
    private String sourceCLabel;

    @Column(precision = 18, scale = 2)
    private BigDecimal sourceCAmount;

    // ── Computed ──────────────────────────────────────────────────────────────
    @Column(precision = 18, scale = 2)
    private BigDecimal variance;

    @Column(precision = 8, scale = 4)
    private BigDecimal variancePct;

    @Column(length = 32)
    private String periodCovered;

    /** PENDING | RECONCILED | DISCREPANCY_FLAGGED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String auditorNotes;

    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
