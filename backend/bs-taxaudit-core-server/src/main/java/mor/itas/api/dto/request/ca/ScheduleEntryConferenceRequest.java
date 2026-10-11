package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * FR-04.2.1-01 — Schedule or update the entry conference with the taxpayer.
 */
@Data
public class ScheduleEntryConferenceRequest {

    @NotBlank(message = "Scheduled date is required (ISO: yyyy-MM-dd)")
    private String scheduledDate;

    private String scheduledTime;
    private String venue;

    /** Attendees: [{name, role, organization}] */
    private List<Map<String, String>> attendees;
}
