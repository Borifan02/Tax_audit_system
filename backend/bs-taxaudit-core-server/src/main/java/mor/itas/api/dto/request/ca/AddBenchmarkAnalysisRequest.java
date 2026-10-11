package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

/**
 * FR-04.4-06, 14 — Industry benchmark comparison entry.
 */
@Data
public class AddBenchmarkAnalysisRequest {

    @NotBlank(message = "Ratio name is required (e.g. GP_MARGIN)")
    private String ratioName;

    private BigDecimal taxpayerValue;
    private BigDecimal benchmarkValue;
    private String unit;          // %, RATIO, ETB
    private String riskLevel;     // LOW | MEDIUM | HIGH
    private String interpretation;
    private String industryCode;
    private Short dataYear;
}
