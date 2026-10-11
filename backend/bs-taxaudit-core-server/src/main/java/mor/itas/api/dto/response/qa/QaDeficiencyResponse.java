package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * A formal quality deficiency item the QA team raises against the audit file.
 *
 * Mirrors the frontend {@code QADeficiencyItem} contract. {@code status} is one
 * of OPEN | REMEDIATION_SUBMITTED | ACCEPTED_RESOLVED | DISPUTED.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaDeficiencyResponse {

    private String id;
    private String dimensionId;
    private String dimensionTitle;
    private String severity;
    private String title;
    private String findingDescription;
    private String statutoryBreach;
    private String correctiveActionMandate;
    private String status;
    private String auditorResponse;
    private String remediationEvidenceRef;
    private OffsetDateTime resolvedAt;
}
