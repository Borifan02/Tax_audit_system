package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Exit conference dossier for one QA review (FR-04.9.2-07 → -10).
 *
 * Both parties draft their own agenda: the QA team ({@code qaTeamAgenda}) and the
 * audit team ({@code auditTeamAgenda}). The team leader / process owner approves;
 * only then may the QA team schedule and conduct the conference.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaExitConferenceResponse {

    private String id;
    private String qaReviewId;
    private String auditCaseId;
    private String auditCaseNumber;

    /** Merged agenda narrative actually used in the conference. */
    private String agenda;

    private List<QaAgendaItemResponse> qaTeamAgenda;
    private List<QaAgendaItemResponse> auditTeamAgenda;

    /** NOT_DRAFTED | DRAFTED | SUBMITTED | APPROVED | REJECTED */
    private String qaAgendaStatus;
    private String auditAgendaStatus;
    private String qaAgendaDraftedBy;
    private OffsetDateTime qaAgendaDraftedAt;
    private String auditAgendaDraftedBy;
    private OffsetDateTime auditAgendaDraftedAt;

    private String agendaApprovedBy;
    private OffsetDateTime agendaApprovedAt;
    private String agendaRejectionReason;

    /** FR-04.9.2-09 — only set once the agenda is approved. */
    private OffsetDateTime scheduledDate;
    private OffsetDateTime heldAt;
    private String conductedBy;
    private String scheduleNotifiedTo;
    private OffsetDateTime scheduleNotifiedAt;
    private List<Map<String, Object>> attendees;

    private String minutes;
    private String conferenceNotes;

    /** FR-04.9.2-10 — true once the QA report has been adjusted from the inputs. */
    private boolean reportAdjusted;
    private String adjustedReportId;
    private OffsetDateTime reportAdjustedAt;
    private String status;
    private String createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
