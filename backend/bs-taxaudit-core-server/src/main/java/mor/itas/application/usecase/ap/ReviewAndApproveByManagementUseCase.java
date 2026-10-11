package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.ReviewAndApproveByManagementPort;
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
 * ReviewAndApproveByManagementUseCase - Use Case
 * 
 * Implements ReviewAndApproveByManagementPort.
 * 
 * Senior Management reviews and approves final plan.
 * 
 * Flow:
 * 1. Validate plan exists
 * 2. Validate plan is in SUBMITTED_TO_SENIOR_MGMT status
 * 3. APPROVE: Plan status → SENIOR_MGMT_APPROVED (ready for distribution)
 * 4. REJECT: Plan status → AMENDMENT_REQUIRED (back to Director/Planning Team)
 */
@Service
@RequiredArgsConstructor
public class ReviewAndApproveByManagementUseCase implements ReviewAndApproveByManagementPort {
    
    private final AnnualAuditPlanJpaRepository planRepository;
    private final PlanAuditLogJpaRepository auditLogRepository;
    
    @Override
    @Transactional
    public void reviewAndApprove(
            UUID planId,
            String decision,
            String managementId,
            String managementComment) {
        
        // 1. Fetch the plan
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // 2. Validate plan status
        PlanStatusEnum status = plan.getStatus();
        if (status != PlanStatusEnum.SUBMITTED_TO_SENIOR_MGMT) {
            throw new IllegalStateException(
                "Cannot review plan in status: " + status + ". " +
                "Plan must be in SUBMITTED_TO_SENIOR_MGMT or SUBMITTED_TO_SENIOR_MANAGEMENT status."
            );
        }
        
        // 3. Validate decision
        if (!"APPROVE".equalsIgnoreCase(decision) && !"REJECT".equalsIgnoreCase(decision)) {
            throw new IllegalArgumentException(
                "Invalid decision. Must be APPROVE or REJECT. Got: " + decision
            );
        }
        
        // 4. Apply decision
        if ("APPROVE".equalsIgnoreCase(decision)) {
            // Plan approved by Senior Management → ready for distribution
            plan.setStatus(PlanStatusEnum.SENIOR_MGMT_APPROVED);
            
            PlanAuditLogEntity auditLog = new PlanAuditLogEntity(
                UUID.randomUUID(),
                plan,
                "SENIOR_MGMT_APPROVED",
                managementId,
                "SENIOR_MANAGEMENT",
                managementComment != null ? managementComment : "Plan approved by Senior Management"
            );
            auditLogRepository.save(auditLog);
        } else {
            // Plan rejected → back to planning team for re-amendment
            plan.setStatus(PlanStatusEnum.AMENDMENT_REQUIRED);
            
            PlanAuditLogEntity auditLogReject = new PlanAuditLogEntity(
                UUID.randomUUID(),
                plan,
                "SENIOR_MANAGEMENT_REJECTED",
                managementId,
                "SENIOR_MANAGEMENT",
                managementComment != null ? managementComment : "Plan rejected by Senior Management"
            );
            auditLogRepository.save(auditLogReject);
        }
        
        plan.setUpdatedAt(OffsetDateTime.now());
        planRepository.save(plan);
    }
}
