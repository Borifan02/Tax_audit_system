package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * High-level summary of a comprehensive audit case returned on every workspace load.
 */
@Data
@Builder
public class CaCaseOverviewResponse {

    private UUID caseId;
    private String caseNumber;
    private String taxpayerName;
    private String tin;
    private String taxCenter;
    private String auditType;
    private String status;
    private String caWorkflowStatus;   // OPENED → … → COMPLETED
    private String caCurrentPhase;

    // Taxpayer profile
    private String taxpayerSegment;    // LTO | MTO | STO
    private Integer riskScore;
    private String riskCategory;       // HIGH | MEDIUM | LOW

    // Key dates
    private String startDate;
    private String dueDate;
    private String auditScope;

    // Assigned personnel
    private String assignedAuditorId;
    private String teamLeaderId;

    // Progress counters (populated by service)
    private Integer totalFindings;
    private Integer fraudFindings;
    private Integer openQueries;
    private Integer workingPapers;
    private Boolean caatEligible;
    private BigDecimal estimatedTaxExposure;

    // Approval chain current state
    private String reportStatus;       // null | DRAFT | TL_APPROVED | DIRECTOR_APPROVED | FINALIZED
    private String noticeStatus;       // null | DRAFT | ISSUED | ACKNOWLEDGED | OBJECTED
}
