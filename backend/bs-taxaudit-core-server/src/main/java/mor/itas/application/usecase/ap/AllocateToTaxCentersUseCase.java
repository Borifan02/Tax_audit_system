package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.AllocateToTaxCentersPort;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.service.ap.RegionalAllocationService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * AllocateToTaxCentersUseCase - Application Use Case
 * 
 * Implements AllocateToTaxCentersPort.
 * Handles the business logic for a regional director allocating a plan to tax centers.
 */
@Component
public class AllocateToTaxCentersUseCase implements AllocateToTaxCentersPort {
    
    private final AnnualAuditPlanRepository planRepository;
    private final RegionalAllocationService allocationService;
    
    public AllocateToTaxCentersUseCase(
            AnnualAuditPlanRepository planRepository,
            RegionalAllocationService allocationService) {
        this.planRepository = planRepository;
        this.allocationService = allocationService;
    }
    
    @Override
    @Transactional
    public void allocateToTaxCenters(
            UUID planId,
            String regionId,
            Map<String, Map<String, Integer>> taxCenterAllocations,
            String regionalDirectorId) {
        
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + planId));
        
        // Business rule: Plan must be DIRECTOR_APPROVED
        if (!"DIRECTOR_APPROVED".equals(plan.getStatus())) {
            throw new IllegalStateException(
                "Plan cannot be allocated to tax centers. Current status: " + plan.getStatus() +
                ". Plan must be DIRECTOR_APPROVED."
            );
        }
        
        // Validate tax center allocations
        allocationService.validateTaxCenterAllocations(
            taxCenterAllocations,
            new java.util.HashMap<>() // Placeholder - would get regional allocation from plan
        );
        
        // In full implementation:
        // 1. Create RegionalAllocation records
        // 2. Create TaxCenterAllocation records
        // 3. Save to repository
        // 4. Update plan status to ALLOCATIONS_IN_PROGRESS
        
        // For Phase B MVP, just validate and log
        // TODO: Implement full allocation persistence
    }
}
