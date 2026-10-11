package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.TaxCenterAllocationDto;
import mor.itas.api.dto.response.ap.FeedbackSubmissionResponseDto;
import mor.itas.application.port.inboundport.ap.GetTaxCenterAllocationPort;
import mor.itas.application.port.inboundport.ap.SubmitTaxCenterFeedbackPort;
import mor.itas.domain.model.ap.RegionalAllocationDetail;
import mor.itas.persistence.mapper.ap.TaxCenterFeedbackDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * TaxCenterFeedbackController - REST Controller for Tax Center Feedback
 * 
 * Provides endpoints for Tax Center Manager Dashboard:
 * - View their allocation from Regional Director
 * - Submit capacity feedback with justification
 * 
 * Hexagonal/DDD: REST Adapter → Inbound Ports → Use Cases → Domain Services
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap")
@RequiredArgsConstructor
public class TaxCenterFeedbackController {

    private final GetTaxCenterAllocationPort getTaxCenterAllocationPort;
    private final SubmitTaxCenterFeedbackPort submitFeedbackPort;
    private final TaxCenterFeedbackDtoMapper dtoMapper;

    /**
     * Get tax center's allocation from Regional Director
     * 
     * Endpoint: GET /api/v1/backoffice/ap/plans/{planId}/my-allocation
     * 
     * Tax Center views their allocation before submitting feedback.
     * Shows breakdown by audit type (desk: 1000, field: 800, etc.).
     * 
     * @param planId the plan ID
     * @param taxCenterId the tax center ID (from query param or auth context)
     * @return GenericResponse wrapping TaxCenterAllocationDto
     */
    @GetMapping("/plans/{planId}/my-allocation")
    public ResponseEntity<GenericResponse<TaxCenterAllocationDto>> getMyAllocation(
        @PathVariable String planId,
        @RequestParam String taxCenterId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            RegionalAllocationDetail detail = getTaxCenterAllocationPort
                .getTaxCenterAllocation(planUUID, taxCenterId);
            
            TaxCenterAllocationDto dto = dtoMapper.toTaxCenterAllocationDto(detail);
            dto.setTaxCenterId(taxCenterId);
            
            return ResponseEntity.ok(GenericResponse.success(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PLAN_NOT_FOUND",
                "Plan or tax center not found: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_PLAN_STATUS",
                "Cannot get allocation: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ALLOCATION_ERROR",
                "Failed to retrieve allocation: " + e.getMessage()
            ));
        }
    }

    /**
     * Submit tax center feedback on their allocation capacity
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/submit-feedback
     * 
     * Tax Center submits feedback indicating what they can actually do.
     * 
     * Request Body:
     * {
     *   "taxCenterId": "TC-AA-01",
     *   "regionId": "AA",
     *   "feedbackByAuditType": {
     *     "desk_audit": {
     *       "requested": 1000,
     *       "accepted": 830,
     *       "justification": "Limited auditors with experience in complex cases"
     *     },
     *     "field_audit": {
     *       "requested": 800,
     *       "accepted": 720,
     *       "justification": "Transport budget constraints, seasonal limitations"
     *     },
     *     ...
     *   }
     * }
     * 
     * Response: 200 OK
     * {
     *   "success": true,
     *   "data": {
     *     "planId": "plan-uuid",
     *     "taxCenterId": "TC-AA-01",
     *     "message": "Feedback submitted successfully",
     *     "success": true
     *   }
     * }
     * 
     * @param planId the plan ID
     * @param body contains taxCenterId, regionId, feedbackByAuditType
     * @return GenericResponse with submission result
     */
    @PostMapping("/plans/{planId}/submit-feedback")
    public ResponseEntity<GenericResponse<FeedbackSubmissionResponseDto>> submitFeedback(
        @PathVariable String planId,
        @RequestBody Map<String, Object> body) {
        
        try {
            String taxCenterId = (String) body.get("taxCenterId");
            if (taxCenterId == null || taxCenterId.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_TAX_CENTER",
                    "Tax Center ID is required"
                ));
            }
            
            String regionId = (String) body.get("regionId");
            if (regionId == null || regionId.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_REGION",
                    "Region ID is required"
                ));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Object>> feedbackByAuditType =
                (Map<String, Map<String, Object>>) body.get("feedbackByAuditType");
            
            if (feedbackByAuditType == null || feedbackByAuditType.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_FEEDBACK",
                    "Feedback by audit type is required"
                ));
            }
            
            UUID planUUID = UUID.fromString(planId);
            String submittedBy = "TAX_CENTER_MANAGER_" + taxCenterId; // TODO: Get from security context
            
            submitFeedbackPort.submitFeedback(
                planUUID,
                taxCenterId,
                regionId,
                feedbackByAuditType,
                submittedBy
            );
            
            FeedbackSubmissionResponseDto response = FeedbackSubmissionResponseDto.builder()
                .planId(planId)
                .taxCenterId(taxCenterId)
                .message("Feedback submitted successfully")
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
                "Cannot submit feedback: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "FEEDBACK_ERROR",
                "Failed to submit feedback: " + e.getMessage()
            ));
        }
    }
}
