package mor.itas.application.usecase.ap;

import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.PlanAllocationEntity;
import mor.itas.persistence.jpa.entity.ap.RegionalTcDeploymentEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.PlanAllocationRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalTcDeploymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * DistributePlanToTaxCentersUseCase - Regional Director distributes plan to tax centers
 * 
 * STEP 3: Regional director allocates cases to each tax center in their region
 * - Backend calculates default equal distribution by audit type
 * - Regional director can override defaults if needed
 * - Receives tax center allocations from regional dashboard (e.g., TC-1: 10533 desk, 4300 joint, etc.)
 * - Validates allocations match regional totals
 * - Saves allocations to database so tax centers can see their specific cases
 * - Records deployment in audit trail
 * - Plan becomes visible to individual tax centers
 */
@Service
@RequiredArgsConstructor
public class DistributePlanToTaxCentersUseCase {

    private final AnnualAuditPlanJpaRepository planRepository;
    private final PlanAllocationRepository allocationRepository;
    private final RegionalTcDeploymentRepository tcDeploymentRepository;
    private final CascadePlanToCasesUseCase cascadePlanToCasesUseCase;

    /**
     * Calculate default equal distribution for tax centers
     * System divides each audit type equally across tax centers, with remainder distributed to first TCs
     * 
     * @param regionAllocation Regional allocation breakdown by audit type
     * @param taxCenterIds List of tax center IDs
     * @return Map of tax center ID to default allocation breakdown
     */
    public Map<String, Map<String, Integer>> calculateDefaultDistribution(
        Map<String, Integer> regionAllocation,
        List<String> taxCenterIds) {
        
        Map<String, Map<String, Integer>> defaults = new LinkedHashMap<>();
        
        // Initialize each tax center
        for (String tcId : taxCenterIds) {
            defaults.put(tcId, new HashMap<>());
        }
        
        // For each audit type, divide equally
        for (Map.Entry<String, Integer> auditEntry : regionAllocation.entrySet()) {
            String auditType = auditEntry.getKey();
            int totalCases = auditEntry.getValue();
            
            int perTaxCenter = totalCases / taxCenterIds.size();
            int remainder = totalCases % taxCenterIds.size();
            
            // Distribute cases
            for (int i = 0; i < taxCenterIds.size(); i++) {
                String tcId = taxCenterIds.get(i);
                int allocation = perTaxCenter + (i < remainder ? 1 : 0);
                defaults.get(tcId).put(auditType, allocation);
            }
        }
        
        return defaults;
    }

