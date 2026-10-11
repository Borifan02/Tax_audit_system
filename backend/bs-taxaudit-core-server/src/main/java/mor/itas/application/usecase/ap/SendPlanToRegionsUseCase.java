package mor.itas.application.usecase.ap;

import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.RegionalDeploymentEntity;
import mor.itas.persistence.jpa.entity.ap.RegionalPlanAccessEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalDeploymentRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalPlanAccessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * SendPlanToRegionsUseCase - Director sends approved plan to all regions
 * 
 * STEP 2: Director sends the approved plan to regions
 * - Creates regional deployment records for each region
 * - Grants regional access to the plan
 * - Saves regional allocation data
 * - Plan is NOW visible to regions
 * 
 * IMPORTANT: Only after this step can regions see and work with the plan!
 */
@Service
@RequiredArgsConstructor
public class SendPlanToRegionsUseCase {

    private final AnnualAuditPlanJpaRepository planRepository;
    private final RegionalDeploymentRepository deploymentRepository;
    private final RegionalPlanAccessRepository accessRepository;

    private static final String[] REGION_CODES = {"FED", "AA", "BA", "BB", "AB", "CA", "SO"};
    
    // Map region codes to distribution keys (case-insensitive matching)
    private static final java.util.Map<String, String> REGION_CODE_TO_DIST_KEY = java.util.Map.ofEntries(
        java.util.Map.entry("FED", "federal_level"),
        java.util.Map.entry("AA", "addis_ababa"),
        java.util.Map.entry("BA", "amhara"),
        java.util.Map.entry("BB", "oromia"),
        java.util.Map.entry("AB", "dire_dawa"),
        java.util.Map.entry("CA", "snnpr"),
        java.util.Map.entry("SO", "somali")
    );

    @Transactional
    public AnnualAuditPlanEntity execute(UUID planId, String directorId, String deploymentNote) {
        // 1. Fetch the plan
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        // 2. Verify plan is approved
        if (plan.getStatus() != PlanStatusEnum.DIRECTOR_APPROVED) {
            throw new IllegalStateException(
                "Plan must be DIRECTOR_APPROVED before sending to regions. Current: " + plan.getStatus()
            );
        }

        // 3. Get regional allocations from the distribution data
        Map<String, Map<String, Integer>> distribution = plan.getDistribution();
        if (distribution == null || distribution.isEmpty()) {
            throw new IllegalStateException("Plan has no distribution data - cannot send to regions");
        }

        // 4. Create deployment records for each region
        int deploymentCount = 0;
        for (String regionCode : REGION_CODES) {
            // Map region code (AA, BA, etc.) to distribution key (addis_ababa, amhara, etc.)
            String distKey = REGION_CODE_TO_DIST_KEY.get(regionCode);
            if (distKey == null) {
                // Try lowercase version as fallback
                distKey = regionCode.toLowerCase();
            }
            
            // Get allocation for this region — try distKey (name) first, then regionCode (code)
            Map<String, Integer> regionAllocation = distribution.get(distKey);
            if (regionAllocation == null || regionAllocation.isEmpty()) {
                regionAllocation = distribution.get(regionCode);
            }
            
            if (regionAllocation != null && !regionAllocation.isEmpty()) {
                // Upsert: check if deployment already exists (from previous attempt)
                RegionalDeploymentEntity deployment = deploymentRepository.findByPlanIdAndRegionCode(planId, regionCode).orElse(null);
                if (deployment == null) {
                    deployment = new RegionalDeploymentEntity(planId, regionCode, directorId);
                }
                deployment.setRegionId(regionCode);
                deployment.setDeployedBy(directorId);
                deployment.setDeployedAt(OffsetDateTime.now());
                deployment.setStatus("SENT_TO_REGIONS");
                deployment.setDeploymentNote(deploymentNote);
                deployment.setSentAt(OffsetDateTime.now());
                deployment.setDirectorId(directorId);
                
                // Store regional allocated cases
                deployment.setRegionAllocatedCases(regionAllocation);
                
                deploymentRepository.save(deployment);
                
                deploymentCount++;
            }
        }

        if (deploymentCount == 0) {
            throw new IllegalStateException("No valid regional allocations found - plan must have allocations for at least one region");
        }

        // 5. Update plan status
        plan.setStatus(PlanStatusEnum.AWAITING_REGIONAL_FEEDBACK);
        plan.setSentToRegionsBy(directorId);
        plan.setSentToRegionsAt(OffsetDateTime.now());
        plan.setRegionsReceivedCount(deploymentCount);
        plan.setUpdatedAt(OffsetDateTime.now());

        // 6. Save and return
        return planRepository.save(plan);
    }
}
