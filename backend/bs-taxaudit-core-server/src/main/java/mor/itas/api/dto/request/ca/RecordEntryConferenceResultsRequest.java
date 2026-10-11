package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * FR-04.2.1-03 — Record results captured during the entry conference:
 * internal controls review, premises inspection findings, audio recording URL.
 */
@Data
public class RecordEntryConferenceResultsRequest {

    @NotBlank(message = "Internal controls review is required")
    private String internalControlsReview;

    @NotBlank(message = "Premises inspection notes are required")
    private String premisesInspectionNotes;

    /** Optional URL to the uploaded audio recording */
    private String audioRecordingUrl;
}
