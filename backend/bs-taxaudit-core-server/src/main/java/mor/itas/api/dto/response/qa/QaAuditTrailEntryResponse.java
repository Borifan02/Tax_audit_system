package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * One entry of the per-review workflow trace rendered by the workspace audit-trail
 * drawer. Mirrors the frontend {@code AuditTrailEntry} contract.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaAuditTrailEntryResponse {

    private String id;
    private String caseId;
    private String user;
    private String action;
    private OffsetDateTime timestamp;
    private String oldValue;
    private String newValue;
    private String details;

    /** Highest FR-04.9.2-xx step this event belongs to, e.g. "FR-04.9.2-06". */
    private String stepCode;
    private String actorRole;
}
