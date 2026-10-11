package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Approval Step — FR-04.4-18
 * Immutable record of each approval decision made on a CA artifact
 * (EXECUTION_REPORT, DRAFT_REPORT, NOTICE). Level 1 = Team Leader, Level 2 = Director.
 */
@Entity
@Table(name = "ca_approval_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaApprovalStepEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    /** EXECUTION_REPORT | DRAFT_REPORT | NOTICE */
    @Column(nullable = false, length = 32)
    private String entityType;

    @Column(nullable = false)
    private UUID entityId;

    /** 1 = Team Leader, 2 = Director */
    @Column(nullable = false)
    private Short approvalLevel;

    @Column(nullable = false, length = 64)
    private String approverRole;

    @Column(nullable = false, length = 64)
    private String approverId;

    /** APPROVED | REJECTED | RETURNED */
    @Column(nullable = false, length = 16)
    private String decision;

    @Column(columnDefinition = "TEXT")
    private String comments;

    private OffsetDateTime decidedAt;
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (decidedAt == null) decidedAt = OffsetDateTime.now();
    }
}
