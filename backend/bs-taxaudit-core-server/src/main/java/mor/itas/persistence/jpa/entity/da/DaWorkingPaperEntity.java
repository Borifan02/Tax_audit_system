package mor.itas.persistence.jpa.entity.da;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "da_working_papers")
@Data
public class DaWorkingPaperEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID auditCaseId;

    @Column(name = "reference", length = 64)
    private String reference;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(length = 128)
    private String category;

    @Column(name = "prepared_by", length = 128)
    private String preparedBy;

    @Column(name = "paper_date")
    private String date;

    @Column(name = "work_performed", columnDefinition = "TEXT")
    private String workPerformed;

    @Column(columnDefinition = "TEXT")
    private String conclusions;

    @Column(length = 64)
    private String status;

    @Column(name = "related_procedure_id", length = 64)
    private String relatedProcedureId;

    @Column(name = "related_finding_id", length = 64)
    private String relatedFindingId;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
