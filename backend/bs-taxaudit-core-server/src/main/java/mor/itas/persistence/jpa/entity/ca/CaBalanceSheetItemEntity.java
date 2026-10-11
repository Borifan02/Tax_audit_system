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
 * Balance Sheet Testing Item — FR-04.4-03, 08
 * Each row represents auditor's test on a balance sheet / income statement component
 * covering one of the five financial statement assertions.
 */
@Entity
@Table(name = "ca_balance_sheet_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaBalanceSheetItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 128)
    private String component;     // Cash, Receivables, Inventory, PPE …

    /** EXISTENCE | COMPLETENESS | VALUATION | RIGHTS_OBLIGATIONS | PRESENTATION */
    @Column(nullable = false, length = 64)
    private String assertionType;

    @Column(precision = 18, scale = 2)
    private BigDecimal auditeeBalance;

    @Column(precision = 18, scale = 2)
    private BigDecimal auditedBalance;

    @Column(precision = 18, scale = 2)
    private BigDecimal variance;

    /** COMPLIANT | NON_COMPLIANT | PARTIAL */
    @Column(length = 32)
    private String ifrsCompliance;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** SATISFACTORY | ADJUSTED | REFERRED */
    @Column(length = 32)
    private String auditorConclusion;

    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
