package mor.itas.api.dto.request.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaFollowUpDto {
    private String id;
    private String deficiencyId;
    private String originalAuditorId;
    private String status;
    private String dueDate;
    private String correctiveActionProof;
}
