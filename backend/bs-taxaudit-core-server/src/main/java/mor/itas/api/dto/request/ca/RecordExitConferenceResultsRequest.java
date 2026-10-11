package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * FR-04.4-19 — Record results of exit conference and taxpayer signature.
 */
@Data
public class RecordExitConferenceResultsRequest {

    @NotBlank(message = "Discussion notes are required")
    private String discussionNotes;

    private String taxpayerResponseNotes;
    private Boolean attendanceConfirmed = false;
    private Boolean signedByTaxpayer = false;
    private String signedDate;  // ISO yyyy-MM-dd
}
