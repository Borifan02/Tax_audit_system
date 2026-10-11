package mor.itas.persistence.jpa.entity.da;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "da_audit_procedures")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DaAuditProcedureEntity {

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

    @Column(name = "procedure_description", nullable = false, columnDefinition = "TEXT")
    private String procedureDescription;

    @Column(name = "observation", columnDefinition = "TEXT")
    private String observation;

    @Column(name = "finding", columnDefinition = "TEXT")
    private String finding;

    @Column(name = "issue_identified")
    @Builder.Default
    private Boolean issueIdentified = false;

    @Column(name = "conclusion", columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "created_at")
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
