package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

/**
 * FR-04.4-03, 08 — Balance sheet / income statement assertion test.
 */
@Data
public class AddBalanceSheetItemRequest {

    @NotBlank(message = "Component is required (e.g. Cash, Receivables, Revenue)")
    private String component;

    /** EXISTENCE | COMPLETENESS | VALUATION | RIGHTS_OBLIGATIONS | PRESENTATION */
    @NotBlank(message = "Assertion type is required")
    private String assertionType;

    private BigDecimal auditeeBalance;
    private BigDecimal auditedBalance;

    /** COMPLIANT | NON_COMPLIANT | PARTIAL */
    private String ifrsCompliance;

    private String notes;

    /** SATISFACTORY | ADJUSTED | REFERRED */
    private String auditorConclusion;
}
