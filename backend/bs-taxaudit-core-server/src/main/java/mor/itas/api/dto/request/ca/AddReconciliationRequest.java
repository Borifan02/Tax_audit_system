package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

/**
 * FR-04.4-16 — Reconciliation entry.
 * type: VAT_VS_SALES | PAYROLL_PAYE_VS_PNL | CUSTOMS_VS_PURCHASES | REVENUE_VS_INVOICES
 */
@Data
public class AddReconciliationRequest {

    @NotBlank(message = "Reconciliation type is required")
    private String reconciliationType;

    @NotBlank(message = "Source A label is required")
    private String sourceALabel;

    @NotNull(message = "Source A amount is required")
    private BigDecimal sourceAAmount;

    @NotBlank(message = "Source B label is required")
    private String sourceBLabel;

    @NotNull(message = "Source B amount is required")
    private BigDecimal sourceBAmount;

    // Optional third source (e.g. TIMS e-invoices)
    private String sourceCLabel;
    private BigDecimal sourceCAmount;

    private String periodCovered;
    private String auditorNotes;
}
