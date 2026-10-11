package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.RejectPlanPort;
import mor.itas.domain.service.ap.PlanApprovalService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * RejectPlanUseCase - Application Use Case
 * 
 * Implements RejectPlanPort.
 * Handles the business logic for rejecting a plan submitted by the planning team.
 */
@Component
public class RejectPlanUseCase implements RejectPlanPort {
    
    private final PlanApprovalService planApprovalService;
    
    public RejectPlanUseCase(PlanApprovalService planApprovalService) {
        this.planApprovalService = planApprovalService;
    }
    
    @Override
    @Transactional
    public void rejectPlan(UUID planId, String reason, String directorId) {
        planApprovalService.rejectPlan(planId, reason, directorId);
    }
}
