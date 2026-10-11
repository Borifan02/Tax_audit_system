package mor.itas.persistence.jpa.entity.qa;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * QA review report — FR-04.9.2-06 and FR-04.9.2-10.
 *
 * kind = DRAFT is produced by the QA team and reviewed by the QA team leader
 * (FR-04.9.2-06). After the exit conference the QA team raises kind = ADJUSTED
 * incorporating the conference inputs (FR-04.9.2-10).
 *
 * status = DRAFT | PENDING_TL_REVIEW | RETURNED | APPROVED | ADJUSTED | FINAL
 */
@Entity
@Table(name = "qa_review_report", indexes = {
    @Index(name = "idx_qa_report_review", columnList = "qa_review_case_id"),
    @Index(name = "idx_qa_report_kind",   columnList = "qa_review_case_id, kind")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaReviewReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "qa_review_case_id", nullable = false)
    private UUID qaReviewCaseId;

    /** DRAFT | ADJUSTED | FINAL */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String kind = "DRAFT";

    @Column(name = "report_reference", length = 64)
    private String reportReference;

    @Column(name = "generated_date", nullable = false)
    @Builder.Default
    private LocalDate generatedDate = LocalDate.now();

    @Column(name = "executive_summary", columnDefinition = "TEXT")
    private String executiveSummary;

    /** EXCELLENT | SATISFACTORY | MARGINAL | UNSATISFACTORY */
    @Column(name = "overall_rating", length = 32)
    private String overallRating;

    @Column(name = "total_weighted_score", nullable = false)
    @Builder.Default
    private Integer totalWeightedScore = 0;

    @Column(name = "critical_deficiencies_count", nullable = false)
    @Builder.Default
    private Integer criticalDeficienciesCount = 0;

    @Column(name = "major_deficiencies_count", nullable = false)
    @Builder.Default
    private Integer majorDeficienciesCount = 0;

    @Type(JsonBinaryType.class)
    @Column(name = "key_strengths", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> keyStrengths = List.of();

    @Type(JsonBinaryType.class)
    @Column(name = "systemic_vulnerabilities", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> systemicVulnerabilities = List.of();

    @Column(name = "recommendations_for_director", columnDefinition = "TEXT")
    private String recommendationsForDirector;

    @Type(JsonBinaryType.class)
    @Column(name = "mandatory_corrective_actions", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> mandatoryCorrectiveActions = List.of();

    @Column(name = "lead_qa_officer_signature", length = 128)
    private String leadQaOfficerSignature;

    @Column(name = "qa_team_leader_signature", length = 128)
    private String qaTeamLeaderSignature;

    @Column(name = "director_approval_signature", length = 128)
    private String directorApprovalSignature;

    @Column(name = "signed_date")
    private OffsetDateTime signedDate;

    /** DRAFT | PENDING_TL_REVIEW | RETURNED | APPROVED | ADJUSTED | FINAL */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "DRAFT";

    @Column(name = "tl_comment", columnDefinition = "TEXT")
    private String tlComment;

    @Column(name = "tl_decided_by", length = 64)
    private String tlDecidedBy;

    @Column(name = "tl_decision_at")
    private OffsetDateTime tlDecisionAt;

    @Column(name = "return_reason", columnDefinition = "TEXT")
    private String returnReason;

    @Column(name = "adjustment_reason", columnDefinition = "TEXT")
    private String adjustmentReason;

    @Column(name = "adjusted_by", length = 64)
    private String adjustedBy;

    @Column(name = "adjusted_at")
    private OffsetDateTime adjustedAt;

    @Column(name = "generated_by", length = 64)
    private String generatedBy;

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
