package mor.itas.api.dto.request.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaReportRequest {
    private String executiveSummary;
    private String overallRating;
    private Integer totalWeightedScore;
    private Integer criticalDeficienciesCount;
    private Integer majorDeficienciesCount;
    private String keyStrengths; // Comma separated in DB, passed as JSON Array usually, but let's just make it String for simplicity
    private String systemicVulnerabilities;
    private String recommendationsForDirector;
    private String mandatoryCorrectiveActions;
}
