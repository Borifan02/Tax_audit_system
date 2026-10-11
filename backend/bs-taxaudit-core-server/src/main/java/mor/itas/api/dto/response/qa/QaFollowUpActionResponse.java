package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * A follow-up action derived from the Director's decision (FR-04.9.2-11 / -12).
 *
 * {@code actionKind} implements the three sub-clauses of FR-04.9.2-12:
 *   PROCEDURAL_ADJUSTMENT  (i)   QA team adjusts procedures per recommendation
 *   STAKEHOLDER_NOTIFICATION(ii) pertinent stakeholders notified for follow-up
 *   DISCIPLINARY_ACTION    (iii) team leader / process owner takes disciplinary action
 *
 * Plus {@code RE_AUDIT_ORDER} for a mandated full re-audit.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaFollowUpActionResponse {

    private String id;
    private String qaReviewId;
    private String auditCaseId;
    private String actionKind;
    private String title;
    private String narrative;
    private String targetActorId;
    private String targetActorName;
    private String targetDepartment;
    private LocalDate dueDate;

    /** PENDING | NOTIFIED | IN_PROGRESS | COMPLETED | VERIFIED | CANCELLED */
    private String status;
    private String decidedBy;
    private OffsetDateTime decidedAt;
    private String completedBy;
    private OffsetDateTime completedAt;
    private String completionEvidence;
    private String verifiedBy;
    private OffsetDateTime verifiedAt;
}
