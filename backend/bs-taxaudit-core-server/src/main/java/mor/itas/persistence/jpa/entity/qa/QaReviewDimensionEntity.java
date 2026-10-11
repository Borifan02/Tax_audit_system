package mor.itas.persistence.jpa.entity.qa;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * QA review dimension — FR-04.9.2-04.
 *
 * One row per mandatory ISO-19011 quality dimension, scored 0-100 and weighted.
 * {@code qaReviewCase.overallScore} is the weighted aggregate of these rows.
 * Each dimension carries its own checkpoint list (JSONB) so the reviewer's
 * per-point evidence references are preserved verbatim.
 */
@Entity
@Table(name = "qa_review_dimension")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaReviewDimensionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "qa_review_case_id", nullable = false)
    private UUID qaReviewCaseId;

    /** DIM-01 … DIM-08 */
    @Column(name = "dimension_code", nullable = false, length = 16)
    private String dimensionCode;

    /** PLANNING_AND_RISK | EVIDENCE_AND_CAAT | STATUTORY_PROCEDURES | RECONCILIATIONS |
     *  LEGAL_APPLICATION | TAXPAYER_RIGHTS | PENALTY_AND_INTEREST | WORKING_PAPERS */
    @Column(nullable = false, length = 48)
    private String category;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(name = "standards_reference", length = 256)
    private String standardsReference;

    /** Percentage weight; the eight dimensions sum to 100. */
    @Column(nullable = false)
    @Builder.Default
    private Integer weight = 0;

    /** 0 - 100 */
    @Column(nullable = false)
    @Builder.Default
    private Integer score = 0;

    /** COMPLIANT | MINOR_DEFICIENCY | MATERIAL_DEFICIENCY | CRITICAL_FAILURE */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "COMPLIANT";

    @Column(name = "reviewer_notes", columnDefinition = "TEXT")
    private String reviewerNotes;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<Map<String, Object>> checkpoints = List.of();

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "scored_by", length = 64)
    private String scoredBy;

    @Column(name = "scored_at")
    private OffsetDateTime scoredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
