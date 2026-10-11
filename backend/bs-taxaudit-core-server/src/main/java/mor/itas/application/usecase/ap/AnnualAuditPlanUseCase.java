package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.CreatePlanRequest;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.application.port.outboundport.riskengine.RiskEnginePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnnualAuditPlanUseCase {

    private final AnnualAuditPlanRepository repository;
    private final RiskEnginePort riskEnginePort;

    @Transactional
    public AnnualAuditPlan createPlan(CreatePlanRequest request, String actorId) {
        // Generate UUID for the plan FIRST so allocations can reference it
        java.util.UUID planId = java.util.UUID.randomUUID();
        AnnualAuditPlan plan = new AnnualAuditPlan(planId, request.getPlanYear(), request.getPlanName(), actorId);

        // Add regional allocations from request
        if (request.getRegionalAllocations() != null) {
            request.getRegionalAllocations().forEach(ra -> {
                mor.itas.domain.model.ap.PlanAllocation allocation = new mor.itas.domain.model.ap.PlanAllocation(
                    java.util.UUID.randomUUID(),
                    plan.getId(),
                    null,  // No tax center code for regional allocations
                    ra.getRegionCode(),
                    ra.getProposedCount()
                );
                plan.addAllocation(allocation);
            });
        }

        return repository.save(plan);
    }

    @Transactional
    public AnnualAuditPlan submitTaxCenterFeedback(java.util.UUID planId, java.util.UUID allocationId, Integer adjustedCount, String justification, String actorId, String userTaxCenter) {
        AnnualAuditPlan plan = repository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + planId));
        
        mor.itas.domain.model.ap.PlanAllocation allocation = plan.getAllocations().stream()
            .filter(a -> a.getId().equals(allocationId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Allocation not found with id: " + allocationId));
            
        // Security check: Tax Center Manager can only edit their own allocation
        if (!allocation.getTaxCenterCode().equals(userTaxCenter)) {
            throw new SecurityException("User does not have permission to edit feedback for tax center: " + allocation.getTaxCenterCode());
        }
            
        allocation.submitFeedback(adjustedCount, justification);
        
        return repository.update(plan);
    }
}
