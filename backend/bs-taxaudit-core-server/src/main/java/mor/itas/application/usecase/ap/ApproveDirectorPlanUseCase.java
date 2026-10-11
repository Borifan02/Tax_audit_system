package mor.itas.application.usecase.ap;

import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.DirectorApprovalEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.DirectorApprovalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * ApproveDirectorPlanUseCase - Director approves a submitted plan
 * 
 * STEP 1: Director reviews the submitted plan
 * - Saves director's approval decision to database
 * - Updates plan status to DIRECTOR_APPROVED
 * - Creates audit trail entry (via database trigger)
 * 
 * IMPORTANT: Plan is NOT yet visible to regions!
 * Regions only see the plan AFTER director sends it to them (Step 2)
 */
@Service
@RequiredArgsConstructor
public class ApproveDirectorPlanUseCase {

    private final AnnualAuditPlanJpaRepository planRepository;
    private final DirectorApprovalRepository approvalRepository;

    @Transactional
    public AnnualAuditPlanEntity execute(UUID planId, String directorId, String approvalReason) {
        // 1. Fetch the plan
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        // 2. Verify plan is in correct status to be approved
        if (plan.getStatus() != PlanStatusEnum.SUBMITTED_TO_DIRECTOR) {
            throw new IllegalStateException(
                "Plan must be in SUBMITTED_TO_DIRECTOR status. Current: " + plan.getStatus()
            );
        }

        // 3. Save the director's approval decision to database
        // Check if approval already exists (from previous attempt) and update, otherwise create new
        DirectorApprovalEntity approval = approvalRepository.findByPlanId(planId).orElse(null);
        if (approval != null) {
            approval.setDecision(DirectorApprovalEntity.DirectorDecisionEnum.APPROVED);
            approval.setDirectorId(directorId);
            approval.setReason(approvalReason);
            approval.setApprovedAt(OffsetDateTime.now());
            approval.setUpdatedAt(OffsetDateTime.now());
        } else {
            approval = new DirectorApprovalEntity(planId, directorId, DirectorApprovalEntity.DirectorDecisionEnum.APPROVED);
            approval.setReason(approvalReason);
            approval.setApprovedAt(OffsetDateTime.now());
        }
        approvalRepository.save(approval);

        // 4. Check if this is an amended plan (came back after AMENDMENT_REQUIRED)
        // If so, skip DIRECTOR_APPROVED and go directly to SUBMITTED_TO_SENIOR_MGMT
        // because regional feedback was already collected before the amendment
        boolean isAmendedPlan = plan.getAmendmentComment() != null && !plan.getAmendmentComment().isEmpty();
        
        if (isAmendedPlan) {
            // Amended plan: Director approval → Senior Management directly (skip regions)
            plan.setStatus(PlanStatusEnum.SUBMITTED_TO_SENIOR_MGMT);
            System.out.println("\u2705 Amended plan approved - routing directly to Senior Management (skipping regions)");
        } else {
            // First-time plan: Director approval → Send to regions for feedback
            plan.setStatus(PlanStatusEnum.DIRECTOR_APPROVED);
            System.out.println("\u2705 New plan approved - ready to send to regions for feedback");
        }
        plan.setDirectorApprovedBy(directorId);
        plan.setDirectorApprovedAt(OffsetDateTime.now());
        plan.setDirectorApprovalReason(approvalReason);
        plan.setUpdatedAt(OffsetDateTime.now());

        // 5. Save and return
        return planRepository.save(plan);
    }
}
