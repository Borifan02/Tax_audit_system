package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.GetTaxCenterAllocationPort;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanStatus;
import mor.itas.domain.model.ap.RegionalAllocationDetail;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * GetTaxCenterAllocationUseCase - Use Case
 * 
 * Implements GetTaxCenterAllocationPort.
 * 
 * Retrieves a Tax Center's allocation for a plan.
 * 
 * Flow:
 * 1. Validate plan exists
 * 2. Validate plan is in proper state (DIRECTOR_APPROVED or AWAITING_REGIONAL_FEEDBACK)
 * 3. Build tax center's allocation from regional allocation
 * 4. Return to Tax Center Manager
 */
@Service
@RequiredArgsConstructor
public class GetTaxCenterAllocationUseCase implements GetTaxCenterAllocationPort {
    
    private final AnnualAuditPlanRepository repository;
    
    @Override
    public RegionalAllocationDetail getTaxCenterAllocation(UUID planId, String taxCenterId) {
        // Load plan
        AnnualAuditPlan plan = repository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // Validate plan status
        PlanStatus status = plan.getStatus();
        if (!isValidStatusForTaxCenterFeedback(status.name())) {
            throw new IllegalStateException(
                "Cannot get allocation for plan in status: " + status + ". " +
                "Plan must be in DIRECTOR_APPROVED or AWAITING_REGIONAL_FEEDBACK status."
            );
        }
        
        // Extract tax center's allocation from regional allocation
        // Mock implementation: derive from regional allocations
        Map<String, Integer> taxCenterAllocation = extractTaxCenterAllocationFromPlan(
            plan,
            taxCenterId
        );
        
        // Build and return allocation detail
        return RegionalAllocationDetail.builder()
            .regionId(extractRegionFromTaxCenterId(taxCenterId))
            .allocationByAuditType(taxCenterAllocation)
            .totalAllocated(taxCenterAllocation.values().stream()
                .mapToLong(Long::valueOf)
                .sum())
            .status("ALLOCATED")
            .build();
    }
    
    /**
     * Check if plan is in valid status for tax center feedback
     */
    private boolean isValidStatusForTaxCenterFeedback(String status) {
        return "DIRECTOR_APPROVED".equals(status) ||
               "AWAITING_REGIONAL_FEEDBACK".equals(status) ||
               "ALLOCATED".equals(status);
    }
    
    /**
     * Extract tax center's allocation from plan allocations
     * 
     * Mock: For Addis Ababa tax centers, allocate based on region
     */
    private Map<String, Integer> extractTaxCenterAllocationFromPlan(
            AnnualAuditPlan plan,
            String taxCenterId) {
        
        // Mock allocations for different tax centers
        Map<String, Map<String, Integer>> mockTaxCenterAllocations = new HashMap<>();
        
        // Addis Ababa (AA) Tax Centers
        mockTaxCenterAllocations.put("TC-AA-01", Map.ofEntries(
            Map.entry("desk_audit", 1000),
            Map.entry("field_audit", 800),
            Map.entry("joint_audit", 400),
            Map.entry("transfer_pricing", 200),
            Map.entry("comprehensive", 500),
            Map.entry("issue_audit", 300)
        ));
        
        mockTaxCenterAllocations.put("TC-AA-02", Map.ofEntries(
            Map.entry("desk_audit", 1200),
            Map.entry("field_audit", 900),
            Map.entry("joint_audit", 350),
            Map.entry("transfer_pricing", 300),
            Map.entry("comprehensive", 600),
            Map.entry("issue_audit", 350)
        ));
        
        mockTaxCenterAllocations.put("TC-AA-03", Map.ofEntries(
            Map.entry("desk_audit", 900),
            Map.entry("field_audit", 700),
            Map.entry("joint_audit", 400),
            Map.entry("transfer_pricing", 200),
            Map.entry("comprehensive", 400),
            Map.entry("issue_audit", 350)
        ));
        
        mockTaxCenterAllocations.put("TC-AA-04", Map.ofEntries(
            Map.entry("desk_audit", 1100),
            Map.entry("field_audit", 400),
            Map.entry("joint_audit", 250),
            Map.entry("transfer_pricing", 700),
            Map.entry("comprehensive", 800),
            Map.entry("issue_audit", 400)
        ));
        
        // Oromia (AB) Tax Centers
        mockTaxCenterAllocations.put("TC-OR-01", Map.ofEntries(
            Map.entry("desk_audit", 800),
            Map.entry("field_audit", 1200),
            Map.entry("joint_audit", 300),
            Map.entry("transfer_pricing", 150),
            Map.entry("comprehensive", 400),
            Map.entry("issue_audit", 250)
        ));
        
        // Return allocation for this tax center
        Map<String, Integer> allocation = mockTaxCenterAllocations.get(taxCenterId);
        if (allocation == null) {
            throw new IllegalArgumentException("Tax center not found: " + taxCenterId);
        }
        
        return new HashMap<>(allocation);
    }
    
    /**
     * Extract region code from tax center ID
     * 
     * Example: TC-AA-01 → AA (Addis Ababa)
     */
    private String extractRegionFromTaxCenterId(String taxCenterId) {
        if (taxCenterId == null || taxCenterId.length() < 6) {
            throw new IllegalArgumentException("Invalid tax center ID: " + taxCenterId);
        }
        // Format: TC-XX-NN where XX is region code
        return taxCenterId.substring(3, 5);
    }
}
