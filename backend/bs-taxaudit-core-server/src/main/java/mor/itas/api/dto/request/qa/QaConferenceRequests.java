package mor.itas.api.dto.request.qa;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Exit-conference payloads for FR-04.9.2-07, -08, -09 and -10.
 */
public final class QaConferenceRequests {

    private QaConferenceRequests() {}

    /**
     * {@code PUT /api/qa/cases/{id}/exit-conference/agenda}.
     *
     * {@code party} selects whose agenda is being drafted:
     *   QA_TEAM    -07  the quality assurance team drafts its agenda
     *   AUDIT_TEAM -08  the audit team drafts its agenda
     */
    @Data
    public static class AgendaRequest {
        @NotBlank
        private String party;
        private List<Map<String, Object>> items;
        /** Optional free-text narrative merged into the conference agenda. */
        private String agenda;
    }

    /** FR-04.9.2-09 — the QA team schedules the conference once the agenda is approved. */
    @Data
    public static class ScheduleRequest {
        @NotBlank
        private String scheduledDate;
        private String venue;
        private List<Map<String, Object>> attendees;
        private Boolean notifyAttendees;
    }

    /** FR-04.9.2-10 — record what actually happened in the conference. */
    @Data
    public static class MinutesRequest {
        private String minutes;
        private String conferenceNotes;
        private List<Map<String, Object>> attendees;
        private OffsetDateTime heldAt;
    }
}
