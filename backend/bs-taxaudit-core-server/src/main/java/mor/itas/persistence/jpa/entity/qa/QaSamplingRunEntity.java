package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Historical record of an execution of the sampling engine (FR-04.9.2-01).
 *
 * Captures how many completed audit cases were evaluated, how many matched
 * the configured rule/exposure criteria, and how many new {@code qa_review_case}
 * records were provisioned.
 */
@Entity
@Table(name = "qa_sampling_run", indexes = {
    @Index(name = "idx_qa_sampling_run_created", columnList = "created_at DESC")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaSamplingRunEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rule_code", length = 64)
    private String ruleCode;

    @Column(length = 32)
    private String strategy;

    @Column(name = "triggered_by", length = 64)
    private String triggeredBy;

    @Column(name = "evaluated_count", nullable = false)
    @Builder.Default
    private Integer evaluatedCount = 0;

    @Column(name = "selected_count", nullable = false)
    @Builder.Default
    private Integer selectedCount = 0;

    @Column(name = "created_count", nullable = false)
    @Builder.Default
    private Integer createdCount = 0;

    @Column(name = "dry_run", nullable = false)
    @Builder.Default
    private boolean dryRun = false;

    @Column(name = "window_from")
    private LocalDate windowFrom;

    @Column(name = "window_to")
    private LocalDate windowTo;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
