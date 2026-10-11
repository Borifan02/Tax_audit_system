package mor.itas.api.dto.request.da;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class SubmitDraftReportRequest {
    @NotBlank
    private String reportContent;
    @NotNull
    private Boolean significantIssuesIdentified;
    @NotNull
    private Boolean escalateToComprehensive;
    private String escalationReason;
}
