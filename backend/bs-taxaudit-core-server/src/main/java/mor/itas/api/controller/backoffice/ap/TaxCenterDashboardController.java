package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.persistence.jpa.repository.ap.PlanAllocationRepository;
import mor.itas.persistence.jpa.entity.ap.PlanAllocationEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * TaxCenterDashboardController - REST Controller for Tax Center Role
 * 
 * Provides endpoints for Tax Center Dashboard:
 * - View allocations sent by regional director
 * - Acknowledge/submit allocation
 * - Provide feedback on allocations
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/tax-center")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class TaxCenterDashboardController {

    private final PlanAllocationRepository allocationRepository;
    private final mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository auditCaseRepository;

    /**
     * Get all plans allocated to a specific tax center
     * 
     * Endpoint: GET /api/v1/backoffice/ap/tax-center/allocations?taxCenterId=AA-TC1
     * 
     * Returns all allocation records for this tax center from the database
     * 
     * @param taxCenterId Tax center ID (e.g., "AA-TC1", "BA-TC2")
     * @return List of allocations with plan details
     */
    @GetMapping("/allocations")
    public ResponseEntity<GenericResponse<List<Map<String, Object>>>> getTaxCenterAllocations(
        @RequestParam String taxCenterId) {
        
        try {
            if (taxCenterId == null || taxCenterId.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_TAX_CENTER_ID",
                    "Tax center ID is required"
                ));
            }

            // Query database for allocations for this tax center across all known code variants
            List<String> tcVariants = CaseManagementController.getTaxCenterVariants(taxCenterId);
            List<PlanAllocationEntity> allocations = new java.util.ArrayList<>();
            for (String variant : tcVariants) {
                allocations.addAll(allocationRepository.findByTaxCenterCode(variant));
            }
            allocations = allocations.stream()
                .collect(Collectors.toMap(PlanAllocationEntity::getId, a -> a, (a1, a2) -> a1))
                .values()
                .stream()
                .collect(Collectors.toList());
            
            // Transform to response DTOs (without lazy-loading the plan)
            List<Map<String, Object>> allocationList = allocations.stream()
                .map(allocation -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("allocationId", allocation.getId().toString());
                    // Avoid lazy loading - just use the ID and basic info
                    if (allocation.getAnnualPlan() != null) {
                        map.put("planId", allocation.getAnnualPlan().getId().toString());
                        map.put("planName", allocation.getAnnualPlan().getName());
                        map.put("planYear", allocation.getAnnualPlan().getYear());
                        map.put("planStatus", allocation.getAnnualPlan().getStatus() != null 
                            ? allocation.getAnnualPlan().getStatus().name() 
                            : "UNKNOWN");
                        int cascadedCases = 0;
                        List<String> allocTcVariants = CaseManagementController.getTaxCenterVariants(allocation.getTaxCenterCode());
                        for (String variant : allocTcVariants) {
                            cascadedCases += auditCaseRepository.countByPlanIdAndTaxCenterCode(
                                allocation.getAnnualPlan().getId(),
                                variant
                            );
                        }
                        map.put("cascaded", cascadedCases > 0);
                        map.put("caseCount", cascadedCases);
                    } else {
                        map.put("cascaded", false);
                        map.put("caseCount", 0);
                    }
                    map.put("taxCenterId", allocation.getTaxCenterCode());
                    map.put("regionCode", allocation.getRegionCode());
                    map.put("proposedCount", allocation.getProposedCount());
                    map.put("acknowledged", allocation.getTcFeedbackSubmitted());
                    map.put("acknowledgedAt", allocation.getTcFeedbackSubmittedAt() != null
                        ? allocation.getTcFeedbackSubmittedAt().toString()
                        : null);
                    map.put("feedback", allocation.getTcJustification() != null
                        ? allocation.getTcJustification()
                        : "");
                    // Return BOTH original allocated AND user's adjusted feedback
                    map.put("allocationsByAuditType", allocation.getAllocationByAuditType());  // Original breakdown
                    map.put("tcAdjustedAllocations", allocation.getTcAdjustedAllocations());   // User's feedback
                    return map;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(GenericResponse.success(
                allocationList,
                allocationList.size(),
                (long) allocationList.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "FETCH_ERROR",
                "Failed to fetch tax center allocations: " + e.getMessage()
            ));
        }
    }

    /**
     * Tax center acknowledges/submits their allocation
     * 
     * Endpoint: POST /api/v1/backoffice/ap/tax-center/allocations/{allocationId}/acknowledge
     * 
     * This endpoint:
     * 1. Marks allocation as acknowledged/submitted
     * 2. Prevents duplicate submissions (idempotent with status check)
     * 3. Records who acknowledged and when
     * 4. Returns success response
     * 
     * @param allocationId Allocation ID
     * @param taxCenterId Tax center ID (from body or header)
     * @param feedback Optional feedback from tax center
     * @param taxCenterStaffId Tax center staff who acknowledged
     * @return Response with acknowledgment status
     */
    @PostMapping("/allocations/{allocationId}/acknowledge")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<GenericResponse<Map<String, Object>>> acknowledgeAllocation(
        @PathVariable String allocationId,
        @RequestBody Map<String, Object> body,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "tax-center-staff") String taxCenterStaffId) {
        
        try {
            // Extract tax center ID and feedback
            String taxCenterId = (String) body.get("taxCenterId");
            String feedback = (String) body.getOrDefault("feedback", "");
            
            // Extract adjusted allocations (per-audit-type)
            @SuppressWarnings("unchecked")
            Map<String, Object> adjustedAllocations = (Map<String, Object>) body.get("adjustedAllocations");
            Integer totalAdjusted = ((Number) body.getOrDefault("totalAdjusted", 0)).intValue();
            Integer originalTotal = ((Number) body.getOrDefault("originalTotal", 0)).intValue();

            if (taxCenterId == null || taxCenterId.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_TAX_CENTER_ID",
                    "Tax center ID is required"
                ));
            }

            // Fetch the allocation
            java.util.UUID allocationUUID = java.util.UUID.fromString(allocationId);
            PlanAllocationEntity allocation = allocationRepository.findById(allocationUUID)
                .orElseThrow(() -> new IllegalArgumentException("Allocation not found: " + allocationId));

            // Verify this allocation is for the requesting tax center (matching all variants)
            List<String> tcVariants = CaseManagementController.getTaxCenterVariants(taxCenterId);
            boolean belongsToTc = tcVariants.stream()
                .anyMatch(v -> v.equalsIgnoreCase(allocation.getTaxCenterCode()));
            if (!belongsToTc) {
                return ResponseEntity.ok(GenericResponse.error(
                    "UNAUTHORIZED",
                    "This allocation does not belong to tax center: " + taxCenterId
                ));
            }

            // CHECK: Has this allocation already been acknowledged?
            if (allocation.getTcFeedbackSubmitted()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "ALREADY_SUBMITTED",
                    "This allocation has already been acknowledged by " + taxCenterId + 
                    " at " + allocation.getTcFeedbackSubmittedAt().toString()
                ));
            }

            // Mark as acknowledged
            allocation.setTcFeedbackSubmitted(true);
            allocation.setTcFeedbackSubmittedAt(OffsetDateTime.now());
            allocation.setTcJustification(feedback);
            
            // Store the per-audit-type adjustments
            if (adjustedAllocations != null && !adjustedAllocations.isEmpty()) {
                com.fasterxml.jackson.databind.JsonNode jsonNode = 
                    com.fasterxml.jackson.databind.node.JsonNodeFactory.instance
                        .pojoNode(adjustedAllocations);
                allocation.setTcAdjustedAllocations(jsonNode);
            }
            
            // Store original and adjusted counts
            allocation.setTcOriginalCount(originalTotal);
            allocation.setTcAdjustedCount(totalAdjusted);
            
            // Store adjustment reason (extract from feedback or create summary)
            String adjustmentReason = "";
            if (originalTotal > 0 && totalAdjusted < originalTotal) {
                adjustmentReason = "Reduced by " + (originalTotal - totalAdjusted) + " cases";
            } else if (originalTotal > 0 && totalAdjusted > originalTotal) {
                adjustmentReason = "Increased by " + (totalAdjusted - originalTotal) + " cases";
            } else {
                adjustmentReason = "No changes from original allocation";
            }
            if (feedback != null && !feedback.isEmpty()) {
                adjustmentReason = adjustmentReason + " - " + feedback.substring(0, Math.min(feedback.length(), 300));
            }
            allocation.setTcAdjustmentReason(adjustmentReason);
            
            allocation.setUpdatedAt(OffsetDateTime.now());

            PlanAllocationEntity saved = allocationRepository.save(allocation);

            // Return success response
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Allocation acknowledged by " + taxCenterId);
            response.put("allocationId", saved.getId().toString());
            response.put("taxCenterId", taxCenterId);
            response.put("planId", saved.getAnnualPlan().getId().toString());
            response.put("acknowledgedAt", saved.getTcFeedbackSubmittedAt().toString());
            response.put("acknowledgedBy", taxCenterStaffId);
            response.put("proposedCount", saved.getProposedCount());
            response.put("adjustedCount", saved.getTcAdjustedCount());
            response.put("adjustedAllocations", adjustedAllocations);
            response.put("feedback", feedback);

            return ResponseEntity.ok(GenericResponse.success(response));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_INPUT",
                "Invalid input: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ACKNOWLEDGMENT_ERROR",
                "Failed to acknowledge allocation: " + e.getMessage()
            ));
        }
    }

    /**
     * Check if allocation has been acknowledged
     * 
     * @param allocationId Allocation ID
     * @return Boolean - true if acknowledged
     */
    @GetMapping("/allocations/{allocationId}/status")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getAllocationStatus(
        @PathVariable String allocationId) {
        
        try {
            java.util.UUID allocationUUID = java.util.UUID.fromString(allocationId);
            PlanAllocationEntity allocation = allocationRepository.findById(allocationUUID)
                .orElseThrow(() -> new IllegalArgumentException("Allocation not found"));

            Map<String, Object> response = Map.of(
                "allocationId", allocation.getId().toString(),
                "acknowledged", allocation.getTcFeedbackSubmitted(),
                "acknowledgedAt", allocation.getTcFeedbackSubmittedAt() != null 
                    ? allocation.getTcFeedbackSubmittedAt().toString() 
                    : null,
                "proposedCount", allocation.getProposedCount(),
                "taxCenterId", allocation.getTaxCenterCode(),
                "regionCode", allocation.getRegionCode(),
                "allocationsByAuditType", allocation.getTcAdjustedAllocations()
            );

            return ResponseEntity.ok(GenericResponse.success(response));
            
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ERROR",
                e.getMessage()
            ));
        }
    }
}
