package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Draft Audit Report — FR-04.4-10, 18
 * Full narrative report compiled after execution is complete.
 * Routes through Team Leader → Director approval chain.
 * After final approval it is dispatched to the taxpayer (FR-04.4-19/20).
 *
 * Status machine:
 *   DRAFT → SUBMITTED_TO_TL → TL_APPROVED | TL_REJECTED
 *   TL_APPROVED → SUBMITTED_TO_DIRECTOR → DIRECTOR_APPROVED | DIRECTOR_REJECTED
 *   DIRECTOR_APPROVED → FINALIZED (triggers notice generation)
 */
@Entity
@Table(name = "ca_draft_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaDraftReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 64, unique = true)
    private String reportReference;

    @Column(columnDefinition = "TEXT")
    private String executiveSummary;

    @Column(columnDefinition = "TEXT")
    private String scopeAndObjectives;

    @Column(columnDefinition = "TEXT")
    private String methodology;

    @Column(columnDefinition = "TEXT")
    private String findingsSummary;

    @Column(columnDefinition = "TEXT")
    private String recommendedAdjustments;

    @Column(columnDefinition = "TEXT")
    private String statutoryRecommendations;

    @Column(columnDefinition = "TEXT")
    private String ifrsComplianceNotes;

    // ── Financial summary ─────────────────────────────────────────────────────
    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPrincipalTax = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPenalty = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalInterest = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAssessment = BigDecimal.ZERO;

    // ── Approval chain ────────────────────────────────────────────────────────
    @Column(nullable = false, length = 64)
    @Builder.Default
    private String status = "DRAFT";

    @Column(columnDefinition = "TEXT")
    private String teamLeaderComments;
    private OffsetDateTime teamLeaderReviewedAt;
    private String teamLeaderReviewedBy;

    @Column(columnDefinition = "TEXT")
    private String directorComments;
    private OffsetDateTime directorReviewedAt;
    private String directorReviewedBy;

    // ── Taxpayer dispatch — FR-04.4-19, 20 ───────────────────────────────────
    private OffsetDateTime sentToTaxpayerAt;
    private String sentBy;
    private OffsetDateTime taxpayerSignedAt;
    private OffsetDateTime taxpayerObjectionDeadline;

    @Builder.Default
    private Boolean undelivered = false;
    private String undeliveredReason;

    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
