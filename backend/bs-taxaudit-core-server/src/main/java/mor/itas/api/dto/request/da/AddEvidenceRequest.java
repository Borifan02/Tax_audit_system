package mor.itas.api.dto.request.da;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class AddEvidenceRequest {
    @NotBlank
    private String documentName;
    @NotBlank
    private String documentSource;
    private String documentUrl;
}
