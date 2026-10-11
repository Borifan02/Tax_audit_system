package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * FR-04.4-19, 20 — Dispatch finalized draft report to taxpayer.
 * Records dispatch timestamp and computes objection deadline.
 */
@Data
public class DispatchReportRequest {

    /** Number of days taxpayer has to raise an objection (FR-04.4-27) */
    @NotNull(message = "Objection window days required")
    private Integer objectionWindowDays;
}
