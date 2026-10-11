package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AddAuditAssertionRequest {
    @NotBlank
    private String financialArea;

    @NotBlank
    private String assertionType;

    private BigDecimal expectedValue;
    private BigDecimal actualValue;
    private String verificationResult;
    private String explanation;
    private String finding;
    private String conclusion;
}
