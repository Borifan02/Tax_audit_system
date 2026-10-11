package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * FR-04.4-10, 28, 33 — Create a formal audit finding.
 * The system auto-computes penalty (20%) and stores the fraud flag.
 */
@Data
public class CreateCaFindingRequest {

    @NotBlank(message = "Audit area is required")
    private String auditArea;        // REVENUE, PURCHASES, PAYROLL, VAT, CIT …

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String criteria;
    private String condition;
    private String cause;
    private String effect;

    private BigDecimal underDeclaredAmount;

    /** CIT | VAT | PAYE | WHT */
    private String taxType;

    private String auditorAnalysis;
    private String conclusion;
    private String recommendation;

    // FR-04.4-28 — fraud indicators
    private Boolean indicatesFraud = false;
    private String fraudIndicators;

    // FR-04.4-31 — zone for multi-zone taxpayers
    private String zoneCode;

    /** Link to the CAAT exception that generated this finding */
    private UUID caatExceptionId;

    private Boolean isSignificant = false;
}
