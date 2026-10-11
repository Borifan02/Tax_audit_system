package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.GetRegionalAllocationPort;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.RegionalAllocationDetail;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * GetRegionalAllocationUseCase - Application Use Case
 * 
 * Implements GetRegionalAllocationPort.
 * Retrieves the regional allocation for a plan.
 * 
 * For Phase B MVP, returns placeholder allocation structure.
 * In full implementation, would fetch from RegionalAllocationRepository.
 */
@Component
public class GetRegionalAllocationUseCase implements GetRegionalAllocationPort {
    
    private final AnnualAuditPlanRepository planRepository;
    
    public GetRegionalAllocationUseCase(AnnualAuditPlanRepository planRepository) {
        this.planRepository = planRepository;
    }
    
    @Override
    public RegionalAllocationDetail getRegionalAllocation(UUID planId) {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + planId));
        
        // Check plan status - must be DIRECTOR_APPROVED
        if (!"DIRECTOR_APPROVED".equals(plan.getStatus())) {
            throw new IllegalStateException(
                "Plan is not approved. Current status: " + plan.getStatus()
            );
        }
        
        // For Phase B MVP, return empty allocation structure
        // In full implementation, would fetch from database
        Map<String, Integer> allocationByAuditType = new HashMap<>();
        allocationByAuditType.put("desk_audit", 0);
        allocationByAuditType.put("field_audit", 0);
        allocationByAuditType.put("joint_audit", 0);
        allocationByAuditType.put("transfer_pricing", 0);
        allocationByAuditType.put("comprehensive", 0);
        allocationByAuditType.put("issue_audit", 0);
        
        return RegionalAllocationDetail.builder()
            .regionId("")
            .allocationByAuditType(allocationByAuditType)
            .taxCenterAllocations(new HashMap<>())
            .totalAllocated(0L)
            .status("PENDING")
            .build();
    }
}
