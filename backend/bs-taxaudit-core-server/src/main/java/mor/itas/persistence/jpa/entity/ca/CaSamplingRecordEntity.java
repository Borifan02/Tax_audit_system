package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Sampling Record — FR-04.4-13, 15, 16
 * Documents the sampling methodology and parameters used when the auditor
 * selects a subset of transactions (cost records, revenue, inventory) for
 * detailed audit analysis.
 */
@Entity
@Table(name = "ca_sampling_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaSamplingRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    /** STRATIFIED | RANDOM | SYSTEMATIC_MUS */
    @Column(nullable = false, length = 64)
    private String samplingType;

    /** REVENUE_TRANSACTIONS | EXPENSE_RECORDS | INVENTORY | PAYROLL */
    @Column(nullable = false, length = 128)
    private String targetPopulation;

    private Integer populationSize;
    private Integer sampleSize;

    @Column(columnDefinition = "TEXT")
    private String selectionCriteria;

    @Column(columnDefinition = "TEXT")
    private String sampleDescription;

    @Column(columnDefinition = "TEXT")
    private String findingsSummary;

    /** IN_PROGRESS | COMPLETED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "IN_PROGRESS";

    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
