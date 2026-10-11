package mor.itas.api.dto.request.da;

import lombok.Data;
import java.util.List;

@Data
public class UpdateQueryRequest {
    private String subject;
    private String question;
    private String statutoryBasis;
    private String dueDate;
    private String status;
    private String resolutionNotes;
    private List<String> attachedEvidenceIds;
}
