package mor.itas.api.dto.request.qa;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewQaActionPlanRequest {
    @NotBlank
    private String decision; // APPROVED, REJECTED

    private String comments;
}
