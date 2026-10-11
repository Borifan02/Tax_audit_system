package mor.itas.persistence.jpa.entity.qa;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * QA review action plan — FR-04.9.2-03 (QA team prepares the review action plan)
 * and FR-04.9.2-05 (the team leader reviews its execution).
 *
 * status = DRAFT | SUBMITTED | APPROVED | REJECTED
 */
@Entity
@Table(name = "qa_action_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaActionPlanEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    /** FK to qa_review_case — null for the legacy V34 audit-case-only flow. */
    @Column(name = "qa_review_case_id")
    private UUID qaReviewCaseId;

    @Column(name = "plan_title", length = 256)
    private String planTitle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String objectives;

    @Column(name = "review_scope", nullable = false, columnDefinition = "TEXT")
    private String reviewScope;

    @Column(name = "review_methodology", columnDefinition = "TEXT")
    private String reviewMethodology;

    @Type(JsonBinaryType.class)
    @Column(name = "risk_focus_areas", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> riskFocusAreas = List.of();

    /** [{id,text,category,expectedEvidence,isMandatory,isCompleted,...}] */
    @Type(JsonBinaryType.class)
    @Column(name = "checklist_items", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<Map<String, Object>> checklistItems = List.of();

    @Column(name = "sample_size")
    private Integer sampleSize;

    @Column(name = "sample_criteria", columnDefinition = "TEXT")
    private String sampleCriteria;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "DRAFT";

    @Column(columnDefinition = "TEXT")
    private String comments;

    /** APPROVED | REJECTED — set by the QA team leader on review. */
    @Column(length = 32)
    private String decision;

    @Column(name = "decision_comments", columnDefinition = "TEXT")
    private String decisionComments;

    /** The QA reviewer (actor id) that owns the plan. */
    @Column(length = 64)
    private String reviewer;

    @Column(name = "submitted_by", length = 64)
    private String submittedBy;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "reviewed_by", length = 64)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "returned_count", nullable = false)
    @Builder.Default
    private Integer returnedCount = 0;

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
