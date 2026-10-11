package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.GetPendingPlansPort;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * GetPendingPlansUseCase - Application Use Case
 * 
 * Implements GetPendingPlansPort.
 * Retrieves all plans awaiting director review.
 */
@Component
@Transactional(readOnly = true)
public class GetPendingPlansUseCase implements GetPendingPlansPort {
    
    private final AnnualAuditPlanRepository planRepository;
    
    public GetPendingPlansUseCase(AnnualAuditPlanRepository planRepository) {
        this.planRepository = planRepository;
    }
    
    @Override
    public List<AnnualAuditPlan> getPendingPlans() {
        return planRepository.findByStatus("SUBMITTED_TO_DIRECTOR");
    }
}
