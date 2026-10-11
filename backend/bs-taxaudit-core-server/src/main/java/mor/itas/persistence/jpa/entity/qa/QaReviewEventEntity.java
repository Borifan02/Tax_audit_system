package mor.itas.persistence.jpa.entity.qa;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * QA review event — one immutable row per FR-04.9.2-xx workflow transition.
 *
 * This is the per-review narrative trace the workspace renders ("QA-TRL-…"),
 * complementary to (never a replacement for) the append-only
 * {@code shared_audit_trail_entries} compliance log.
 */
@Entity
@Table(name = "qa_review_event", indexes = {
    @Index(name = "idx_qa_review_event_review", columnList = "qa_review_case_id"),
    @Index(name = "idx_qa_review_event_step",   columnList = "step_code"),
    @Index(name = "idx_qa_review_event_time",   columnList = "occurred_at DESC")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaReviewEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "qa_review_case_id", nullable = false)
    private UUID qaReviewCaseId;

    /** FR-04.9.2-01 … FR-04.9.2-13 */
    @Column(name = "step_code", length = 16)
    private String stepCode;

    /** e.g. REVIEW_CREATED, PLAN_SUBMITTED, DIMENSION_SCORED, REPORT_REVIEWED … */
    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "from_status", length = 32)
    private String fromStatus;

    @Column(name = "to_status", length = 32)
    private String toStatus;

    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "actor_name", length = 128)
    private String actorName;

    @Column(name = "actor_role", length = 64)
    private String actorRole;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime occurredAt = OffsetDateTime.now();
}
