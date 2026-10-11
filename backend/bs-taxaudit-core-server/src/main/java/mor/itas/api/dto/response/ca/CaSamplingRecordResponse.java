package mor.itas.api.dto.response.ca;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CaSamplingRecordResponse {
    private UUID id;
    private UUID auditCaseId;
    private String samplingType;
    private String targetPopulation;
    private Integer populationSize;
    private Integer sampleSize;
    private String selectionCriteria;
    private String sampleDescription;
    private String findingsSummary;
    private String status;
    private String createdBy;
    private OffsetDateTime createdAt;
}
