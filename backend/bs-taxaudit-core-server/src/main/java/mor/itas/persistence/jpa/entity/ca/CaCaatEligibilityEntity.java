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
 * CAAT Eligibility Assessment — FR-04.4-01
 * Captures whether the taxpayer qualifies for Computer Assisted Audit Techniques
 * based on configured business rules (ERP presence, electronic records, turnover).
 */
@Entity
@Table(name = "ca_caat_eligibility")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaCaatEligibilityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isEligible = false;

    @Column(columnDefinition = "TEXT")
    private String eligibilityReason;

    @Column(precision = 18, scale = 2)
    private BigDecimal annualTurnover;

    @Builder.Default
    private Boolean hasErpSystem = false;

    @Builder.Default
    private Boolean hasElectronicRecords = false;

    /** LTO / MTO / STO */
    @Column(length = 16)
    private String taxpayerSegment;

    private String assessedBy;
    private OffsetDateTime assessedAt;

    @Builder.Default
    private Boolean overridden = false;
    private String overrideReason;
    private String overrideBy;

    /** PENDING | ELIGIBLE | INELIGIBLE */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
