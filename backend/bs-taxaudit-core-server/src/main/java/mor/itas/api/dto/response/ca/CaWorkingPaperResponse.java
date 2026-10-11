package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaWorkingPaperResponse {
    private UUID id;
    private UUID auditCaseId;
    private String paperReference;
    private String title;
    private String category;
    private String workPerformed;
    private String conclusions;
    private String documentUrl;
    private String status;
    private String preparedBy;
    private OffsetDateTime preparedAt;
    private String reviewedBy;
    private OffsetDateTime reviewedAt;
    private OffsetDateTime createdAt;
}
