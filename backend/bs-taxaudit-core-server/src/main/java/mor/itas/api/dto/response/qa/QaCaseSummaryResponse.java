package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Row shape returned by {@code GET /api/qa/cases} — the QA work queue.
 *
 * Mirrors the frontend summary contract and adds the FR-04.9.2 step pointer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaCaseSummaryResponse {

    private String id;
    private String caseNumber;
    private String auditCaseId;
    private String auditCaseNumber;
    private String taxpayerName;
    private String tradeName;
    private String tin;
    private String taxPeriod;
    private String auditType;
    private BigDecimal totalTaxAssessment;
    private String leadAuditor;
    private String auditTeamLeader;
    private String selectionReason;
    private String samplingStrategy;
    private LocalDate selectionDate;
    private LocalDate dueDate;
    private String assignedQAOfficer;
    private String qaTeamLeader;
    private String status;
    /** Highest FR-04.9.2-xx step reached. */
    private String currentStep;
    private Integer overallScore;
    private String rating;
    private long openDeficienciesCount;
    private long criticalDeficienciesCount;
    /** True when the calling actor is the one the workflow is currently waiting on. */
    private boolean requiresAction;
    private OffsetDateTime lastSaved;
    private OffsetDateTime closedAt;
}
