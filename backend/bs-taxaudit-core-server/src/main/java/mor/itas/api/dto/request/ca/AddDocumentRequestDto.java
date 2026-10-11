package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddDocumentRequestDto {
    @NotBlank
    private String requestDescription;

    @NotBlank
    private String requestedDocument;

    private String dueDate;
}
