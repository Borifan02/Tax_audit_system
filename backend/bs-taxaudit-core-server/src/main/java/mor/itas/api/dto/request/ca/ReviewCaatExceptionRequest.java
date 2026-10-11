package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * FR-04.4-14, 28 — Auditor reviews a CAAT-flagged exception
 * and decides to create a finding, issue a query, or dismiss it.
 */
@Data
public class ReviewCaatExceptionRequest {

    /** FINDING_CREATED | QUERY_ISSUED | DISMISSED */
    @NotBlank(message = "Disposition is required")
    private String disposition;

    private String actionTakenNotes;

    /** Required when disposition = FINDING_CREATED */
    private String findingTitle;
    private String findingDescription;
}
