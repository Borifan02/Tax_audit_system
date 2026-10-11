package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CaTaxpayerResponseDto {
    private UUID id;
    private UUID auditCaseId;
    private UUID noticeId;
    private UUID draftReportId;
    private String responseType;
    private String responseText;
    private String submittedBy;
    private OffsetDateTime submittedAt;
    private List<String> documentUrls;
    private String status;
    private String reviewedBy;
    private OffsetDateTime reviewedAt;
    private String auditorNotes;
    private OffsetDateTime createdAt;
}
