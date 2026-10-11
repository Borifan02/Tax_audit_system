package mor.itas.persistence.jpa.entity.da;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "da_findings")
@Data
public class DaFindingEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID auditCaseId;

    @Column(name = "finding_reference", length = 64)
    private String findingReference;

    @Column(name = "audit_area", length = 128)
    private String auditArea;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String criteria;

    @Column(columnDefinition = "TEXT")
    private String condition;

    @Column(columnDefinition = "TEXT")
    private String cause;

    @Column(columnDefinition = "TEXT")
    private String effect;

    @Column(name = "under_declared_amount")
    private Double underDeclaredAmount;

    @Column(name = "penalty_rate")
    private Double penaltyRate;

    @Column(name = "penalty_amount")
    private Double penaltyAmount;

    @Column(name = "interest_amount")
    private Double interestAmount;

    @Column(name = "total_tax_impact")
    private Double totalTaxImpact;

    @Column(name = "auditor_analysis", columnDefinition = "TEXT")
    private String auditorAnalysis;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(length = 64)
    private String status;

    @Column(name = "is_significant")
    private Boolean isSignificant;

    @Column(name = "related_procedure_id", length = 64)
    private String relatedProcedureId;

    @Column(name = "related_query_id", length = 64)
    private String relatedQueryId;

    @Column(name = "related_working_paper_id", length = 64)
    private String relatedWorkingPaperId;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
