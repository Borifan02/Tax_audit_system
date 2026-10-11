package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class CaExitConferenceResponse {
    private UUID id;
    private UUID auditCaseId;
    private LocalDate scheduledDate;
    private String scheduledTime;
    private String venue;
    private List<String> agendaItems;
    private String discussionNotes;
    private String taxpayerResponseNotes;
    private List<Map<String, String>> attendees;
    private Boolean attendanceConfirmed;
    private Boolean signedByTaxpayer;
    private LocalDate signedDate;
    private String status;
    private String createdBy;
    private OffsetDateTime createdAt;
}
