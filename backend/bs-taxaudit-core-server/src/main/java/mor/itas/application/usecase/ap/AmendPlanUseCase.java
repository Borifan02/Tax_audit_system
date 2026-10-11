package mor.itas.application.usecase.ap;

import com.fasterxml.jackson.databind.ObjectMapper;
import mor.itas.application.port.inboundport.ap.AmendPlanPort;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.entity.ap.PlanAuditLogEntity;
import mor.itas.persistence.jpa.entity.ap.ApPlanRevisionEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.PlanAuditLogJpaRepository;
import mor.itas.persistence.jpa.repository.ap.ApPlanRevisionRepository;
import mor.itas.domain.service.ap.PlanAmendmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * AmendPlanUseCase - Use Case
 * 
 * Implements AmendPlanPort.
 * 
 * Processes Planning Team's plan amendments based on Director's request.
 * 
 * Flow:
 * 1. Validate plan exists and is in AMENDMENT_REQUIRED status
 * 2. Validate amendment changes
 * 3. Apply amendments to plan distribution (update plan_distribution in DB)
 * 4. Store amendment revision in ap_plan_revisions
 * 5. Create audit log entry
 */
@Service
@RequiredArgsConstructor
public class AmendPlanUseCase implements AmendPlanPort {
    
    private final AnnualAuditPlanJpaRepository planRepository;
    private final PlanAuditLogJpaRepository auditLogRepository;
    private final ApPlanRevisionRepository revisionRepository;
    private final PlanAmendmentService amendmentService;
    private final ObjectMapper objectMapper;
    
    @Override
    @Transactional
    public void amendPlan(
            UUID planId,
            Integer amendmentRound,
            Map<String, Map<String, Integer>> plannedChanges,
            String planningTeamId) {
        
        // 1. Fetch the plan
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // 2. Validate plan status
        PlanStatusEnum status = plan.getStatus();
        if (status != PlanStatusEnum.AMENDMENT_REQUIRED) {
            throw new IllegalStateException(
                "Cannot amend plan in status: " + status + ". " +
                "Plan must be in AMENDMENT_REQUIRED status."
            );
        }
        
        // 3. Validate amendment changes
        amendmentService.validateAmendmentChanges(plannedChanges);
        
        // 4. Build new distribution map from planned changes
        Map<String, Map<String, Integer>> newDistribution = new HashMap<>();
        for (Map.Entry<String, Map<String, Integer>> regionEntry : plannedChanges.entrySet()) {
            String regionKey = regionEntry.getKey();
            Map<String, Integer> auditTypeChanges = regionEntry.getValue();
            
            String normalizedKey = normalizeRegionKey(regionKey);
            newDistribution.put(normalizedKey, new HashMap<>(auditTypeChanges));
        }
        
        // 5. Update plan distribution with amended values
        plan.setDistribution(newDistribution);
        plan.setUpdatedAt(OffsetDateTime.now());
        planRepository.save(plan);
        
        // 6. Store amendment revision in ap_plan_revisions table
        String changeSummary;
        try {
            changeSummary = String.format(
                "Amendment Round %d: %s", 
                amendmentRound, 
                objectMapper.writeValueAsString(plannedChanges)
            );
        } catch (Exception e) {
            changeSummary = "Amendment Round " + amendmentRound + " applied";
        }
        
        ApPlanRevisionEntity revision = new ApPlanRevisionEntity(
            planId,
            changeSummary,
            "PLANNING_TEAM_AMENDMENT",
            planningTeamId
        );
        revisionRepository.save(revision);
        
        // 7. Transition status: AMENDMENT_REQUIRED → SUBMITTED_TO_DIRECTOR
        plan.setStatus(PlanStatusEnum.SUBMITTED_TO_DIRECTOR);
        plan.setUpdatedAt(OffsetDateTime.now());
        planRepository.save(plan);
        
        // 8. Create audit log entry
        PlanAuditLogEntity auditLog = new PlanAuditLogEntity(
            UUID.randomUUID(),
            plan,
            "PLAN_AMENDED_AND_RESUBMITTED",
            planningTeamId,
            "PLANNING_TEAM",
            "Amendment round " + amendmentRound + " applied. Resubmitted to Director."
        );
        auditLogRepository.save(auditLog);
    }
    
    /**
     * Normalize region key from distribution format
     */
    private String normalizeRegionKey(String key) {
        if (key.length() == 2 && key.matches("[A-Z]{2}")) {
            return key;
        }
        return key.toLowerCase();
    }
}
