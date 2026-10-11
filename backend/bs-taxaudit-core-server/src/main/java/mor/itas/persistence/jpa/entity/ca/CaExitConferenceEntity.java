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
 * Exit Conference — FR-04.4-18, 19
 * Closing conference where the auditor presents findings to the taxpayer.
 * The taxpayer signs the conference record acknowledging the audit findings.
 */
@Entity
@Table(name = "ca_exit_conferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaExitConferenceEntity {

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

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> agendaItems;

    @Column(columnDefinition = "TEXT")
    private String discussionNotes;

    @Column(columnDefinition = "TEXT")
    private String taxpayerResponseNotes;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, String>> attendees;

    @Builder.Default
    private Boolean attendanceConfirmed = false;

    @Builder.Default
    private Boolean signedByTaxpayer = false;

    private LocalDate signedDate;

    /** PENDING_SCHEDULE | SCHEDULED | CONDUCTED | SIGNED | CANCELLED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING_SCHEDULE";

    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
