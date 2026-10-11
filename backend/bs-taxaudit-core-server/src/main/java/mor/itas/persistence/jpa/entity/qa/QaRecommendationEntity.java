package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * QA deficiency / recommendation register — FR-04.9.2-04 (the audit team's
 * findings and the action determined), FR-04.9.2-06 (the recommendations the
 * team leader reviews with the report) and FR-04.9.2-13 (the check whether the
 * recommendations were actually addressed).
 *
 * severity = CRITICAL | MAJOR | MODERATE | OBSERVATION
 * status   = OPEN | REMEDIATION_SUBMITTED | ACCEPTED_RESOLVED | DISPUTED
 */
@Entity
@Table(name = "qa_recommendations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaRecommendationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    /** FK to qa_review_case — null for the legacy V34 audit-case-only flow. */
    @Column(name = "qa_review_case_id")
    private UUID qaReviewCaseId;

    /** Human-readable heading of the deficiency, e.g. "Unsubstantiated TP royalty disallowance". */
    @Column(length = 256)
    private String title;

    /** Repeats the parent dimension so the workspace can group without a join. */
    @Column(name = "dimension_code", length = 16)
    private String dimensionCode;

    @Column(name = "dimension_title", length = 256)
    private String dimensionTitle;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "MAJOR";

    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String recommendation = "";

    @Column(name = "finding_description", columnDefinition = "TEXT")
    private String findingDescription;

    @Column(name = "statutory_breach", columnDefinition = "TEXT")
    private String statutoryBreach;

    @Column(name = "corrective_action_mandate", columnDefinition = "TEXT")
    private String correctiveActionMandate;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "OPEN";

    /** The audited team's remediation narrative (FR-04.9.2-05 / -12). */
    @Column(name = "auditor_response", columnDefinition = "TEXT")
    private String auditorResponse;

    @Column(name = "remediation_evidence_ref", length = 256)
    private String remediationEvidenceRef;

    @Column(name = "evidence_of_correction", columnDefinition = "TEXT")
    private String evidenceOfCorrection;

    @Column(name = "responded_by", length = 64)
    private String respondedBy;

    @Column(name = "responded_at")
    private OffsetDateTime respondedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "assigned_to", length = 64)
    private String assignedTo;

    @Column(name = "deadline")
    private OffsetDateTime deadline;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "created_by", length = 64)
    private String createdBy;

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
