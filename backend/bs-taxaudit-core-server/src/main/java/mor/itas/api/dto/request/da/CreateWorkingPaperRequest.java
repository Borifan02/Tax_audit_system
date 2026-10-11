package mor.itas.api.dto.request.da;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class CreateWorkingPaperRequest {
    @NotBlank
    private String reference;
    @NotBlank
    private String title;
    @NotBlank
    private String category;
    private String preparedBy;
    private String date;
    private String workPerformed;
    private String conclusions;
    private String status;
    private String relatedProcedureId;
    private String relatedFindingId;
    private List<String> evidenceIds;
}
