package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.RegionalFeedbackAggregateDto;
import mor.itas.api.dto.response.ap.RegionalFeedbackSubmissionResponseDto;
import mor.itas.application.port.inboundport.ap.GetTaxCenterFeedbackPort;
import mor.itas.application.port.inboundport.ap.SubmitRegionalFeedbackPort;
import mor.itas.domain.service.ap.RegionalFeedbackAggregationService;
import mor.itas.persistence.mapper.ap.RegionalFeedbackAggregationDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * RegionalFeedbackAggregationController - REST Controller for Regional Feedback Aggregation
 * 
 * Provides endpoints for Regional Director Dashboard:
 * - View all tax center feedback for their region
 * - Aggregate feedback and submit to Director
 * 
 * Hexagonal/DDD: REST Adapter → Inbound Ports → Use Cases → Domain Services
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap")
@RequiredArgsConstructor
public class RegionalFeedbackAggregationController {

    private final GetTaxCenterFeedbackPort getTaxCenterFeedbackPort;
    private final SubmitRegionalFeedbackPort submitRegionalFeedbackPort;
    private final RegionalFeedbackAggregationService aggregationService;
    private final RegionalFeedbackAggregationDtoMapper dtoMapper;

    /**
     * Get all tax center feedback for a region
     * 
     * Endpoint: GET /api/v1/backoffice/ap/regions/{regionId}/tax-center-feedback?planId={planId}
     * 
     * Regional Director views all tax center feedback before aggregating.
     * Shows detailed feedback from each tax center (requested vs capacity by audit type).
     * 
     * @param planId the plan ID (query param)
     * @param regionId the region ID
     * @return GenericResponse with list of tax center feedback
     */
    @GetMapping("/regions/{regionId}/tax-center-feedback")
    public ResponseEntity<GenericResponse<Object>> getTaxCenterFeedback(
        @RequestParam String planId,
        @PathVariable String regionId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            List<Map<String, Object>> feedbackList = getTaxCenterFeedbackPort
                .getTaxCenterFeedback(planUUID, regionId);
            
            // Return list of feedback
            Map<String, Object> response = Map.of(
                "regionId", regionId,
                "regionName", getRegionName(regionId),
                "taxCenterFeedbackCount", feedbackList.size(),
                "taxCenterFeedback", feedbackList
            );
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PLAN_NOT_FOUND",
                "Plan not found: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_PLAN_STATUS",
                "Cannot get feedback: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "FEEDBACK_ERROR",
                "Failed to retrieve feedback: " + e.getMessage()
            ));
        }
    }

    /**
     * Submit aggregated regional feedback to Director
     * 
     * Endpoint: POST /api/v1/backoffice/ap/regions/{regionId}/submit-feedback
     * 
     * Regional Director aggregates all tax center feedback and submits to Director.
     * 
     * Request Body:
     * {
     *   "planId": "plan-uuid",
     *   "aggregatedFeedback": {
     *     "desk_audit": {
     *       "totalRequested": 4200,
     *       "totalCapacity": 3800,
     *       "totalGap": -400,
     *       "gapPercentage": 9.5,
     *       "taxCenterFeedbacks": [
     *         {"taxCenterId": "TC-AA-01", "requested": 1000, "accepted": 830, ...},
     *         {"taxCenterId": "TC-AA-02", "requested": 1200, "accepted": 1100, ...},
     *         ...
     *       ]
     *     },
     *     ...
     *   },
     *   "capacityOverrides": {
     *     "desk_audit": 30050,
     *     "joint_audit": 12900,
     *     ...
     *   },
     *   "regionalAnalysis": "Limited budgets, training gaps, seasonal constraints"
     * }
     * 
     * Response: 200 OK
     * {
     *   "success": true,
     *   "data": {
     *     "planId": "plan-uuid",
     *     "regionId": "AA",
     *     "message": "Regional feedback submitted successfully",
     *     "success": true
     *   }
     * }
     * 
     * @param regionId the region ID
     * @param body contains planId, aggregatedFeedback, capacityOverrides, regionalAnalysis
     * @return GenericResponse with submission result
     */
    @PostMapping("/regions/{regionId}/submit-feedback")
    public ResponseEntity<GenericResponse<RegionalFeedbackSubmissionResponseDto>> submitRegionalFeedback(
        @PathVariable String regionId,
        @RequestBody Map<String, Object> body) {
        
        try {
            String planIdStr = (String) body.get("planId");
            if (planIdStr == null || planIdStr.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_PLAN",
                    "Plan ID is required"
                ));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Object>> aggregatedFeedback = 
                (Map<String, Map<String, Object>>) body.get("aggregatedFeedback");
            
            if (aggregatedFeedback == null || aggregatedFeedback.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_FEEDBACK",
                    "Aggregated feedback is required"
                ));
            }
            
            // NEW: Get capacity overrides from regional director
            @SuppressWarnings("unchecked")
            Map<String, Integer> capacityOverrides = 
                (Map<String, Integer>) body.get("capacityOverrides");
            
            // If overrides provided, merge them into aggregatedFeedback
            if (capacityOverrides != null && !capacityOverrides.isEmpty()) {
                capacityOverrides.forEach((auditType, overrideValue) -> {
                    if (aggregatedFeedback.containsKey(auditType)) {
                        Map<String, Object> feedback = aggregatedFeedback.get(auditType);
                        feedback.put("regionalOverride", overrideValue);
                        feedback.put("isRegionallyAdjusted", true);
                        System.out.println("✅ Capacity override for " + auditType + ": " + overrideValue);
                    }
                });
            }
            
            String regionalAnalysis = (String) body.get("regionalAnalysis");
            if (regionalAnalysis == null || regionalAnalysis.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_ANALYSIS",
                    "Regional analysis is required"
                ));
            }
            
            UUID planUUID = UUID.fromString(planIdStr);
            String regionalDirectorId = "REGIONAL_DIRECTOR_" + regionId; // TODO: Get from security context
            
            // Submit aggregated feedback with overrides
            submitRegionalFeedbackPort.submitAggregatedFeedback(
                planUUID,
                regionId,
                aggregatedFeedback,
                regionalDirectorId
            );
            
            RegionalFeedbackSubmissionResponseDto response = RegionalFeedbackSubmissionResponseDto.builder()
                .planId(planIdStr)
                .regionId(regionId)
                .message("Regional feedback submitted successfully")
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
                "SUBMISSION_ERROR",
                "Failed to submit feedback: " + e.getMessage()
            ));
        }
    }

    /**
     * Helper method: Get region name from code
     */
    private String getRegionName(String regionId) {
        return switch (regionId) {
            case "AA" -> "Addis Ababa";
            case "AB" -> "Oromia";
            case "BA" -> "Amhara";
            case "BB" -> "SNNP";
            case "CA" -> "Tigray";
            case "SO" -> "Somali";
            default -> "Region " + regionId;
        };
    }
}
