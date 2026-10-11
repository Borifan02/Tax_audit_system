package mor.itas.api.dto.request.da;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class CreateQueryRequest {
    @NotBlank
    private String reference;
    @NotBlank
    private String subject;
    @NotBlank
    private String question;
    private String statutoryBasis;
    private String dueDate;
    private String status;
    private List<String> attachedEvidenceIds;
}
