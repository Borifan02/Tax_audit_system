package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.PlanQueryPort;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.application.port.outboundport.repositoryport.ap.PlanAuditLogRepositoryPort;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanAllocation;
import mor.itas.domain.model.ap.PlanAuditLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Plan Query Use Case
 * 
 * Implements PlanQueryPort inbound interface.
 * Provides read-only operations for querying plans and statistics.
 * 
 * Hexagonal/DDD: Implements inbound port, uses repository port for data access
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanQueryUseCase implements PlanQueryPort {

    private final AnnualAuditPlanRepository planRepository;
    private final PlanAuditLogRepositoryPort auditLogRepository;

    @Override
    public AnnualAuditPlan getPlanById(UUID planId) {
        return planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
    }

    @Override
    public List<AnnualAuditPlan> getPlans(String statusFilter, Integer fiscalYearFilter, int page, int size) {
        List<AnnualAuditPlan> plans;

        if (statusFilter != null) {
            plans = planRepository.findByStatus(statusFilter);
        } else {
            // If no status filter, return all plans
            plans = planRepository.findAll();
        }

        // Apply fiscal year filter if provided
        if (fiscalYearFilter != null) {
            plans = plans.stream()
                .filter(p -> p.getPlanYear().equals(fiscalYearFilter))
                .toList();
        }

        // Simple pagination
        int total = plans.size();
        int startIdx = Math.min(page * size, total);
        int endIdx = Math.min(startIdx + size, total);
        return plans.subList(startIdx, endIdx);
    }

    @Override
    public Map<String, Long> getPlanStatistics() {
        Map<String, Long> stats = new HashMap<>();

        String[] statuses = {"DRAFT", "SUBMITTED_TO_DIRECTOR", "DIRECTOR_APPROVED",
                            "AWAITING_REGIONAL_FEEDBACK", "FEEDBACK_COLLECTED",
                            "AMENDMENT_REQUIRED", "SUBMITTED_TO_SENIOR_MGMT",
                            "SENIOR_MGMT_APPROVED", "SENIOR_MGMT_REJECTED",
                            "APPROVED_TO_REGIONS", "FINALIZED", "REVISION_REQUESTED"};

        long total = 0;
        for (String status : statuses) {
            List<AnnualAuditPlan> plansWithStatus = planRepository.findByStatus(status);
            long count = plansWithStatus.size();
            total += count;
            stats.put(status, count);
        }

        stats.put("total", total);
        return stats;
    }

    @Override
    public List<?> getRegionalAllocations(UUID planId) {
        AnnualAuditPlan plan = getPlanById(planId);
        return plan.getAllocations().stream()
            .filter(PlanAllocation::isRegionalAllocation)
            .toList();
    }

    @Override
    public List<?> getTaxCenterAllocations(UUID planId) {
        AnnualAuditPlan plan = getPlanById(planId);
        return plan.getAllocations().stream()
            .filter(PlanAllocation::isTaxCenterAllocation)
            .toList();
    }

    @Override
    public List<?> getTaxCenterAllocationsByRegion(UUID planId, String regionCode) {
        AnnualAuditPlan plan = getPlanById(planId);
        return plan.getAllocations().stream()
            .filter(a -> a.isTaxCenterAllocation() && 
                    a.getRegionCode() != null && 
                    a.getRegionCode().equals(regionCode))
            .toList();
    }

    @Override
    public List<?> getAuditLog(UUID planId) {
        // Verify plan exists
        getPlanById(planId);
        // Return audit logs
        return auditLogRepository.findByPlanIdOrderByCreatedAtDesc(planId);
    }

    @Override
    public List<AnnualAuditPlan> getPlansByRegion(String regionCode) {
        // Get all plans and filter to those with allocations for this region
        List<AnnualAuditPlan> allPlans = planRepository.findAll();
        
        return allPlans.stream()
            .filter(plan -> {
                // Check if this plan has distribution for the region
                Map<String, Map<String, Integer>> distribution = plan.getDistribution();
                if (distribution == null) {
                    return false;
                }
                
                // Check if the region code exists in the distribution and has non-zero allocation
                Map<String, Integer> regionDist = distribution.get(regionCode);
                if (regionDist == null || regionDist.isEmpty()) {
                    return false;
                }
                
                // Check if any audit type has non-zero allocation
                return regionDist.values().stream()
                    .anyMatch(count -> count != null && count > 0);
            })
            .toList();
    }

}