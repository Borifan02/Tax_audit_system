package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * FR-04.4-18, 19 — Schedule or record the exit conference.
 */
@Data
public class ScheduleExitConferenceRequest {

    @NotBlank(message = "Scheduled date is required (ISO: yyyy-MM-dd)")
    private String scheduledDate;

    private String scheduledTime;
    private String venue;
    private List<String> agendaItems;
    private List<Map<String, String>> attendees;
}
