package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.AmendmentFeedbackDetailDto;
import mor.itas.api.dto.response.ap.AmendedPlanDto;
import mor.itas.api.dto.response.ap.AmendmentResponseDto;
import mor.itas.application.port.inboundport.ap.GetAmendmentFeedbackPort;
import mor.itas.application.port.inboundport.ap.AmendPlanPort;
import mor.itas.application.port.inboundport.ap.ResubmitAmendedPlanPort;
import mor.itas.domain.service.ap.PlanAmendmentService;
import mor.itas.persistence.mapper.ap.PlanAmendmentDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * PlanAmendmentController - REST Controller for Plan Amendment Workflow
 * 
 * Provides endpoints for Planning Team Dashboard:
 * - View Director's amendment request
 * - Edit and amend plan allocations
 * - Resubmit amended plan to Director
 * 
 * Hexagonal/DDD: REST Adapter → Inbound Ports → Use Cases → Domain Services
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap")
@RequiredArgsConstructor
public class PlanAmendmentController {

    private final GetAmendmentFeedbackPort getAmendmentFeedbackPort;
    private final AmendPlanPort amendPlanPort;
    private final ResubmitAmendedPlanPort resubmitAmendedPlanPort;
    private final PlanAmendmentService amendmentService;
    private final PlanAmendmentDtoMapper dtoMapper;

    /**
     * Get amendment request with Director's feedback
     * 
     * Endpoint: GET /api/v1/backoffice/ap/plans/{planId}/amendment-request
     * 
     * Planning Team views Director's amendment request with regional feedback.
     * 
     * @param planId the plan ID
     * @return GenericResponse with amendment feedback details
     */
    @GetMapping("/plans/{planId}/amendment-request")
    public ResponseEntity<GenericResponse<AmendmentFeedbackDetailDto>> getAmendmentRequest(
        @PathVariable String planId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            Map<String, Object> feedbackData = getAmendmentFeedbackPort.getAmendmentFeedback(planUUID);
            
            AmendmentFeedbackDetailDto dto = dtoMapper.toAmendmentFeedbackDetailDto(feedbackData);
            
            return ResponseEntity.ok(GenericResponse.success(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PLAN_NOT_FOUND",
                "Plan not found: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "NO_AMENDMENT_REQUEST",
                "No amendment request for this plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "FEEDBACK_ERROR",
                "Failed to retrieve amendment request: " + e.getMessage()
            ));
        }
    }

    /**
     * Amend plan allocations
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/amend
     * 
     * Planning Team submits amended allocations.
     * 
     * Request Body:
     * {
     *   "amendmentRound": 1,
     *   "plannedChanges": {
     *     "AA": {
     *       "desk_audit": 3800,
     *       "field_audit": 2600,
     *       ...
     *     },
     *     "AB": { ... },
     *     ...
     *   },
     *   "planningTeamComments": "Reduced desk audit in AA due to training gaps, rebalanced to other regions"
     * }
     * 
     * Response: 200 OK
     * {
     *   "success": true,
     *   "data": {
     *     "planId": "plan-uuid",
     *     "message": "Plan amended successfully",
     *     "success": true
     *   }
     * }
     * 
     * @param planId the plan ID
     * @param body contains amendmentRound, plannedChanges, planningTeamComments
     * @return GenericResponse with amendment result
     */
    @PostMapping("/plans/{planId}/amend")
    public ResponseEntity<GenericResponse<AmendmentResponseDto>> amendPlan(
        @PathVariable String planId,
        @RequestBody Map<String, Object> body) {
        
        try {
            Integer amendmentRound = ((Number) body.get("amendmentRound")).intValue();
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Integer>> plannedChanges = 
                (Map<String, Map<String, Integer>>) body.get("plannedChanges");
            
            if (plannedChanges == null || plannedChanges.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_CHANGES",
                    "Planned changes are required"
                ));
            }
            
            String planningTeamComments = (String) body.get("planningTeamComments");
            
            UUID planUUID = UUID.fromString(planId);
            String planningTeamId = "PLANNING_TEAM_001"; // TODO: Get from security context
            
            // Amend the plan
            amendPlanPort.amendPlan(planUUID, amendmentRound, plannedChanges, planningTeamId);
            
            AmendmentResponseDto response = AmendmentResponseDto.builder()
                .planId(planId)
                .amendmentRound(amendmentRound)
                .message("Plan amended successfully")
                .success(true)
                .build();
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PLAN_NOT_FOUND",
                "Plan not found: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_PLAN_STATUS",
                "Cannot amend plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "AMENDMENT_ERROR",
                "Failed to amend plan: " + e.getMessage()
            ));
        }
    }

    /**
     * Resubmit amended plan to Director
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/resubmit-amended
     * 
     * Planning Team resubmits amended plan for Director review.
     * 
     * Request Body:
     * {
     *   "amendmentRound": 1,
     *   "planningTeamComments": "Amended to accommodate regional capacity constraints"
     * }
     * 
     * Response: 200 OK
     * {
     *   "success": true,
     *   "data": {
     *     "planId": "plan-uuid",
     *     "amendmentRound": 1,
     *     "message": "Amended plan resubmitted successfully",
     *     "success": true
     *   }
     * }
     * 
     * @param planId the plan ID
     * @param body contains amendmentRound, planningTeamComments
     * @return GenericResponse with resubmission result
     */
    @PostMapping("/plans/{planId}/resubmit-amended")
    public ResponseEntity<GenericResponse<AmendmentResponseDto>> resubmitAmendedPlan(
        @PathVariable String planId,
        @RequestBody Map<String, Object> body) {
        
        try {
            Integer amendmentRound = ((Number) body.get("amendmentRound")).intValue();
            String planningTeamComments = (String) body.get("planningTeamComments");
            
            UUID planUUID = UUID.fromString(planId);
            String planningTeamId = "PLANNING_TEAM_001"; // TODO: Get from security context
            
            // Resubmit amended plan
            resubmitAmendedPlanPort.resubmitAmendedPlan(
                planUUID,
                amendmentRound,
                planningTeamComments,
                planningTeamId
            );
            
            AmendmentResponseDto response = AmendmentResponseDto.builder()
                .planId(planId)
                .amendmentRound(amendmentRound)
                .message("Amended plan resubmitted successfully to Director")
                .success(true)
                .build();
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PLAN_NOT_FOUND",
                "Plan not found: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_PLAN_STATUS",
                "Cannot resubmit plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "RESUBMISSION_ERROR",
                "Failed to resubmit plan: " + e.getMessage()
            ));
        }
    }
}
