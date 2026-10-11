package mor.itas.persistence.jpa.entity.ca;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Entry Conference — FR-04.2.1-01 → 05
 * The initial meeting with the taxpayer at which internal controls are reviewed
 * and premises are inspected. Team leader must approve; taxpayer confirms receipt.
 */
@Entity
@Table(name = "ca_entry_conferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaEntryConferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false)
    private LocalDate scheduledDate;

    @Column(length = 16)
    private String scheduledTime;

    @Column(length = 256)
    private String venue;

    @Column(columnDefinition = "TEXT")
    private String internalControlsReview;

    @Column(columnDefinition = "TEXT")
    private String premisesInspectionNotes;

    @Column(length = 512)
    private String audioRecordingUrl;

    /** Attendees: [{name, role, organization}] */
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, String>> attendees;

    @Builder.Default
    private Boolean taxpayerConfirmedReceipt = false;
    private LocalDate taxpayerReceiptDate;

    /** SCHEDULED | CONDUCTED | CONFIRMED | CANCELLED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "SCHEDULED";

    private String createdBy;
    private String reviewedBy;
    private OffsetDateTime reviewedAt;

    @Builder.Default
    private Boolean teamLeaderApproved = false;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
