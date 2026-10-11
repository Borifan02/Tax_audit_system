package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateQuerySheetRequest {
    @NotBlank
    private String question;

    private String supportingContext;
    private String requestedInformation;
    private String dueDate;
}
