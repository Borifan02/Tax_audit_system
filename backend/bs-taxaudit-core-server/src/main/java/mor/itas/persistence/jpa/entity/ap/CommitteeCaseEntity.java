package mor.itas.persistence.jpa.entity.ap;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * JPA Entity for Committee Cases
 * Represents cases awaiting committee review and decision
 */
@Entity
@Table(name = "t_committee_case")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommitteeCaseEntity {

    @Id
    private UUID caseId;

    @Column(nullable = false)
    private UUID originalCaseId;

    @Column(name = "case_code", unique = true)
    private String caseCode;

    @Column(nullable = false)
    private UUID taxpayerId;

    @Column(nullable = false, length = 255)
    private String taxpayerName;

    @Column(nullable = false, unique = true, length = 50)
    private String taxIdNumber;

    @Column(length = 50)
    private String segment;

    @Column(length = 100)
    private String industry;

    @Column(nullable = false)
    private Integer riskScore;

    @Column(length = 20)
    private String riskPriority;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> riskCriteria;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(nullable = false)
    private OffsetDateTime createdDate;

    @Column(nullable = false)
    private OffsetDateTime committeeDeadline;

    @Column(name = "extended_deadline")
    private OffsetDateTime extendedDeadline;

    @Column(name = "extension_count")
    @Builder.Default
    private Integer extensionCount = 0;

    @Column(length = 50)
    private String decision;

    @Column(name = "chairperson_id")
    private UUID chairpersonId;

    @Column(name = "team_lead_id")
    private UUID teamLeadId;

    @Column(name = "current_owner_id")
    private UUID currentOwnerId;

    // Explicit getters for the failing methods
    public UUID getOriginalCaseId() { return this.originalCaseId; }
    public String getStatus() { return this.status; }
    public String getDecision() { return this.decision; }
    public UUID getChairpersonId() { return this.chairpersonId; }
    public UUID getTeamLeadId() { return this.teamLeadId; }
    public UUID getCurrentOwnerId() { return this.currentOwnerId; }


    // ── Extended case details ──────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "business_type", length = 100)
    private String businessType;

    @Column(name = "total_amount")
    private java.math.BigDecimal totalAmount;

    @Column(name = "assessment_score", length = 50)
    private String assessmentScore;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String region;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "compliance_issues", columnDefinition = "jsonb")
    private List<String> complianceIssues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_indicators", columnDefinition = "jsonb")
    private List<Map<String, Object>> riskIndicators;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "representatives", columnDefinition = "jsonb")
    private List<Map<String, String>> representatives;

    // ── Ownership ──────────────────────────────────────────────────

    // Removed duplicates

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "tax_center", length = 100)
    private String taxCenter;

    @Column(name = "handoff_record_id")
    private UUID handoffRecordId;

    @Column(name = "handoff_date")
    private OffsetDateTime handoffDate;

    @Column(nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Version
    private Long version;

    // Relationships
    @OneToMany(mappedBy = "committeeCaseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommitteeVoteEntity> votes = new ArrayList<>();

    @OneToMany(mappedBy = "committeeCaseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResearchNoteEntity> researchNotes = new ArrayList<>();

    @OneToMany(mappedBy = "committeeCaseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AuditorNominationEntity> nominations = new ArrayList<>();

    @OneToMany(mappedBy = "committeeCaseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CaseStatusHistoryEntity> statusHistory = new ArrayList<>();

    @OneToMany(mappedBy = "committeeCaseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommitteeAuditLogEntity> auditLog = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (caseId == null) {
            caseId = UUID.randomUUID();
        }
        if (createdDate == null) {
            createdDate = OffsetDateTime.now();
        }
    }
}
