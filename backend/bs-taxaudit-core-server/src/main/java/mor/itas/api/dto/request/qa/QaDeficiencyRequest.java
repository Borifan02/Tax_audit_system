package mor.itas.api.dto.request.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaDeficiencyRequest {
    private String dimensionId;
    private String dimensionTitle;
    private String severity;
    private String title;
    private String findingDescription;
    private String statutoryBreach;
    private String correctiveActionMandate;
    private String status;
}
