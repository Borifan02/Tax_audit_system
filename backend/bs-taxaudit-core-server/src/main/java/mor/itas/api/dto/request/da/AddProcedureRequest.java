package mor.itas.api.dto.request.da;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class AddProcedureRequest {
    @NotBlank
    private String procedureDescription;
    private String observation;
    private String finding;
    private Boolean issueIdentified;
    private String conclusion;
}
