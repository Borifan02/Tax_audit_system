package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.ApprovePlanPort;
import mor.itas.domain.service.ap.PlanApprovalService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * ApprovePlanUseCase - Application Use Case
 * 
 * Implements ApprovePlanPort.
 * Handles the business logic for approving a plan submitted by the planning team.
 */
@Component
public class ApprovePlanUseCase implements ApprovePlanPort {
    
    private final PlanApprovalService planApprovalService;
    
    public ApprovePlanUseCase(PlanApprovalService planApprovalService) {
        this.planApprovalService = planApprovalService;
    }
    
    @Override
    @Transactional
    public void approvePlan(UUID planId, String directorId) {
        planApprovalService.approvePlan(planId, directorId);
    }
}
