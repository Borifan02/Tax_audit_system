package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.RegionalAllocationDto;
import mor.itas.api.dto.response.ap.AllocationResponseDto;
import mor.itas.application.port.inboundport.ap.GetRegionalAllocationPort;
import mor.itas.application.port.inboundport.ap.AllocateToTaxCentersPort;
import mor.itas.application.port.inboundport.ap.UpdateAllocationPort;
import mor.itas.domain.model.ap.RegionalAllocationDetail;
import mor.itas.persistence.mapper.ap.RegionalAllocationDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * RegionalAllocationController - REST Controller for Regional Allocation
 * 
 * Provides endpoints for Regional Director Dashboard:
 * - View pending plan allocations
 * - Allocate plans to tax centers
 * - Update tax center allocations
 * 
 * Hexagonal/DDD: REST Adapter → Inbound Ports → Use Cases → Domain Services
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap")
@RequiredArgsConstructor
public class RegionalAllocationController {

    private final GetRegionalAllocationPort getRegionalAllocationPort;
    private final AllocateToTaxCentersPort allocateToTaxCentersPort;
    private final UpdateAllocationPort updateAllocationPort;
    private final RegionalAllocationDtoMapper dtoMapper;

    /**
     * Get regional allocation for a plan
     * 
     * Endpoint: GET /api/v1/backoffice/ap/plans/{planId}/regional-allocation
     * 
     * Returns the allocation breakdown for a specific region and plan.
     * Shows regional level allocation and tax center level breakdown.
     * 
     * @param planId the plan ID
     * @return GenericResponse wrapping RegionalAllocationDto
     */
    @GetMapping("/plans/{planId}/regional-allocation")
    public ResponseEntity<GenericResponse<RegionalAllocationDto>> getRegionalAllocation(
        @PathVariable String planId) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            RegionalAllocationDetail detail = getRegionalAllocationPort.getRegionalAllocation(planUUID);
            
            RegionalAllocationDto dto = dtoMapper.toRegionalAllocationDto(detail);
            
            return ResponseEntity.ok(GenericResponse.success(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "PLAN_NOT_FOUND",
                "Plan not found: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_PLAN_STATUS",
                "Cannot get allocation for plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ALLOCATION_ERROR",
                "Failed to retrieve allocation: " + e.getMessage()
            ));
        }
    }

    /**
     * Allocate a plan to tax centers in a region
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/allocate-to-tax-centers
     * 
     * Regional director allocates the plan to specific tax centers under their region.
     * 
     * Request Body:
     * {
     *   "regionId": "AA",
     *   "taxCenterAllocations": {
     *     "TC-AA-01": { "desk_audit": 1000, "field_audit": 800, ... },
     *     "TC-AA-02": { "desk_audit": 1200, "field_audit": 900, ... },
     *     ...
     *   }
     * }
     * 
     * @param planId the plan ID
     * @param body contains regionId and taxCenterAllocations
     * @return GenericResponse with allocation result
     */
    @PostMapping("/plans/{planId}/allocate-to-tax-centers")
    public ResponseEntity<GenericResponse<AllocationResponseDto>> allocateToTaxCenters(
        @PathVariable String planId,
        @RequestBody Map<String, Object> body) {
        
        try {
            String regionId = (String) body.get("regionId");
            if (regionId == null || regionId.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_REGION",
                    "Region ID is required"
                ));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Integer>> taxCenterAllocations = 
                (Map<String, Map<String, Integer>>) body.get("taxCenterAllocations");
            
            if (taxCenterAllocations == null || taxCenterAllocations.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_ALLOCATIONS",
                    "Tax center allocations are required"
                ));
            }
            
            UUID planUUID = UUID.fromString(planId);
            String regionalDirectorId = "REGIONAL_DIRECTOR_001"; // TODO: Get from security context
            
            allocateToTaxCentersPort.allocateToTaxCenters(
                planUUID,
                regionId,
                taxCenterAllocations,
                regionalDirectorId
            );
            
            AllocationResponseDto response = AllocationResponseDto.builder()
                .planId(planId)
                .regionId(regionId)
                .message("Plan allocated to tax centers successfully")
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
                "Cannot allocate plan: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "ALLOCATION_ERROR",
                "Failed to allocate plan: " + e.getMessage()
            ));
        }
    }

    /**
     * Update a tax center allocation
     * 
     * Endpoint: PUT /api/v1/backoffice/ap/allocations/{allocationId}
     * 
     * Regional director can update individual tax center allocations.
     * 
     * Request Body:
     * {
     *   "auditTypeId": "desk_audit",
     *   "newCount": 950
     * }
     * 
     * @param allocationId the allocation ID
     * @param body contains auditTypeId and newCount
     * @return GenericResponse with update result
     */
    @PutMapping("/allocations/{allocationId}")
    public ResponseEntity<GenericResponse<AllocationResponseDto>> updateAllocation(
        @PathVariable String allocationId,
        @RequestBody Map<String, Object> body) {
        
        try {
            String auditTypeId = (String) body.get("auditTypeId");
            if (auditTypeId == null || auditTypeId.trim().isEmpty()) {
                return ResponseEntity.ok(GenericResponse.error(
                    "MISSING_AUDIT_TYPE",
                    "Audit type ID is required"
                ));
            }
            
            Integer newCount = ((Number) body.get("newCount")).intValue();
            if (newCount == null || newCount < 0) {
                return ResponseEntity.ok(GenericResponse.error(
                    "INVALID_COUNT",
                    "New count must be >= 0"
                ));
            }
            
            UUID allocationUUID = UUID.fromString(allocationId);
            String regionalDirectorId = "REGIONAL_DIRECTOR_001"; // TODO: Get from security context
            
            updateAllocationPort.updateAllocation(
                allocationUUID,
                auditTypeId,
                newCount,
                regionalDirectorId
            );
            
            AllocationResponseDto response = AllocationResponseDto.builder()
                .allocationId(allocationId)
                .message("Allocation updated successfully")
                .success(true)
                .build();
            
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error(
                "INVALID_INPUT",
                "Invalid input: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error(
                "UPDATE_ERROR",
                "Failed to update allocation: " + e.getMessage()
            ));
        }
    }
}
