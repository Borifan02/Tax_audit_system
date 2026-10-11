package mor.itas.domain.service.ap;

import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * PlanApprovalService - Domain Service
 * 
 * Implements business logic for plan approval, rejection, and amendment requests.
 * 
 * Business Rules:
 * - Can only approve plans in SUBMITTED_TO_DIRECTOR status
 * - Can only reject plans in SUBMITTED_TO_DIRECTOR status
 * - Can only request amendments for plans in SUBMITTED_TO_DIRECTOR status
 */
@Component
public class PlanApprovalService {
    
    private final AnnualAuditPlanRepository planRepository;
    
    public PlanApprovalService(AnnualAuditPlanRepository planRepository) {
        this.planRepository = planRepository;
    }
    
    /**
     * Approve a plan submitted by planning team
     * 
     * @param planId the plan ID
     * @param directorId the director's user ID
     * @return the updated plan
     * @throws IllegalArgumentException if plan not found
     * @throws IllegalStateException if plan is not in correct status
     */
    public AnnualAuditPlan approvePlan(UUID planId, String directorId) {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + planId));
        
        // Business rule: Can only approve plans awaiting director review
        if (!plan.getStatus().equals(PlanStatus.SUBMITTED_TO_DIRECTOR)) {
            throw new IllegalStateException(
                "Plan cannot be approved. Current status: " + plan.getStatus() + 
                ". Plan must be in SUBMITTED_TO_DIRECTOR status."
            );
        }
        
        // Update plan status
        plan.setStatus(PlanStatus.DIRECTOR_APPROVED);
        
        // Save and return
        return planRepository.update(plan);
    }
    
    /**
     * Reject a plan submitted by planning team
     * 
     * @param planId the plan ID
     * @param reason the rejection reason
     * @param directorId the director's user ID
     * @return the updated plan
     * @throws IllegalArgumentException if plan not found
     * @throws IllegalStateException if plan is not in correct status
     */
    public AnnualAuditPlan rejectPlan(UUID planId, String reason, String directorId) {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + planId));
        
        // Business rule: Can only reject plans awaiting director review
        if (!plan.getStatus().equals(PlanStatus.SUBMITTED_TO_DIRECTOR)) {
            throw new IllegalStateException(
                "Plan cannot be rejected. Current status: " + plan.getStatus() + 
                ". Plan must be in SUBMITTED_TO_DIRECTOR status."
            );
        }
        
        // Update plan status 
        plan.setStatus(PlanStatus.REVISION_REQUESTED);
        
        // Save and return
        return planRepository.update(plan);
    }
    
    /**
     * Request amendments to a plan with detailed feedback
     * 
     * @param planId the plan ID
     * @param feedback the director's feedback/requirements
     * @param directorId the director's user ID
     * @return the updated plan
     * @throws IllegalArgumentException if plan not found
     * @throws IllegalStateException if plan is not in correct status
     */
    public AnnualAuditPlan requestAmendment(UUID planId, String feedback, String directorId) {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + planId));
        
        // Business rule: Accept SUBMITTED_TO_DIRECTOR, AWAITING_REGIONAL_FEEDBACK, or FEEDBACK_COLLECTED
        PlanStatus status = plan.getStatus();
        if (!status.equals(PlanStatus.SUBMITTED_TO_DIRECTOR) && !status.equals(PlanStatus.AWAITING_REGIONAL_FEEDBACK) && !status.equals(PlanStatus.FEEDBACK_COLLECTED)) {
            throw new IllegalStateException(
                "Cannot request amendment. Current status: " + status + 
                ". Plan must be in SUBMITTED_TO_DIRECTOR, AWAITING_REGIONAL_FEEDBACK, or FEEDBACK_COLLECTED status."
            );
        }
        
        // Update plan status and store amendment comment
        plan.setStatus(PlanStatus.AMENDMENT_REQUIRED);
        plan.setAmendmentComment(feedback);
        
        // Save and return
        return planRepository.update(plan);
    }
}
