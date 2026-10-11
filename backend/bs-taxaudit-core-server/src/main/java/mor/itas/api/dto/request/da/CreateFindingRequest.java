package mor.itas.api.dto.request.da;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class CreateFindingRequest {
    @NotBlank
    private String reference;
    @NotBlank
    private String auditArea;
    @NotBlank
    private String title;
    private String description;
    private String criteria;
    private String condition;
    private String cause;
    private String effect;
    private Double underDeclaredAmount;
    private Double penaltyRate;
    private Double penaltyAmount;
    private Double interestAmount;
    private Double totalTaxImpact;
    private String auditorAnalysis;
    private String conclusion;
    private String recommendation;
    private String status;
    private Boolean isSignificant;
    private String relatedProcedureId;
    private String relatedQueryId;
    private String relatedWorkingPaperId;
    private List<String> relatedEvidenceIds;
}
