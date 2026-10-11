package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * A configurable QA sampling rule (FR-04.9.2-01).
 *
 * The sampling engine reads these rows, so "the appropriate sampling method/s
 * are configured in the system" is satisfied by data, not by code.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaSamplingRuleResponse {

    private String id;
    private String code;
    private String name;
    private String strategy;
    private String selectionReason;
    private BigDecimal exposureThreshold;
    private BigDecimal samplePercentage;
    private Integer maxSampleSize;
    private List<String> auditTypes;
    private boolean active;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String createdBy;
}
