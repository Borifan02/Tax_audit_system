package mor.itas.api.dto.request.da;

import lombok.Data;

@Data
public class UpdateProcedureRequest {
    private String procedureDescription;
    private String observation;
    private String finding;
    private Boolean issueIdentified;
    private String conclusion;
}
