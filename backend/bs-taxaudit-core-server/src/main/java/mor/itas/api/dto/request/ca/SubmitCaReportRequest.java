package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitCaReportRequest {
    @NotBlank
    private String reportContent;

    private Boolean caatEligible;
}
