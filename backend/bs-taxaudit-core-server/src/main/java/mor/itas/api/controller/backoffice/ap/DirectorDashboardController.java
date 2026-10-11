package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.PendingPlanDto;
import mor.itas.api.dto.response.ap.PlanDecisionResponse;
import mor.itas.application.port.inboundport.ap.GetPendingPlansPort;
import mor.itas.application.port.inboundport.ap.ApprovePlanPort;
import mor.itas.application.port.inboundport.ap.RejectPlanPort;
import mor.itas.application.port.inboundport.ap.RequestPlanAmendmentPort;
import mor.itas.application.usecase.ap.ApproveDirectorPlanUseCase;
import mor.itas.application.usecase.ap.SendPlanToRegionsUseCase;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.entity.ap.RegionalFeedbackEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalFeedbackRepository;
import mor.itas.persistence.mapper.ap.DirectorDashboardDtoMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DirectorDashboardController - REST Controller for Director Role
 * 
 * Provides endpoints for Director Dashboard:
 * - View pending plans awaiting review
 * - Approve plans
 * - Reject plans
 * - Request amendments
 * 
 * Hexagonal/DDD: REST Adapter → Inbound Ports → Use Cases → Domain Services
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap")
@RequiredArgsConstructor
public class DirectorDashboardController {

