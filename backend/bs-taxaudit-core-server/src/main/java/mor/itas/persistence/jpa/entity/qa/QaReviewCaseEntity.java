package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Audit Quality Assurance Review — aggregate root.
 *
 * SoR Module D, "Conduct Audit Quality Assurance Review":
 *   FR-04.9.2-01  sampled from completed cases (selectionReason/samplingStrategy)
 *   FR-04.9.2-02  auto-assigned to the QA team (assignedQaOfficerId/qaTeamLeaderId)
 *   FR-04.9.2-13  closed only once recommendations are verified as addressed
 *
 * QA is a sibling of the audit case, never a subtype: QA reads the completed
 * case and never mutates it (the audited case is protected by
 * {@code ap_audit_cases.qa_read_only_lock}).
 *
 * Status lifecycle (matches the QA workspace):
 *   PENDING_ASSIGNMENT -> IN_REVIEW -> PENDING_TL_REVIEW -> RETURNED_TO_OFFICER
 *   -> DEFICIENCY_ISSUED -> AUDIT_RESPONSE_RECEIVED -> PENDING_DIRECTOR_SIGNOFF
 *   -> PASSED_COMPLIANT | PASSED_WITH_CONDITIONS | REJECTED_REAUDIT_MANDATED
 */
@Entity
@Table(name = "qa_review_case", indexes = {
    @Index(name = "idx_qa_review_case_status",     columnList = "status"),
    @Index(name = "idx_qa_review_case_audit_case", columnList = "audit_case_id"),
    @Index(name = "idx_qa_review_case_officer",    columnList = "assigned_qa_officer_id"),
    @Index(name = "idx_qa_review_case_tl",         columnList = "qa_team_leader_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaReviewCaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Human-readable QA reference, e.g. QA-REV-2026-001. */
    @Column(name = "case_number", nullable = false, unique = true, length = 64)
    private String caseNumber;

    /** The completed audit case being reviewed — read-only from QA's side. */
    @Column(name = "audit_case_id", nullable = false)
    private UUID auditCaseId;

    @Column(name = "audit_case_number", length = 64)
    private String auditCaseNumber;

    @Column(name = "audit_type", length = 32)
    private String auditType;

    @Column(name = "taxpayer_name", length = 256)
    private String taxpayerName;

    @Column(name = "trade_name", length = 256)
    private String tradeName;

    @Column(length = 32)
    private String tin;

    @Column(name = "tax_period", length = 64)
    private String taxPeriod;

    @Column(name = "total_tax_assessment", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalTaxAssessment = BigDecimal.ZERO;

    @Column(name = "lead_auditor", length = 128)
    private String leadAuditor;

    @Column(name = "lead_auditor_id", length = 64)
    private String leadAuditorId;

    @Column(name = "audit_team_leader", length = 128)
    private String auditTeamLeader;

    @Column(name = "audit_team_leader_id", length = 64)
    private String auditTeamLeaderId;

    /** MANDATORY_HIGH_EXPOSURE | RANDOM_STATUTORY_SAMPLE | RISK_BASED_SELECTION | DIRECTOR_REFERRAL */
    @Column(name = "selection_reason", nullable = false, length = 32)
    @Builder.Default
    private String selectionReason = "RISK_BASED_SELECTION";

    /** RANDOM | STRATIFIED | RISK_WEIGHTED | MONETARY_UNIT | MANDATORY_HIGH_EXPOSURE */
    @Column(name = "sampling_strategy", nullable = false, length = 32)
    @Builder.Default
    private String samplingStrategy = "RISK_BASED_SELECTION";

    @Column(name = "sampling_rule_code", length = 64)
    private String samplingRuleCode;

    @Column(name = "sampling_score")
    private Integer samplingScore;

    @Column(name = "selection_date", nullable = false)
    @Builder.Default
    private LocalDate selectionDate = LocalDate.now();

    @Column(name = "selected_by", length = 64)
    private String selectedBy;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "assigned_qa_officer", length = 128)
    private String assignedQaOfficer;

    @Column(name = "assigned_qa_officer_id", length = 64)
    private String assignedQaOfficerId;

    @Column(name = "assigned_at")
    private OffsetDateTime assignedAt;

    @Column(name = "assigned_by", length = 64)
    private String assignedBy;

    @Column(name = "qa_team_leader", length = 128)
    private String qaTeamLeader;

    @Column(name = "qa_team_leader_id", length = 64)
    private String qaTeamLeaderId;

    @Column(name = "qa_director_id", length = 64)
    private String qaDirectorId;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING_ASSIGNMENT";

    /** Highest FR-04.9.2-xx step reached, e.g. "FR-04.9.2-06". */
    @Column(name = "current_step", length = 16)
    private String currentStep;

    @Column(name = "status_reason", columnDefinition = "TEXT")
    private String statusReason;

    @Column(name = "overall_score", nullable = false)
    @Builder.Default
    private Integer overallScore = 0;

    @Column(length = 32)
    private String rating;

    @Column(name = "audit_team_response_notes", columnDefinition = "TEXT")
    private String auditTeamResponseNotes;

    @Column(name = "audit_team_response_date")
    private OffsetDateTime auditTeamResponseDate;

    @Column(name = "audit_team_responded_by", length = 64)
    private String auditTeamRespondedBy;

    @Column(name = "qa_team_leader_comment", columnDefinition = "TEXT")
    private String qaTeamLeaderComment;

    @Column(name = "qa_team_leader_decision_date")
    private OffsetDateTime qaTeamLeaderDecisionDate;

    @Column(name = "director_executive_comment", columnDefinition = "TEXT")
    private String directorExecutiveComment;

    @Column(name = "director_executive_decision_date")
    private OffsetDateTime directorExecutiveDecisionDate;

    @Column(name = "director_statutory_order", length = 64)
    private String directorStatutoryOrder;

    /** FR-04.9.2-13 — null until the closure check has been performed. */
    @Column(name = "recommendations_addressed")
    private Boolean recommendationsAddressed;

    @Column(name = "closure_note", columnDefinition = "TEXT")
    private String closureNote;

    @Column(name = "closure_checked_by", length = 64)
    private String closureCheckedBy;

    @Column(name = "closure_checked_at")
    private OffsetDateTime closureCheckedAt;

    @Column(name = "last_saved_at")
    private OffsetDateTime lastSavedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "created_by", nullable = false, length = 64)
    @Builder.Default
    private String createdBy = "SYSTEM";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    /**
     * Optimistic-locking guard — the QA officer, QA team leader and QA director
     * all mutate this row, so concurrent edits must not silently overwrite.
     * Deliberately left null on new instances so Hibernate treats them as new.
     */
    @Version
    @Column(nullable = false)
    private Long version;

    // ── Status constants (single source of truth for the workflow) ───────────
    public static final String STATUS_PENDING_ASSIGNMENT   = "PENDING_ASSIGNMENT";
    public static final String STATUS_IN_REVIEW            = "IN_REVIEW";
    public static final String STATUS_PENDING_TL_REVIEW    = "PENDING_TL_REVIEW";
    public static final String STATUS_RETURNED_TO_OFFICER  = "RETURNED_TO_OFFICER";
    public static final String STATUS_DEFICIENCY_ISSUED    = "DEFICIENCY_ISSUED";
    public static final String STATUS_AUDIT_RESPONSE_RECEIVED = "AUDIT_RESPONSE_RECEIVED";
    public static final String STATUS_PENDING_DIRECTOR_SIGNOFF = "PENDING_DIRECTOR_SIGNOFF";
    public static final String STATUS_PASSED_COMPLIANT     = "PASSED_COMPLIANT";
    public static final String STATUS_PASSED_WITH_CONDITIONS = "PASSED_WITH_CONDITIONS";
    public static final String STATUS_REJECTED_REAUDIT_MANDATED = "REJECTED_REAUDIT_MANDATED";
}
