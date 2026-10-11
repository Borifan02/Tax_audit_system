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
 * Third-Party Data Match — FR-04.4-07
 * Compares taxpayer declared values against data received from external sources
 * (Customs/ASYCUDA, Banks, Suppliers, National Bank, Social Security, etc.)
 */
@Entity
@Table(name = "ca_third_party_matches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaThirdPartyMatchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    /** CUSTOMS | BANKS | SUPPLIERS | NBE | SOCIAL_SECURITY | ASYCUDA | SIGTAS */
    @Column(nullable = false, length = 128)
    private String dataSource;

    @Column(precision = 18, scale = 2)
    private BigDecimal declaredValue;

    @Column(precision = 18, scale = 2)
    private BigDecimal thirdPartyValue;

    @Column(precision = 18, scale = 2)
    private BigDecimal variance;

    /** MATCHED | DISCREPANCY | UNRESOLVED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String matchStatus = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String discrepancyNotes;

    @Column(length = 32)
    private String periodCovered;

    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
