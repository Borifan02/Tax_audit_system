package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewCaReportRequest {
    @NotBlank
    private String decision; // APPROVED, REJECTED, ESCALATE_TO_FINAL

    private String comments;
}
