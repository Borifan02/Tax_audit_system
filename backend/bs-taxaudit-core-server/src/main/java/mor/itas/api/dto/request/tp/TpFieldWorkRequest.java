package mor.itas.api.dto.request.tp;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class TpFieldWorkRequest {
    private String section; // ACCOUNTING, TRANSACTION_TRAILS, SAMPLE_SELECTION, INFORMATION_REQUEST, FACT_STATEMENT, STRUCTURED_DISCUSSION
    private String accountingMethods;
    private JsonNode data;         // generic payload for any field work section
    private String factStatementStatus;
    private Integer factStatementVersion;
    private String status;
    private String comments;
}