    private final GetPendingPlansPort getPendingPlansPort;
    private final ApprovePlanPort approvePlanPort;
    private final RejectPlanPort rejectPlanPort;
    private final RequestPlanAmendmentPort requestAmendmentPort;
    private final DirectorDashboardDtoMapper dtoMapper;
    private final ApproveDirectorPlanUseCase approveDirectorPlanUseCase;
    private final SendPlanToRegionsUseCase sendPlanToRegionsUseCase;
    private final AnnualAuditPlanJpaRepository planRepository;
    private final RegionalFeedbackRepository regionalFeedbackRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get all plans pending director review
     * 
     * Endpoint: GET /api/v1/backoffice/ap/plans/pending-director-review
     * 
     * Returns a list of plans in SUBMITTED_TO_DIRECTOR status,
     * ready for the director to review and make decisions on.
     * 
     * Includes submission metadata (who submitted, when).
     * 
     * @return GenericResponse wrapping list of PendingPlanDto
     */
    @GetMapping("/plans/pending-director-review")
    public ResponseEntity<GenericResponse<List<PendingPlanDto>>> getPendingPlans() {
        try {
            // Get pending plans directly from JPA repository to include submission metadata
            List<AnnualAuditPlanEntity> entities = planRepository.findByStatus(PlanStatusEnum.SUBMITTED_TO_DIRECTOR);
            
            List<PendingPlanDto> dtos = entities.stream()
                .map(dtoMapper::toPendingPlanDto)  // Use overloaded mapper for entities
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(GenericResponse.success(dtos, dtos.size(), (long) dtos.size()));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PENDING_PLANS_ERROR",
                "Failed to retrieve pending plans: " + e.getMessage()
            ));
        }
    }

    /**
     * Get list of all regions available for plan deployment
     * 
     * Endpoint: GET /api/v1/backoffice/ap/regions
     * 
     * Returns a list of all regions that can receive audit plans.
     * Used by the "Send to Regions" dialog to show available destination regions.
     * 
     * Each region includes:
     * - code: Region code (AA, BA, BB, etc.)
     * - name: Region display name
     * 
     * @return GenericResponse wrapping list of region objects
     */
    @GetMapping("/regions")
    public ResponseEntity<GenericResponse<List<Map<String, String>>>> getRegions() {
        try {
            // Define all regions
            List<Map<String, String>> regions = java.util.Arrays.asList(
                java.util.Map.of("code", "AA", "name", "Addis Ababa"),
                java.util.Map.of("code", "BA", "name", "Amhara"),
                java.util.Map.of("code", "BB", "name", "Oromia"),
                java.util.Map.of("code", "AB", "name", "Dire Dawa"),
                java.util.Map.of("code", "CA", "name", "SNNPR"),
                java.util.Map.of("code", "SO", "name", "Somali")
            );
            
            return ResponseEntity.ok(GenericResponse.success(regions, regions.size(), (long) regions.size()));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "REGIONS_ERROR",
                "Failed to retrieve regions: " + e.getMessage()
            ));
        }
    }

    /**
     * Get all active plans (director approved, awaiting feedback, etc.)
     * 
     * Endpoint: GET /api/v1/backoffice/ap/plans/active-plans
     * 
     * Returns a list of plans that are:
     * - DIRECTOR_APPROVED (approved, ready to send to regions)
     * - AWAITING_REGIONAL_FEEDBACK (sent to regions, waiting for feedback)
     * - FEEDBACK_COLLECTED (feedback ready for director review)
     * 
     * This is used for the "All Active Plans" tab in the director dashboard.
     * 
     * @return GenericResponse wrapping list of PendingPlanDto
     */
    @GetMapping("/plans/active-plans")
    public ResponseEntity<GenericResponse<List<PendingPlanDto>>> getActivePlans() {
        try {
            // Get all active plans from database
            List<AnnualAuditPlanEntity> directorApproved = planRepository.findByStatus(PlanStatusEnum.DIRECTOR_APPROVED);
            List<AnnualAuditPlanEntity> awaitingFeedback = planRepository.findByStatus(PlanStatusEnum.AWAITING_REGIONAL_FEEDBACK);
            List<AnnualAuditPlanEntity> feedbackCollected = planRepository.findByStatus(PlanStatusEnum.FEEDBACK_COLLECTED);
            List<AnnualAuditPlanEntity> submittedToMgmt = planRepository.findByStatus(PlanStatusEnum.SUBMITTED_TO_SENIOR_MGMT);
            List<AnnualAuditPlanEntity> seniorApproved = planRepository.findByStatus(PlanStatusEnum.SENIOR_MGMT_APPROVED);
            List<AnnualAuditPlanEntity> seniorRejected = planRepository.findByStatus(PlanStatusEnum.SENIOR_MGMT_REJECTED);
            List<AnnualAuditPlanEntity> finalized = planRepository.findByStatus(PlanStatusEnum.FINALIZED);
            
            // Combine all active plans
            List<AnnualAuditPlanEntity> allActive = new java.util.ArrayList<>();
            allActive.addAll(directorApproved);
            allActive.addAll(awaitingFeedback);
            allActive.addAll(feedbackCollected);
            allActive.addAll(submittedToMgmt);
            allActive.addAll(seniorApproved);
            allActive.addAll(seniorRejected);
            allActive.addAll(finalized);
            
            // Map to DTOs
            List<PendingPlanDto> dtos = allActive.stream()
                .map(dtoMapper::toPendingPlanDto)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(GenericResponse.success(dtos, dtos.size(), (long) dtos.size()));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ACTIVE_PLANS_ERROR",
                "Failed to retrieve active plans: " + e.getMessage()
            ));
        }
    }

    /**
     * Approve a plan
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/approve
     * 
     * Approves a plan submitted by the planning team.
     * Plan status transitions: SUBMITTED_TO_DIRECTOR → DIRECTOR_APPROVED
     * 
     * ⚠️ IMPORTANT: Plan is NOT yet visible to regions!
     * Regions will only see the plan after director sends it (separate endpoint).
     * 
     * @param planId the plan ID
     * @param body contains: reason (optional approval reason)
     * @return GenericResponse with decision result
     */
    @PostMapping("/plans/{planId}/approve")
    public ResponseEntity<GenericResponse<PlanDecisionResponse>> approvePlan(
        @PathVariable String planId,
        @RequestBody(required = false) java.util.Map<String, String> body) {
        
        try {
            java.util.UUID planUUID = java.util.UUID.fromString(planId);
            String directorId = "DIRECTOR_001"; // TODO: Get from security context
            String reason = body != null ? body.get("reason") : "";
            
            AnnualAuditPlanEntity approvedPlan = approveDirectorPlanUseCase.execute(planUUID, directorId, reason);
            
            boolean isAmended = approvedPlan.getAmendmentComment() != null && !approvedPlan.getAmendmentComment().isEmpty();
            String message = isAmended 
                ? "Amended plan approved and submitted to Senior Management directly (regions already provided feedback)."
                : "Plan approved successfully. Use 'Send to Regions' endpoint to make it visible to regions.";
            
            PlanDecisionResponse response = PlanDecisionResponse.builder()
                .planId(planId)
                .decision("APPROVED")
                .message(message)
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
                "Cannot approve plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "APPROVAL_ERROR",
                "Failed to approve plan: " + e.getMessage()
            ));
        }
    }

    /**
     * Send approved plan to regions for feedback
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/send-to-regions
     * 
     * Sends an approved plan to all regions.
     * Plan status transitions: DIRECTOR_APPROVED → AWAITING_REGIONAL_FEEDBACK
     * 
     * ⚠️ CRITICAL: After this endpoint, plan IS visible to regions!
     * This creates deployment records that grant regional access.
     * Regions can fetch the plan using GET /api/v1/backoffice/ap/plans/for-region/{regionCode}
     * 
     * @param planId the plan ID
     * @param body contains: deploymentNote (optional note for regions)
     * @return GenericResponse with send result
     */
    @PostMapping("/plans/{planId}/send-to-regions")
    public ResponseEntity<GenericResponse<PlanDecisionResponse>> sendPlanToRegions(
        @PathVariable String planId,
        @RequestBody(required = false) java.util.Map<String, String> body) {
        
        try {
            java.util.UUID planUUID = java.util.UUID.fromString(planId);
            String directorId = "DIRECTOR_001"; // TODO: Get from security context
            String deploymentNote = body != null ? body.get("deploymentNote") : "";
            
            AnnualAuditPlanEntity sentPlan = sendPlanToRegionsUseCase.execute(planUUID, directorId, deploymentNote);
            
            PlanDecisionResponse response = PlanDecisionResponse.builder()
                .planId(planId)
                .decision("SENT_TO_REGIONS")
                .message("Plan sent to " + sentPlan.getRegionsReceivedCount() + " regions. Regions can now fetch and work with this plan.")
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
                "Cannot send plan to regions: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "SEND_ERROR",
                "Failed to send plan to regions: " + e.getMessage()
            ));
        }
    }

    /**
     * Reject a plan
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/reject
     * 
     * Rejects a plan submitted by the planning team with a reason.
     * Plan status transitions: SUBMITTED_TO_DIRECTOR → DIRECTOR_REJECTED
     * Plan is sent back to planning team for revision.
     * 
     * @param planId the plan ID
     * @param body contains: reason (string)
     * @return GenericResponse with decision result
     */
    @PostMapping("/plans/{planId}/reject")
    public ResponseEntity<GenericResponse<PlanDecisionResponse>> rejectPlan(
        @PathVariable String planId,
        @RequestBody Map<String, String> body) {
        
        try {
            String reason = body.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_REASON",
                    "Rejection reason is required"
                ));
            }
            
            UUID planUUID = UUID.fromString(planId);
            String directorId = "DIRECTOR_001"; // TODO: Get from security context
            
            rejectPlanPort.rejectPlan(planUUID, reason, directorId);
            
            PlanDecisionResponse response = PlanDecisionResponse.builder()
                .planId(planId)
                .decision("REJECTED")
                .message("Plan rejected. Reason: " + reason)
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
                "Cannot reject plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "REJECTION_ERROR",
                "Failed to reject plan: " + e.getMessage()
            ));
        }
    }

    /**
     * Request amendments to a plan
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/request-amendment
     * 
     * Requests amendments to a plan with detailed feedback.
     * Plan status transitions: SUBMITTED_TO_DIRECTOR → AMENDMENT_REQUIRED
     * Plan is sent back to planning team to address feedback.
     * 
     * Feedback can include:
     * - Regional capacity constraints (from tax center feedback)
     * - Specific areas that need adjustment
     * - Updated targets and strategies
     * 
     * @param planId the plan ID
     * @param body contains: feedback (string) with amendment details
     * @return GenericResponse with decision result
     */
    @PostMapping("/plans/{planId}/request-amendment")
    public ResponseEntity<GenericResponse<PlanDecisionResponse>> requestAmendment(
        @PathVariable String planId,
        @RequestBody Map<String, String> body) {
        
        try {
            String feedback = body.get("feedback");
            if (feedback == null || feedback.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_FEEDBACK",
                    "Amendment feedback is required"
                ));
            }
            
            UUID planUUID = UUID.fromString(planId);
            String directorId = "DIRECTOR_001"; // TODO: Get from security context
            
            requestAmendmentPort.requestAmendment(planUUID, feedback, directorId);
            
            PlanDecisionResponse response = PlanDecisionResponse.builder()
                .planId(planId)
                .decision("AMENDMENT_REQUESTED")
                .message("Amendment feedback sent to planning team")
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
                "Cannot request amendment: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "AMENDMENT_REQUEST_ERROR",
                "Failed to request amendment: " + e.getMessage()
            ));
        }
    }

    /**
     * Get aggregated regional feedback for a plan (Director view)
     * 
     * Endpoint: GET /api/v1/backoffice/ap/plans/{planId}/regional-feedback-aggregated
     * 
     * Director views all regional feedback aggregated into one view.
     * Shows each region's feedback by audit type with gap analysis.
     * This is used by the director to understand capacity constraints
     * and decide whether to request amendments.
     * 
     * @param planId the plan ID
     * @return GenericResponse with aggregated feedback from all regions
     */
    @GetMapping("/plans/{planId}/regional-feedback-aggregated")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getRegionalFeedbackAggregated(
        @PathVariable String planId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            
            // Verify plan exists
            AnnualAuditPlanEntity plan = planRepository.findById(planUUID)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
            
            // Get all regional feedback for this plan
            List<RegionalFeedbackEntity> allFeedback = regionalFeedbackRepository.findByPlanId(planUUID);
            
            if (allFeedback.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "NO_FEEDBACK",
                    "No regional feedback has been submitted for this plan yet"
                ));
            }
            
            // Build aggregated response
            java.util.Map<String, Object> aggregatedResponse = new java.util.LinkedHashMap<>();
            aggregatedResponse.put("planId", planId);
            aggregatedResponse.put("planName", plan.getName());
            aggregatedResponse.put("planYear", plan.getYear());
            aggregatedResponse.put("planStatus", plan.getStatus().toString());
            aggregatedResponse.put("totalRegionsResponded", allFeedback.size());
            
            // Process each region's feedback
            java.util.Map<String, Object> regionSummaries = new java.util.LinkedHashMap<>();
            java.util.Map<String, Object> auditTypeTotals = new java.util.LinkedHashMap<>();
            
            for (RegionalFeedbackEntity feedback : allFeedback) {
                String regionId = feedback.getRegionId();
                
                // Parse the feedback JSON
                java.util.Map<String, Object> regionFeedback = new java.util.HashMap<>();
                try {
                    regionFeedback = objectMapper.readValue(feedback.getFeedbackText(), 
                        objectMapper.getTypeFactory().constructMapType(java.util.Map.class, String.class, Object.class));
                } catch (Exception e) {
                    regionFeedback.put("parseError", e.getMessage());
                }
                
                // Build region summary
                java.util.Map<String, Object> regionSummary = new java.util.LinkedHashMap<>();
                regionSummary.put("regionId", regionId);
                regionSummary.put("regionName", getRegionName(regionId));
                regionSummary.put("submittedBy", feedback.getSubmittedBy());
                regionSummary.put("submittedAt", feedback.getSubmittedAt() != null ? feedback.getSubmittedAt().toString() : null);
                regionSummary.put("feedback", regionFeedback);
                
                // Calculate totals for this region
                long totalRequested = 0L;
                long totalCapacity = 0L;
                
                for (Object auditTypeObj : regionFeedback.values()) {
                    if (auditTypeObj instanceof java.util.Map) {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> auditTypeData = (java.util.Map<String, Object>) auditTypeObj;
                        
                        if (auditTypeData.containsKey("totalRequested")) {
                            Object tr = auditTypeData.get("totalRequested");
                            if (tr instanceof Number) totalRequested += ((Number) tr).longValue();
                        }
                        if (auditTypeData.containsKey("totalCapacity")) {
                            Object tc = auditTypeData.get("totalCapacity");
                            if (tc instanceof Number) totalCapacity += ((Number) tc).longValue();
                        }
                    }
                }
                
                regionSummary.put("totalRequested", totalRequested);
                regionSummary.put("totalCapacity", totalCapacity);
                regionSummary.put("totalGap", totalCapacity - totalRequested);
                regionSummary.put("gapPercentage", totalRequested > 0 ? 
                    String.format("%.1f%%", (double)(totalRequested - totalCapacity) / totalRequested * 100) : "0.0%");
                
                regionSummaries.put(regionId, regionSummary);
            }
            
            aggregatedResponse.put("regions", regionSummaries);
            
            // Calculate grand totals across all regions
            long grandTotalRequested = 0L;
            long grandTotalCapacity = 0L;
            
            for (Object regionObj : regionSummaries.values()) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> regionData = (java.util.Map<String, Object>) regionObj;
                grandTotalRequested += (long) regionData.get("totalRequested");
                grandTotalCapacity += (long) regionData.get("totalCapacity");
            }
            
            aggregatedResponse.put("grandTotalRequested", grandTotalRequested);
            aggregatedResponse.put("grandTotalCapacity", grandTotalCapacity);
            aggregatedResponse.put("grandTotalGap", grandTotalCapacity - grandTotalRequested);
            aggregatedResponse.put("grandGapPercentage", grandTotalRequested > 0 ? 
                String.format("%.1f%%", (double)(grandTotalRequested - grandTotalCapacity) / grandTotalRequested * 100) : "0.0%");
            
            aggregatedResponse.put("directorNote", 
                "Use this aggregated feedback to decide whether amendments are needed. " +
                "If gaps are significant, request amendments from the planning team.");
            
            return ResponseEntity.ok(GenericResponse.success(aggregatedResponse));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PLAN_NOT_FOUND",
                "Plan not found: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "AGGREGATION_ERROR",
                "Failed to aggregate regional feedback: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Helper: Get region name from code
     */
    private String getRegionName(String regionId) {
        return switch (regionId) {
            case "AA" -> "Addis Ababa";
            case "BA" -> "Amhara";
            case "BB" -> "Oromia";
            case "AB" -> "Dire Dawa";
            case "CA" -> "SNNPR";
            case "SO" -> "Somali";
            default -> "Region " + regionId;
        };
    }
}
