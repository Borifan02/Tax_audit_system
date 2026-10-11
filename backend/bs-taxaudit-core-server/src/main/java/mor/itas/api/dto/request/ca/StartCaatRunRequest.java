package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * FR-04.4-02 — Start a new CAAT execution run.
 * The auditor specifies sampling method and the engine executes
 * all applicable rule categories automatically.
 */
@Data
public class StartCaatRunRequest {

    /** STRATIFIED | RANDOM | SYSTEMATIC_MUS */
    @NotBlank(message = "Sampling method is required")
    private String samplingMethod;

    private String auditorNotes;

    /** Optional: override the default CAAT tool name */
    private String caatToolName;
}
