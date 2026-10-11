package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * FR-04.4-13, 15, 16 — Document the sampling methodology used.
 */
@Data
public class AddSamplingRecordRequest {

    /** STRATIFIED | RANDOM | SYSTEMATIC_MUS */
    @NotBlank(message = "Sampling type is required")
    private String samplingType;

    /** REVENUE_TRANSACTIONS | EXPENSE_RECORDS | INVENTORY | PAYROLL */
    @NotBlank(message = "Target population is required")
    private String targetPopulation;

    private Integer populationSize;
    private Integer sampleSize;
    private String selectionCriteria;
    private String sampleDescription;
}
