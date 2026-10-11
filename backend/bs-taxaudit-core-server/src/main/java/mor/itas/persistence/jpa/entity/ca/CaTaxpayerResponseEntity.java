package mor.itas.persistence.jpa.entity.ca;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.Type;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Taxpayer Response / Objection — FR-04.4-27, 30
 * Records the taxpayer's formal response to the draft report or assessment notice.
 * Types: ACKNOWLEDGEMENT, OBJECTION, APPEAL, QUERY_RESPONSE
 */
@Entity
@Table(name = "ca_taxpayer_responses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaTaxpayerResponseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id")
    private CaAssessmentNoticeEntity notice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "draft_report_id")
    private CaDraftReportEntity draftReport;

    /** ACKNOWLEDGEMENT | OBJECTION | APPEAL | QUERY_RESPONSE */
    @Column(nullable = false, length = 32)
    private String responseType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String responseText;

    private String submittedBy;   // taxpayer name / tax agent

    private OffsetDateTime submittedAt;

    /** URLs of attached documents */
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> documentUrls;

    /** RECEIVED | UNDER_REVIEW | ACCEPTED | REJECTED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "RECEIVED";

    private String reviewedBy;
    private OffsetDateTime reviewedAt;

    @Column(columnDefinition = "TEXT")
    private String auditorNotes;

    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (submittedAt == null) submittedAt = OffsetDateTime.now();
    }
}
