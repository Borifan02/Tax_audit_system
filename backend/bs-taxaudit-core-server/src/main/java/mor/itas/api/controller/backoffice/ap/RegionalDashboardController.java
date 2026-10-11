package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.application.usecase.ap.GetPlansForRegionUseCase;
import mor.itas.application.usecase.ap.DistributePlanToTaxCentersUseCase;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * RegionalDashboardController - REST Controller for Regional Director Role
 * 
 * Provides endpoints for Regional Dashboard:
 * - Fetch plans sent by director (with region-specific allocations)
 * - Calculate default distributions to tax centers (equal distribution per audit type)
 * - Distribute plans to tax centers with allocations (defaults or custom overrides)
 * - Provide feedback on regional allocations
 * 
 * ⚠️ CRITICAL ACCESS CONTROL:
 * Regions can ONLY see plans that have been explicitly sent to them by the director.
 * A plan is only visible if:
 * 1. Director has approved it (DIRECTOR_APPROVED status)
 * 2. Director has sent it to this specific region (regional deployment record exists)
 * 3. The regional access record is active (not expired)
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/regional")
@RequiredArgsConstructor
public class RegionalDashboardController {

    private final GetPlansForRegionUseCase getPlansForRegionUseCase;
    private final DistributePlanToTaxCentersUseCase distributePlanToTaxCentersUseCase;
    private final AnnualAuditPlanJpaRepository planRepository;

    /**
     * Get all plans sent to this region by director
     */
    @GetMapping("/plans")
    public ResponseEntity<GenericResponse<List<Map<String, Object>>>> getPlansForRegion(
        @RequestParam String regionCode) {
        
        try {
            if (regionCode == null || regionCode.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_REGION_CODE",
                    "Region code is required"
                ));
            }

            List<Map<String, Object>> plans = getPlansForRegionUseCase.execute(regionCode);
            
