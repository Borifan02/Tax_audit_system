package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.UUID;

/**
 * FR-04.4-27, 30 — Record a taxpayer response to the draft report or notice.
 * type: ACKNOWLEDGEMENT | OBJECTION | APPEAL | QUERY_RESPONSE
 */
@Data
public class RecordTaxpayerResponseRequest {

    /** ACKNOWLEDGEMENT | OBJECTION | APPEAL | QUERY_RESPONSE */
    @NotBlank(message = "Response type is required")
    private String responseType;

    @NotBlank(message = "Response text is required")
    private String responseText;

    @NotBlank(message = "Submitted by (taxpayer name / agent) is required")
    private String submittedBy;

    /** URLs of attached supporting documents */
    private List<String> documentUrls;

    /** The notice or draft report being responded to */
    private UUID noticeId;
    private UUID draftReportId;
}
