package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * A completed audit case from the audit modules that is eligible for QA sampling.
 *
 * This is the cross-module seam required by FR-04.9.2-01: QA never owns the audit
 * case, it only *reads* completed ones. {@code alreadyUnderReview} lets the
 * selection screen hide cases that already have an open QA review.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaEligibleCaseResponse {

    private UUID auditCaseId;
    private String auditCaseNumber;
    private String auditType;
    private String taxpayerName;
    private String tin;
    private String taxPeriod;
    private BigDecimal totalTaxAssessment;
    private String leadAuditor;
    private String auditTeamLeader;
    private String status;
    private OffsetDateTime completedAt;
    private String riskCategory;
    private Integer riskScore;
    private LocalDate dueDate;

    /** FR-04.9.2-01 — true when an open QA review already exists for this case. */
    private boolean alreadyUnderReview;

    /** Which configured sampling rule matched, if any (null for DIRECTOR_REFERRAL). */
    private String matchedSamplingRuleCode;
    private String matchedSelectionReason;

    /** Human-readable justification shown in the picker. */
    private List<String> matchReasons;
}
