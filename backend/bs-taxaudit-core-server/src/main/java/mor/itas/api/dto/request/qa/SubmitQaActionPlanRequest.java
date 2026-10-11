package mor.itas.api.dto.request.qa;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitQaActionPlanRequest {
    @NotBlank
    private String objectives;

    @NotBlank
    private String reviewScope;
}
