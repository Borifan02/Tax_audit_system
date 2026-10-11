package mor.itas.persistence.jpa.entity.ap;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "t_caat_anomaly", indexes = {
    @Index(name = "idx_caat_case_id", columnList = "case_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaatAnomalyEntity {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(nullable = false, length = 128)
    private String analysisType;

    @Column(name = "rule_code", length = 64)
    private String ruleCode;

    @Column(name = "tax_type", length = 96)
    private String taxType;

    @Column(name = "tax_period", length = 64)
    private String taxPeriod;

    @Column(name = "data_source", length = 160)
    private String dataSource;

    @Column(name = "evidence_ref", length = 128)
    private String evidenceRef;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 32)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "expected_amount", precision = 18, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "reported_amount", precision = 18, scale = 2)
    private BigDecimal reportedAmount;

    @Column(name = "original_amount", precision = 18, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "amended_amount", precision = 18, scale = 2)
    private BigDecimal amendedAmount;

    @Column(name = "run_by", nullable = false, length = 64)
    private String runBy;

    @Column(name = "run_at", nullable = false)
    private OffsetDateTime runAt;

    @Column(length = 32)
    private String validationStatus; // PENDING, ACCEPTED, AMENDED, REJECTED

    @Column(name = "validated_by")
    private String validatedBy;

    @Column(name = "validated_at")
    private OffsetDateTime validatedAt;

    @Column(columnDefinition = "TEXT")
    private String validationNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
