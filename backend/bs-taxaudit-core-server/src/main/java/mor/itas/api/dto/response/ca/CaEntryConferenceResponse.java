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
public class CaEntryConferenceResponse {
    private UUID id;
    private UUID auditCaseId;
    private LocalDate scheduledDate;
    private String scheduledTime;
    private String venue;
    private String internalControlsReview;
    private String premisesInspectionNotes;
    private String audioRecordingUrl;
    private List<Map<String, String>> attendees;
    private Boolean taxpayerConfirmedReceipt;
    private LocalDate taxpayerReceiptDate;
    private String status;
    private String createdBy;
    private Boolean teamLeaderApproved;
    private String reviewedBy;
    private OffsetDateTime reviewedAt;
    private OffsetDateTime createdAt;
}