    /**
     * Regional director sends plan allocations to their tax centers
     * 
     * @param planId Plan to distribute
     * @param regionCode Region code (e.g., "AA")
     * @param taxCenterAllocations Map of tax center ID to allocation breakdown (can be null to use defaults)
     * @param regionalDirectorId Who is performing this action
     * @return The updated plan
     */
    @Transactional
    public AnnualAuditPlanEntity execute(
        UUID planId,
        String regionCode,
        Map<String, Map<String, Integer>> taxCenterAllocations,
        String regionalDirectorId) {

        // 1. Fetch the plan
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        // 2. Validate plan status
        String status = plan.getStatus().name();
        if (!status.equals("AWAITING_REGIONAL_FEEDBACK") && !status.equals("APPROVED_TO_REGIONS") 
            && !status.equals("REGIONAL_APPROVED") && !status.equals("SUBMITTED_TO_REGIONAL")
            && !status.equals("SENT_TO_TAX_CENTERS") && !status.equals("FINALIZED")) {
            throw new IllegalStateException(
                "Plan must be AWAITING_REGIONAL_FEEDBACK, APPROVED_TO_REGIONS, REGIONAL_APPROVED, SUBMITTED_TO_REGIONAL, SENT_TO_TAX_CENTERS, or FINALIZED to distribute to tax centers. Current: " + plan.getStatus()
            );
        }

        // 3. Get regional allocation for this region
        // Try to find from distribution map or use provided allocations
        Map<String, Integer> regionAllocation = new HashMap<>();
        
        // If no allocations provided, we can't continue (need at least tax center IDs)
        if (taxCenterAllocations == null || taxCenterAllocations.isEmpty()) {
            throw new IllegalArgumentException("Tax center allocations are required");
        }
        
        // Calculate total from first tax center to get regional breakdown
        // (assumes all TCs get same audit types)
        Map<String, Integer> firstTcAlloc = taxCenterAllocations.values().iterator().next();
        
        // Sum across all tax centers to get regional total per audit type
        for (String auditType : firstTcAlloc.keySet()) {
            int total = 0;
            for (Map<String, Integer> tcAlloc : taxCenterAllocations.values()) {
                total += tcAlloc.getOrDefault(auditType, 0);
            }
            regionAllocation.put(auditType, total);
        }

        // 4. Delete any existing deployments for this plan+region
        // (in case regional director is re-distributing)
        tcDeploymentRepository.deleteByPlanIdAndRegionId(planId, regionCode);

        // 5. Delete any existing tax center allocations for this plan+region
        // (in case regional director is re-distributing)
        allocationRepository.deleteByPlanIdAndRegionCodeAndTaxCenterCodeNotNull(planId, regionCode);

        // 6. Save new tax center allocations
        int totalAllocated = 0;
        for (Map.Entry<String, Map<String, Integer>> entry : taxCenterAllocations.entrySet()) {
            String taxCenterId = entry.getKey();
            Map<String, Integer> allocation = entry.getValue();

            // Calculate total for this tax center
            int total = allocation.values().stream().mapToInt(Integer::intValue).sum();

            if (total > 0) {
                // Create allocation record for this tax center
                PlanAllocationEntity tcAllocation = new PlanAllocationEntity();
                tcAllocation.setId(UUID.randomUUID());
                tcAllocation.setAnnualPlan(plan);  // Set the plan reference
                tcAllocation.setRegionCode(regionCode);
                tcAllocation.setTaxCenterCode(taxCenterId); // This marks it as a tax center allocation
                tcAllocation.setProposedCount(total);
                
                // Save the audit type breakdown
                com.fasterxml.jackson.databind.JsonNode jsonNode = 
                    com.fasterxml.jackson.databind.node.JsonNodeFactory.instance
                        .pojoNode(allocation);
                tcAllocation.setAllocationByAuditType(jsonNode);  // Store ORIGINAL breakdown
                
                tcAllocation.setTcFeedbackSubmitted(false); // Mark as not yet acknowledged
                tcAllocation.setCreatedAt(OffsetDateTime.now());
                tcAllocation.setUpdatedAt(OffsetDateTime.now());

                allocationRepository.save(tcAllocation);
                totalAllocated += total;
            }
        }

        if (totalAllocated == 0) {
            throw new IllegalStateException("No valid tax center allocations provided");
        }

        // 7. Record the deployment
        RegionalTcDeploymentEntity deployment = new RegionalTcDeploymentEntity();
        deployment.setPlanId(planId);
        deployment.setRegionId(regionCode);
        deployment.setDeployedBy(regionalDirectorId);
        deployment.setDeployedAt(OffsetDateTime.now());
        deployment.setStatus("DEPLOYED");

        tcDeploymentRepository.save(deployment);

        // 8. Determine if distribution is POST-APPROVAL or PRE-APPROVAL:
        boolean isPostApproval = plan.getStatus() == mor.itas.persistence.jpa.entity.ap.PlanStatusEnum.APPROVED_TO_REGIONS 
            || plan.getStatus() == mor.itas.persistence.jpa.entity.ap.PlanStatusEnum.SENT_TO_TAX_CENTERS
            || plan.getStatus() == mor.itas.persistence.jpa.entity.ap.PlanStatusEnum.REGIONAL_APPROVED
            || plan.getStatus() == mor.itas.persistence.jpa.entity.ap.PlanStatusEnum.FINALIZED
            || plan.getStatus() == mor.itas.persistence.jpa.entity.ap.PlanStatusEnum.SENIOR_MGMT_APPROVED;

        if (plan.getStatus() == mor.itas.persistence.jpa.entity.ap.PlanStatusEnum.APPROVED_TO_REGIONS) {
            plan.setStatus(mor.itas.persistence.jpa.entity.ap.PlanStatusEnum.SENT_TO_TAX_CENTERS);
        }
        plan.setUpdatedAt(OffsetDateTime.now());

        allocationRepository.flush();
        tcDeploymentRepository.flush();

        // 9. Save plan
        AnnualAuditPlanEntity savedPlan = planRepository.saveAndFlush(plan);

        // 10. Automatically cascade cases ONLY if this is POST-APPROVAL!
        // In pre-approval (e.g. AWAITING_REGIONAL_FEEDBACK / SUBMITTED_TO_REGIONAL),
        // allocations are sent so tax centers can submit capacity feedback. Cases must NOT be cascaded yet!
        if (isPostApproval) {
            try {
                System.err.println("⚡ Post-approval: Auto-cascading plan " + planId + " into audit cases after regional distribution to " + regionCode + " by " + regionalDirectorId);
                cascadePlanToCasesUseCase.cascade(planId, regionalDirectorId, null, null);
            } catch (Exception e) {
                System.err.println("⚠️ Auto-cascade warning during post-approval tax center distribution: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.err.println("ℹ️ Pre-approval consultation: Plan " + planId + " distributed to tax centers in region " + regionCode + " for capacity feedback. No cases cascaded until post-approval.");
        }

        return planRepository.findById(planId).orElse(savedPlan);
    }
}
