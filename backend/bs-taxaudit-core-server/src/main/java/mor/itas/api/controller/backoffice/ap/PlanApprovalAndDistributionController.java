package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.ManagementApprovalDto;
import mor.itas.api.dto.response.ap.PlanDistributionDto;
import mor.itas.application.port.inboundport.ap.SubmitToSeniorManagementPort;
import mor.itas.application.port.inboundport.ap.ReviewAndApproveByManagementPort;
import mor.itas.application.port.inboundport.ap.DistributeApprovedPlanPort;
import mor.itas.application.usecase.ap.DistributeApprovedPlanUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * PlanApprovalAndDistributionController - REST Controller for Final Approval & Distribution
 * 
 * Provides endpoints for complete approval chain:
 * 1. Director submits to Senior Management
 * 2. Senior Management approves/rejects
 * 3. Approved plan distributed to all regions
 * 4. Regional Directors distribute to tax centers
 * 
 * Hexagonal/DDD: REST Adapter → Inbound Ports → Use Cases → Domain Services
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap")
@RequiredArgsConstructor
public class PlanApprovalAndDistributionController {

    private final SubmitToSeniorManagementPort submitToSeniorManagementPort;
    private final ReviewAndApproveByManagementPort reviewAndApprovePort;
    private final DistributeApprovedPlanPort distributeApprovedPlanPort;

    /**
     * Director submits amended plan to Senior Management
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/submit-to-management
     * 
     * @param planId the plan ID
     * @param body contains directorComment
     * @return GenericResponse with submission result
     */
    @PostMapping("/plans/{planId}/submit-to-management")
    public ResponseEntity<GenericResponse<ManagementApprovalDto>> submitToManagement(
        @PathVariable String planId,
        @RequestBody Map<String, Object> body) {
        
        try {
            String directorComment = (String) body.get("directorComment");
            
            UUID planUUID = UUID.fromString(planId);
            String directorId = "DIRECTOR_001"; // TODO: Get from security context
            
            submitToSeniorManagementPort.submitToSeniorManagement(planUUID, directorId, directorComment);
            
            ManagementApprovalDto response = ManagementApprovalDto.builder()
                .planId(planId)
                .message("Plan submitted to Senior Management for final approval")
                .success(true)
                .build();
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "SUBMISSION_ERROR",
                "Failed to submit to management: " + e.getMessage()
            ));
        }
    }

    /**
     * Senior Management reviews and approves/rejects plan
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/management-decision
     * 
     * @param planId the plan ID
     * @param body contains decision (APPROVE/REJECT) and managementComment
     * @return GenericResponse with decision result
     */
    @PostMapping("/plans/{planId}/management-decision")
    public ResponseEntity<GenericResponse<ManagementApprovalDto>> managementDecision(
        @PathVariable String planId,
        @RequestBody Map<String, Object> body) {
        
        try {
            String decision = (String) body.get("decision");
            String managementComment = (String) body.get("managementComment");
            
            if (decision == null || (!decision.equalsIgnoreCase("APPROVE") && !decision.equalsIgnoreCase("REJECT"))) {
                return ResponseEntity.ok(GenericResponse.error(
                    "INVALID_DECISION",
                    "Decision must be APPROVE or REJECT"
                ));
            }
            
            UUID planUUID = UUID.fromString(planId);
            String managementId = "MANAGEMENT_001"; // TODO: Get from security context
            
            reviewAndApprovePort.reviewAndApprove(planUUID, decision, managementId, managementComment);
            
            String message = decision.equalsIgnoreCase("APPROVE") ?
                "Plan APPROVED by Senior Management. Ready for distribution to regions." :
                "Plan REJECTED by Senior Management. Sent back for re-amendment.";
            
            ManagementApprovalDto response = ManagementApprovalDto.builder()
                .planId(planId)
                .decision(decision.toUpperCase())
                .managementComment(managementComment)
                .message(message)
                .success(true)
                .build();
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "DECISION_ERROR",
                "Failed to process management decision: " + e.getMessage()
            ));
        }
    }

    /**
     * Distribute approved plan to regional directors
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/distribute
     * 
     * Director sends finally approved plan to all regional directors.
     * Each region receives their allocation to distribute to tax centers.
     * 
     * @param planId the plan ID
     * @return GenericResponse with distribution result
     */
    @PostMapping("/plans/{planId}/distribute")
    public ResponseEntity<GenericResponse<PlanDistributionDto>> distributePlan(
        @PathVariable String planId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            String directorId = "DIRECTOR_001"; // TODO: Get from security context
            
            distributeApprovedPlanPort.distributeToRegions(planUUID, directorId);
            
            PlanDistributionDto response = PlanDistributionDto.builder()
                .planId(planId)
                .status("DISTRIBUTED_TO_REGIONS")
                .message("Approved plan distributed to all regional directors. " +
                         "Each region can now distribute to their tax centers.")
                .success(true)
                .build();
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "DISTRIBUTION_ERROR",
                "Failed to distribute plan: " + e.getMessage()
            ));
        }
    }

    /**
     * Regional Director distributes approved plan to tax centers
     * 
     * Endpoint: POST /api/v1/backoffice/ap/regions/{regionId}/distribute-to-tax-centers
     * 
     * @param planId the plan ID (query param)
     * @param regionId the region ID
     * @return GenericResponse with distribution result
     */
    @PostMapping("/regions/{regionId}/distribute-to-tax-centers")
    public ResponseEntity<GenericResponse<PlanDistributionDto>> distributeTaxCenters(
        @RequestParam String planId,
        @PathVariable String regionId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            String regionalDirectorId = "REGIONAL_DIRECTOR_" + regionId;
            
            Map<String, Object> distribution = 
                DistributeApprovedPlanUseCase.distributeToTaxCenters(planUUID, regionId, regionalDirectorId);
            
            PlanDistributionDto response = PlanDistributionDto.builder()
                .planId(planId)
                .status((String) distribution.get("status"))
                .message((String) distribution.get("message"))
                .regionalAllocations(Map.of(
                    "region", regionId,
                    "taxCentersNotified", distribution.get("taxCentersNotified")
                ))
                .success(true)
                .build();
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "DISTRIBUTION_ERROR",
                "Failed to distribute to tax centers: " + e.getMessage()
            ));
        }
    }
}
