package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Working Paper — FR-04.2-10
 * Electronic working paper documenting audit work performed, conclusions,
 * and cross-references to findings and evidence.
 */
@Entity
@Table(name = "ca_working_papers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaWorkingPaperEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 64)
    private String paperReference;

    @Column(nullable = false, length = 256)
    private String title;

    /** PLANNING | EVIDENCE | ANALYSIS | FINDINGS | RECONCILIATION */
    @Column(nullable = false, length = 64)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String workPerformed;

    @Column(columnDefinition = "TEXT")
    private String conclusions;

    @Column(length = 512)
    private String documentUrl;

    /** DRAFT | COMPLETED | REVIEWED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "DRAFT";

    private String preparedBy;
    private OffsetDateTime preparedAt;
    private String reviewedBy;
    private OffsetDateTime reviewedAt;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
