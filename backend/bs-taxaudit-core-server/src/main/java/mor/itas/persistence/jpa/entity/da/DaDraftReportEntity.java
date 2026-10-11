package mor.itas.persistence.jpa.entity.da;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "da_draft_reports")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DaDraftReportEntity {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @com.fasterxml.jackson.annotation.JsonProperty("auditCaseId")
    public java.util.UUID getAuditCaseIdValue() {
        return auditCase != null ? auditCase.getId() : null;
    }

    @Column(name = "report_content", nullable = false, columnDefinition = "TEXT")
    private String reportContent;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "significant_issues_identified")
    @Builder.Default
    private Boolean significantIssuesIdentified = false;

    @Column(name = "escalated_to_comprehensive")
    @Builder.Default
    private Boolean escalatedToComprehensive = false;

    @Column(name = "escalation_reason", columnDefinition = "TEXT")
    private String escalationReason;

    @Column(name = "team_leader_comments", columnDefinition = "TEXT")
    private String teamLeaderComments;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "created_at")
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "reviewed_by", length = 64)
    private String reviewedBy;
}
