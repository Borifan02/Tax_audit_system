package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.SubmitToSeniorManagementPort;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.entity.ap.PlanAuditLogEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.PlanAuditLogJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * SubmitToSeniorManagementUseCase - Use Case
 * 
 * Implements SubmitToSeniorManagementPort.
 * 
 * Director submits final amended plan to Senior Management for approval.
 * 
 * Flow:
 * 1. Validate plan exists and is in proper state
 * 2. Update plan status to SUBMITTED_TO_SENIOR_MGMT
 * 3. Record submission metadata
 * 4. Create audit log entry
 */
@Service
@RequiredArgsConstructor
public class SubmitToSeniorManagementUseCase implements SubmitToSeniorManagementPort {
    
    private final AnnualAuditPlanJpaRepository planRepository;
    private final PlanAuditLogJpaRepository auditLogRepository;
    
    @Override
    @Transactional
    public void submitToSeniorManagement(
            UUID planId,
            String directorId,
            String directorComment) {
        
        // 1. Fetch the plan
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // 2. Validate plan status - should be DIRECTOR_APPROVED or FEEDBACK_COLLECTED
        // (Director has reviewed regional feedback, made amendments, and is now submitting)
        PlanStatusEnum status = plan.getStatus();
        if (!isValidStatusForManagementSubmission(status)) {
            throw new IllegalStateException(
                "Cannot submit to management. Plan status: " + status + ". " +
                "Plan must be DIRECTOR_APPROVED or FEEDBACK_COLLECTED."
            );
        }
        
        // 3. Update plan status to SUBMITTED_TO_SENIOR_MGMT
        plan.setStatus(PlanStatusEnum.SUBMITTED_TO_SENIOR_MGMT);
        plan.setUpdatedAt(OffsetDateTime.now());
        planRepository.save(plan);
        
        // 4. Create audit log entry
        PlanAuditLogEntity auditLog = new PlanAuditLogEntity(
            UUID.randomUUID(),
            plan,
            "SUBMITTED_TO_SENIOR_MGMT",
            directorId,
            "DIRECTOR",
            directorComment != null ? directorComment : "Plan submitted to Senior Management for final approval"
        );
        auditLogRepository.save(auditLog);
    }
    
    /**
     * Check if plan is in valid status for management submission
     */
    private boolean isValidStatusForManagementSubmission(PlanStatusEnum status) {
        return status == PlanStatusEnum.DIRECTOR_APPROVED 
            || status == PlanStatusEnum.FEEDBACK_COLLECTED
            || status == PlanStatusEnum.SUBMITTED_TO_DIRECTOR;   // After amendment resubmission
    }
}
