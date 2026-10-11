package mor.itas.persistence.jpa.entity.qa;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * QA sampling rule — FR-04.9.2-01.
 *
 * The requirement makes sampling CONFIGURABLE, so every supported strategy has
 * its own rule row (RANDOM, STRATIFIED, RISK_WEIGHTED, MONETARY_UNIT,
 * MANDATORY_HIGH_EXPOSURE). The sampling engine reads these rules rather than
 * hard-coding a default, so changing strategy is a data change, not a deploy.
 */
@Entity
@Table(name = "qa_sampling_rule")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaSamplingRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 256)
    private String name;

    /** RANDOM | STRATIFIED | RISK_WEIGHTED | MONETARY_UNIT | MANDATORY_HIGH_EXPOSURE */
    @Column(nullable = false, length = 32)
    private String strategy;

    /** Selection reason stamped on the review: MANDATORY_HIGH_EXPOSURE |
     *  RANDOM_STATUTORY_SAMPLE | RISK_BASED_SELECTION | DIRECTOR_REFERRAL */
    @Column(name = "selection_reason", nullable = false, length = 32)
    @Builder.Default
    private String selectionReason = "RISK_BASED_SELECTION";

    @Column(name = "exposure_threshold", precision = 18, scale = 2)
    private BigDecimal exposureThreshold;

    @Column(name = "sample_percentage", precision = 5, scale = 2)
    private BigDecimal samplePercentage;

    @Column(name = "max_sample_size")
    private Integer maxSampleSize;

    @Type(JsonBinaryType.class)
    @Column(name = "audit_types", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> auditTypes = List.of();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "created_by", nullable = false, length = 64)
    @Builder.Default
    private String createdBy = "SYSTEM";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
