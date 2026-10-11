package mor.itas.api.dto.request.da;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewDraftReportRequest {
    @NotBlank
    private String decision; // APPROVED, REJECTED, ESCALATE

    private String comments;

    @NotNull
    private Boolean significantIssues;
}
