package mor.itas.api.dto.request.ca;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * FR-04.2-10 — Create a working paper document.
 */
@Data
public class CreateWorkingPaperRequest {

    @NotBlank(message = "Title is required")
    private String title;

    /** PLANNING | EVIDENCE | ANALYSIS | FINDINGS | RECONCILIATION */
    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Work performed description is required")
    private String workPerformed;

    private String conclusions;
    private String documentUrl;
}
