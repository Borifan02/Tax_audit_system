package mor.itas.persistence.jpa.entity.da;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "da_queries")
@Data
public class DaQueryEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID auditCaseId;

    @Column(name = "reference", length = 64)
    private String reference;

    @Column(length = 255)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String question;

    @Column(name = "statutory_basis", columnDefinition = "TEXT")
    private String statutoryBasis;

    @Column(name = "due_date")
    private String dueDate;

    @Column(columnDefinition = "TEXT")
    private String taxpayerResponse;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(length = 64)
    private String status; // e.g. OPEN, RESOLVED

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
