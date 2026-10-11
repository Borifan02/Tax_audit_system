package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

/**
 * FR-04.4-07 — Third-party data matching record.
 */
@Data
public class AddThirdPartyMatchRequest {

    /** CUSTOMS | BANKS | SUPPLIERS | NBE | SOCIAL_SECURITY | ASYCUDA | SIGTAS */
    @NotBlank(message = "Data source is required")
    private String dataSource;

    private BigDecimal declaredValue;
    private BigDecimal thirdPartyValue;
    private String periodCovered;
    private String discrepancyNotes;
}
