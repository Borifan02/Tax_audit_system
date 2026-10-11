package mor.itas.domain.service.ap;

import mor.itas.domain.model.ap.RegionalAllocationDetail;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * RegionalAllocationService - Domain Service
 * 
 * Implements business logic for regional director allocations.
 * 
 * Responsibilities:
 * 1. Validate regional allocation totals match plan
 * 2. Distribute regional allocation to tax centers
 * 3. Ensure all tax centers under a region receive allocations
 * 4. Validate tax center allocations don't exceed regional allocation
 */
@Component
public class RegionalAllocationService {
    
    /**
     * Validate that regional allocation totals match the plan
     * 
     * @param regionalAllocation allocation by audit type for the region
     * @param planAllocation the original plan allocation for this region
     * @throws IllegalArgumentException if totals don't match
     */
    public void validateAllocationTotals(
            Map<String, Integer> regionalAllocation,
            Map<String, Integer> planAllocation) {
        
        if (regionalAllocation == null || planAllocation == null) {
            throw new IllegalArgumentException("Regional and plan allocations cannot be null");
        }
        
        // Verify all audit types are present
        for (String auditType : planAllocation.keySet()) {
            if (!regionalAllocation.containsKey(auditType)) {
                throw new IllegalArgumentException(
                    "Missing allocation for audit type: " + auditType
                );
            }
        }
        
        // Verify totals match
        long regionalTotal = regionalAllocation.values().stream()
            .mapToLong(Long::valueOf)
            .sum();
        
        long planTotal = planAllocation.values().stream()
            .mapToLong(Long::valueOf)
            .sum();
        
        if (regionalTotal != planTotal) {
            throw new IllegalArgumentException(
                "Regional allocation total (" + regionalTotal + ") does not match " +
                "plan allocation total (" + planTotal + ")"
            );
        }
    }
    
    /**
     * Validate that tax center allocations don't exceed regional allocation
     * 
     * @param taxCenterAllocations allocations by tax center
     * @param regionalAllocation the regional allocation
     * @throws IllegalArgumentException if any tax center exceeds regional allocation
     */
    public void validateTaxCenterAllocations(
            Map<String, Map<String, Integer>> taxCenterAllocations,
            Map<String, Integer> regionalAllocation) {
        
        if (taxCenterAllocations == null || taxCenterAllocations.isEmpty()) {
            throw new IllegalArgumentException(
                "At least one tax center allocation is required"
            );
        }
        
        // Calculate totals per audit type
        Map<String, Long> taxCenterTotals = new HashMap<>();
        
        for (Map<String, Integer> tcAlloc : taxCenterAllocations.values()) {
            for (Map.Entry<String, Integer> entry : tcAlloc.entrySet()) {
                String auditType = entry.getKey();
                Long count = entry.getValue().longValue();
                
                taxCenterTotals.merge(auditType, count, Long::sum);
            }
        }
        
        // Verify totals don't exceed regional allocation
        for (Map.Entry<String, Long> entry : taxCenterTotals.entrySet()) {
            String auditType = entry.getKey();
            Long tcTotal = entry.getValue();
            Integer regionalCount = regionalAllocation.get(auditType);
            
            if (regionalCount == null) {
                throw new IllegalArgumentException(
                    "Tax center allocation includes unknown audit type: " + auditType
                );
            }
            
            if (tcTotal > regionalCount) {
                throw new IllegalArgumentException(
                    "Tax center total for " + auditType + " (" + tcTotal + ") exceeds " +
                    "regional allocation (" + regionalCount + ")"
                );
            }
        }
    }
    
    /**
     * Create regional allocation detail from inputs
     * 
     * @param regionId the region code
     * @param regionalAllocation allocation by audit type
     * @param taxCenterAllocations allocation by tax center
     * @return the regional allocation detail
     */
    public RegionalAllocationDetail createAllocationDetail(
            String regionId,
            Map<String, Integer> regionalAllocation,
            Map<String, Map<String, Integer>> taxCenterAllocations) {
        
        // Validate inputs
        validateAllocationTotals(regionalAllocation, regionalAllocation);
        validateTaxCenterAllocations(taxCenterAllocations, regionalAllocation);
        
        // Calculate total allocated
        long totalAllocated = regionalAllocation.values().stream()
            .mapToLong(Long::valueOf)
            .sum();
        
        return RegionalAllocationDetail.builder()
            .regionId(regionId)
            .allocationByAuditType(regionalAllocation)
            .taxCenterAllocations(taxCenterAllocations)
            .totalAllocated(totalAllocated)
            .status("ALLOCATED")
            .build();
    }
}
