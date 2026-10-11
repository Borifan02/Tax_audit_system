package mor.itas.api.dto.request.da;

import lombok.Data;
import java.util.List;

@Data
public class UpdateWorkingPaperRequest {
    private String title;
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
