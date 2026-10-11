package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * CAAT Exception — FR-04.4-14, 28
 * A single transaction or pattern flagged by a CAAT rule as anomalous.
 * Can be converted into a formal audit finding.
 */
@Entity
@Table(name = "ca_caat_exceptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaCaatExceptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caat_run_id", nullable = false)
    private CaCaatRunEntity caatRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 32)
    private String ruleCode;

    private String transactionRef;
    private LocalDate transactionDate;
    private String accountName;
    private String counterparty;

    @Column(precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String anomalyType;

    /** CRITICAL | HIGH | MEDIUM | LOW */
    @Column(nullable = false, length = 16)
    private String riskLevel;

    /** CIT | VAT | PAYE | CUSTOMS | WHT */
    @Column(length = 16)
    private String taxHead;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(columnDefinition = "TEXT")
    private String actionTakenNotes;

    @Builder.Default
    private Boolean convertedToFinding = false;

    /** Set when this exception is converted to a formal finding */
    private UUID findingId;

    /** PENDING_REVIEW | FINDING_CREATED | QUERY_ISSUED | DISMISSED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING_REVIEW";

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