            return ResponseEntity.ok(GenericResponse.success(
                plans,
                plans.size(),
                (long) plans.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "FETCH_ERROR",
                "Failed to fetch regional plans: " + e.getMessage()
            ));
        }
    }

    /**
     * Check if region has access to a specific plan
     */
    @GetMapping("/plans/{planId}/access")
    public ResponseEntity<GenericResponse<Boolean>> checkAccess(
        @PathVariable String planId,
        @RequestParam String regionCode) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            boolean hasAccess = getPlansForRegionUseCase.hasAccess(regionCode, planUUID);
            
            return ResponseEntity.ok(GenericResponse.success(hasAccess));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_PLAN_ID",
                "Invalid plan ID: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ACCESS_CHECK_ERROR",
                "Failed to check access: " + e.getMessage()
            ));
        }
    }

    /**
     * Get default distribution suggestions for a plan being distributed to tax centers
     * 
     * Endpoint: GET /api/v1/backoffice/ap/regional/plans/{planId}/distribution-defaults?regionCode=AA
     * 
     * Backend calculates equal distribution by audit type across tax centers.
     * Regional Director can use these defaults or override individually.
     */
    @GetMapping("/plans/{planId}/distribution-defaults")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getDistributionDefaults(
        @PathVariable String planId,
        @RequestParam String regionCode) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            
            // Fetch the plan
            AnnualAuditPlanEntity plan = planRepository.findById(planUUID)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
            
            // Get regional allocation from plan's distribution map
            Map<String, Integer> regionAllocation = null;
            if (plan.getDistribution() != null) {
                regionAllocation = plan.getDistribution().get(regionCode);
                if (regionAllocation == null || regionAllocation.isEmpty()) {
                    Map<String, String> codeToKey = Map.of(
                        "FED", "federal_level", "AA", "addis_ababa", "BA", "amhara",
                        "BB", "oromia", "AB", "dire_dawa", "CA", "snnpr", "SO", "somali"
                    );
                    String mappedKey = codeToKey.getOrDefault(regionCode, regionCode.toLowerCase());
                    regionAllocation = plan.getDistribution().get(mappedKey);
                }
            }
            
            if (regionAllocation == null || regionAllocation.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "NO_REGIONAL_ALLOCATION",
                    "No allocation found for region: " + regionCode
                ));
            }
            
            // Get tax centers for this region
            List<String> taxCenterIds = getTaxCentersForRegion(regionCode);
            
            // Calculate defaults using backend service
            Map<String, Map<String, Integer>> defaults = 
                distributePlanToTaxCentersUseCase.calculateDefaultDistribution(
                    regionAllocation,
                    taxCenterIds
                );
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("regionCode", regionCode);
            response.put("regionAllocation", regionAllocation);
            response.put("taxCenters", taxCenterIds);
            response.put("defaultDistribution", defaults);
            response.put("message", "System calculated equal distribution by audit type. Regional Director can override individual values if needed.");
            
            return ResponseEntity.ok(GenericResponse.success(response));
            
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ERROR",
                "Failed to calculate defaults: " + e.getMessage()
            ));
        }
    }

    /**
     * Regional director distributes plan to tax centers with specific allocations
     * 
     * Endpoint: POST /api/v1/backoffice/ap/regional/plans/{planId}/distribute-to-tax-centers
     * 
     * Can use defaults from /distribution-defaults or provide custom overrides.
     */
    @PostMapping("/plans/{planId}/distribute-to-tax-centers")
    public ResponseEntity<GenericResponse<Map<String, Object>>> distributePlanToTaxCenters(
        @PathVariable String planId,
        @RequestParam String regionCode,
        @RequestBody Map<String, Object> body,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "regional-director") String regionalDirectorId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            
            // Extract tax center allocations from request body
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Integer>> taxCenterAllocations = 
                (Map<String, Map<String, Integer>>) body.get("taxCenterAllocations");
            
            if (taxCenterAllocations == null || taxCenterAllocations.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_ALLOCATIONS",
                    "Tax center allocations are required"
                ));
            }

            // Execute the distribution
            AnnualAuditPlanEntity plan = distributePlanToTaxCentersUseCase.execute(
                planUUID,
                regionCode,
                taxCenterAllocations,
                regionalDirectorId
            );

            // Return success response with updated plan metadata
            Map<String, Object> response = Map.of(
                "status", "SUCCESS",
                "message", "Plan distributed to " + taxCenterAllocations.size() + " tax centers",
                "planId", plan.getId().toString(),
                "regionCode", regionCode,
                "deployedAt", plan.getUpdatedAt().toString(),
                "taxCentersCount", taxCenterAllocations.size()
            );

            return ResponseEntity.ok(GenericResponse.success(response));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_INPUT",
                "Invalid input: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_STATE",
                "Cannot distribute plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "DISTRIBUTION_ERROR",
                "Failed to distribute plan to tax centers: " + e.getMessage()
            ));
        }
    }

    /**
     * Helper: Get tax centers for a region
     * Frontend region IDs map to tax center lists
     */
    private List<String> getTaxCentersForRegion(String regionId) {
        Map<String, List<String>> regionTaxCenters = new java.util.HashMap<>();
        
        // Frontend region IDs (from constants.js)
        regionTaxCenters.put("federal_level", java.util.Arrays.asList("federal-lto1", "federal-lto2"));
        regionTaxCenters.put("fed", java.util.Arrays.asList("federal-lto1", "federal-lto2"));
        regionTaxCenters.put("addis_ababa", java.util.Arrays.asList("AA-TC1", "AA-TC2", "AA-TC3"));
        regionTaxCenters.put("amhara", java.util.Arrays.asList("BA-TC1", "BA-TC2", "BA-TC3"));
        regionTaxCenters.put("oromia", java.util.Arrays.asList("BB-TC1", "BB-TC2", "BB-TC3"));
        regionTaxCenters.put("dire_dawa", java.util.Arrays.asList("AB-TC1", "AB-TC2"));
        regionTaxCenters.put("snnpr", java.util.Arrays.asList("CA-TC1", "CA-TC2"));
        regionTaxCenters.put("somali", java.util.Arrays.asList("SO-TC1", "SO-TC2"));
        
        // Also support region codes (for API consistency)
        regionTaxCenters.put("FED", java.util.Arrays.asList("federal-lto1", "federal-lto2"));
        regionTaxCenters.put("AA", java.util.Arrays.asList("AA-TC1", "AA-TC2", "AA-TC3"));
        regionTaxCenters.put("BA", java.util.Arrays.asList("BA-TC1", "BA-TC2", "BA-TC3"));
        regionTaxCenters.put("BB", java.util.Arrays.asList("BB-TC1", "BB-TC2", "BB-TC3"));
        regionTaxCenters.put("AB", java.util.Arrays.asList("AB-TC1", "AB-TC2"));
        regionTaxCenters.put("CA", java.util.Arrays.asList("CA-TC1", "CA-TC2"));
        regionTaxCenters.put("SO", java.util.Arrays.asList("SO-TC1", "SO-TC2"));
        
        return regionTaxCenters.getOrDefault(regionId, java.util.Collections.emptyList());
    }
}
