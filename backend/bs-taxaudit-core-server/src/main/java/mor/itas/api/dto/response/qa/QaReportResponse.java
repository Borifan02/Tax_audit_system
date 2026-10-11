package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaReportResponse {
    private String id;
    private String qaReviewId;
    private String generatedDate;
    private String executiveSummary;
    private String overallRating;
    private Integer totalWeightedScore;
    private Integer criticalDeficienciesCount;
    private Integer majorDeficienciesCount;
    private String keyStrengths;
    private String systemicVulnerabilities;
    private String recommendationsForDirector;
    private String mandatoryCorrectiveActions;
}
