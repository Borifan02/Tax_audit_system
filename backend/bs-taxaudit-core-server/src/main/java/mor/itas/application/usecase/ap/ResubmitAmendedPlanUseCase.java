package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.ResubmitAmendedPlanPort;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.entity.ap.PlanAuditLogEntity;
import mor.itas.persistence.jpa.entity.ap.ApPlanRevisionEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.PlanAuditLogJpaRepository;
import mor.itas.persistence.jpa.repository.ap.ApPlanRevisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * ResubmitAmendedPlanUseCase - Use Case
 * 
 * Implements ResubmitAmendedPlanPort.
 * 
 * Processes Planning Team's resubmission of amended plan to Director.
 * 
 * Flow:
 * 1. Validate plan exists and is in AMENDMENT_REQUIRED status
 * 2. Store resubmission tracking in ap_plan_revisions
 * 3. Update plan status to SUBMITTED_TO_DIRECTOR (so Director can review again)
 * 4. Create audit log entry
 */
@Service
@RequiredArgsConstructor
public class ResubmitAmendedPlanUseCase implements ResubmitAmendedPlanPort {
    
    private final AnnualAuditPlanJpaRepository planRepository;
    private final PlanAuditLogJpaRepository auditLogRepository;
    private final ApPlanRevisionRepository revisionRepository;
    
    @Override
    @Transactional
    public void resubmitAmendedPlan(
            UUID planId,
            Integer amendmentRound,
            String planningTeamComments,
            String planningTeamId) {
        
        // 1. Fetch the plan
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // 2. Validate plan status
        PlanStatusEnum status = plan.getStatus();
        if (status != PlanStatusEnum.AMENDMENT_REQUIRED) {
            throw new IllegalStateException(
                "Cannot resubmit plan in status: " + status + ". " +
                "Plan must be in AMENDMENT_REQUIRED status."
            );
        }
        
        // 3. Store resubmission tracking in ap_plan_revisions
        String resubmissionComment = String.format(
            "Amendment Round %d resubmitted. %s",
            amendmentRound,
            planningTeamComments != null ? planningTeamComments : ""
        );
        
        ApPlanRevisionEntity revision = new ApPlanRevisionEntity(
            planId,
            resubmissionComment,
            "AMENDMENT_RESUBMISSION",
            planningTeamId
        );
        revisionRepository.save(revision);
        
        // 4. Update plan status to SUBMITTED_TO_DIRECTOR
        // This puts the amended plan back in Director's queue for review
        plan.setStatus(PlanStatusEnum.SUBMITTED_TO_DIRECTOR);
        plan.setSubmittedToDirectorBy(planningTeamId);
        plan.setSubmittedToDirectorAt(OffsetDateTime.now());
        plan.setUpdatedAt(OffsetDateTime.now());
        planRepository.save(plan);
        
        // 5. Create audit log entry
        PlanAuditLogEntity auditLog = new PlanAuditLogEntity(
            UUID.randomUUID(),
            plan,
            "AMENDED_PLAN_RESUBMITTED_TO_DIRECTOR",
            planningTeamId,
            "PLANNING_TEAM",
            "Amended plan (round " + amendmentRound + ") resubmitted for Director review"
        );
        auditLogRepository.save(auditLog);
    }
}
