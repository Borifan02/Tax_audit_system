package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * QA follow-up action — FR-04.9.2-11 and FR-04.9.2-12.
 *
 * FR-04.9.2-12 explicitly allows the three remedies to be applied together, so
 * one review may own several rows with different {@code actionKind}:
 *   PROCEDURAL_ADJUSTMENT     (i)
 *   STAKEHOLDER_NOTIFICATION  (ii)
 *   DISCIPLINARY_ACTION       (iii)
 *
 * status = PENDING | IN_PROGRESS | COMPLETED | VERIFIED | CANCELLED
 */
@Entity
@Table(name = "qa_follow_up_action", indexes = {
    @Index(name = "idx_qa_followup_review", columnList = "qa_review_case_id"),
    @Index(name = "idx_qa_followup_kind",   columnList = "action_kind"),
    @Index(name = "idx_qa_followup_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaFollowUpActionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "qa_review_case_id", nullable = false)
    private UUID qaReviewCaseId;

    @Column(name = "audit_case_id")
    private UUID auditCaseId;

    /** PROCEDURAL_ADJUSTMENT | STAKEHOLDER_NOTIFICATION | DISCIPLINARY_ACTION */
    @Column(name = "action_kind", nullable = false, length = 32)
    private String actionKind;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String narrative;

    @Column(name = "target_actor_id", length = 64)
    private String targetActorId;

    @Column(name = "target_actor_name", length = 128)
    private String targetActorName;

    @Column(name = "target_department", length = 128)
    private String targetDepartment;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "decided_by", length = 64)
    private String decidedBy;

    @Column(name = "decided_at", nullable = false)
    @Builder.Default
    private OffsetDateTime decidedAt = OffsetDateTime.now();

    @Column(name = "completed_by", length = 64)
    private String completedBy;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "completion_evidence", columnDefinition = "TEXT")
    private String completionEvidence;

    @Column(name = "verified_by", length = 64)
    private String verifiedBy;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public static final String KIND_PROCEDURAL_ADJUSTMENT    = "PROCEDURAL_ADJUSTMENT";
    public static final String KIND_STAKEHOLDER_NOTIFICATION = "STAKEHOLDER_NOTIFICATION";
    public static final String KIND_DISCIPLINARY_ACTION      = "DISCIPLINARY_ACTION";
}
