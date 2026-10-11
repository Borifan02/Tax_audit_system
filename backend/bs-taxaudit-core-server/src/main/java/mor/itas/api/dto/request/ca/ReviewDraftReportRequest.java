package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * FR-04.4-18 — Team Leader or Director reviews the draft audit report.
 * Decision: APPROVED | REJECTED | RETURNED_FOR_CORRECTION
 */
@Data
public class ReviewDraftReportRequest {

    /** APPROVED | REJECTED | RETURNED_FOR_CORRECTION */
    @NotBlank(message = "Decision is required")
    private String decision;

    private String comments;

    /** Set true to flag case for fraud investigation (FR-04.4-28) */
    private Boolean triggerFraudInvestigation = false;
    private String fraudReason;
}
