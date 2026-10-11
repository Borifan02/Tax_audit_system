package mor.itas.persistence.jpa.entity.da;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "da_evidence")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DaEvidenceEntity {

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

    @Column(name = "document_name", nullable = false, length = 255)
    private String documentName;

    @Column(name = "document_source", nullable = false, length = 64)
    private String documentSource;

    @Column(name = "document_url", length = 512)
    private String documentUrl;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "uploaded_by", length = 64)
    private String uploadedBy;

    @Column(name = "uploaded_at")
    @Builder.Default
    private OffsetDateTime uploadedAt = OffsetDateTime.now();

    @Column(name = "created_at")
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
